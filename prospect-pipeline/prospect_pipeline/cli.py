"""`prospect-pipeline` CLI.

Usage:
    prospect-pipeline prospect-week [--lookback-days N] [--dry-run]
    prospect-pipeline resolve-buyer <name_or_llc>
    prospect-pipeline holdings-report <name>
    prospect-pipeline mark-contacted <prospect_id>
    prospect-pipeline push-to-crm <prospect_id> [--target hubspot|salesforce]
    prospect-pipeline seed-agents <building_address>
    prospect-pipeline backfill --start YYYY-MM-DD --end YYYY-MM-DD
"""
from __future__ import annotations

import asyncio
import json
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

import click

from . import __version__
from . import healthcheck as healthcheck_mod
from .buyer_resolver import cascade as cascade_mod
from .buyer_resolver import tier4_press
from .buyer_resolver import tier5_holdings
from .config import CONFIG
from .contact_enricher import clay
from .db import as_json, init_db, tx
from .dossier import briefing_md, csv_export, writer, xlsx_export
from .profiler import claude_classifier
from .routing import attorney_routing, managing_agents
from .suppression import is_suppressed, mark_contacted as _mark_contacted, mark_do_not_contact
from .trigger_ingest import acris, deduper, rptt, urbandigs
from .utils.logging import get_logger, setup_logging
from .utils.names import canonical_person_name

log = get_logger("cli")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def _run_prospect_week(lookback_days: int, dry_run: bool) -> dict:
    setup_logging()
    init_db()
    managing_agents.seed_database()
    if dry_run:
        tier4_press.seed_dry_run_index()

    started = _now()
    errors: list[str] = []
    api_calls: dict[str, int] = {}
    credits: dict[str, float] = {}

    # Trigger ingest
    log.info("=== trigger ingest ===")
    acris_events = await acris.ingest(lookback_days, dry_run=dry_run)
    rptt_events = await rptt.ingest(lookback_days, dry_run=dry_run)
    ud_events = await urbandigs.ingest(lookback_days, dry_run=dry_run)
    api_calls["acris"] = len(acris_events)
    api_calls["rptt"] = len(rptt_events)
    api_calls["urbandigs"] = len(ud_events)

    # Dedupe
    log.info("=== dedupe ===")
    stats = deduper.dedupe()

    # Active set
    events = deduper.active_events()
    log.info("=== resolving %d events ===", len(events))

    # Cascade
    resolutions = await cascade_mod.resolve_all(events, dry_run=dry_run, concurrency=4)
    resolutions_by_event = {r.event_id: r for r in resolutions}

    # Contact enrichment + classification + dossier writing
    log.info("=== enrich + classify + persist ===")
    suppressed_count = 0
    final_prospects: list[dict] = []
    for event in events:
        res = resolutions_by_event.get(event["event_id"])
        if not res:
            continue

        # Contact enrichment. Canonicalize "LAST, FIRST" ACRIS names before
        # handing to Clay so the waterfall can match on the common form.
        contact: dict[str, Any] = {}
        enrich_name = canonical_person_name(res.resolved_name) if res.resolved_name else None
        if enrich_name:
            contact = await clay.enrich(
                prospect_id=None,
                name=enrich_name,
                firm=res.primary_firm,
                dry_run=dry_run,
            )
            credits["clay"] = credits.get("clay", 0) + 1.0

        # Managing-agent route for co-ops / unresolved
        mg = None
        if event.get("asset_type") == "coop" or not res.resolved_name:
            mg = managing_agents.find_agent_for_building(event.get("address") or "")

        # Classification
        ctx = {
            "resolved_name": res.resolved_name,
            "primary_firm": contact.get("firm") or res.primary_firm,
            "title": contact.get("title") or res.title,
            "holdings_count": len(res.other_nyc_holdings),
            "attorney_firm": res.attorney_firm,
            "trigger_address": event.get("address"),
            "trigger_price": event.get("sale_price"),
            "trigger_asset_type": event.get("asset_type"),
            "raw_context": json.dumps(res.tier_evidence, default=str)[:4000],
        }
        cls = claude_classifier.classify(ctx, dry_run=dry_run)

        # Routing
        rec_channel, route_evidence = attorney_routing.pick_channel(
            work_email=contact.get("work_email"),
            work_phone=contact.get("work_phone"),
            selling_agent=res.selling_agent,
            attorney_firm=res.attorney_firm,
            managing_agent=mg,
        )

        # Build dossier row. Canonicalize "LAST, FIRST" into display form.
        raw_name = res.resolved_name or (
            json.loads(event.get("raw_buyer_names") or "[]")[0:1] or ["Unresolved"]
        )[0]
        legal_name = canonical_person_name(raw_name)
        row = {
            "legal_name": legal_name,
            "resolved_principal": res.resolved_principal,
            "confidence": res.confidence,
            "resolution_path": ",".join(res.resolution_path) or None,
            "buyer_type": cls.get("buyer_type"),
            "primary_firm": contact.get("firm") or res.primary_firm,
            "title": contact.get("title") or res.title,
            "estimated_net_worth_band": cls.get("estimated_net_worth_band"),
            "known_affiliations": as_json(cls.get("known_affiliations") or []),
            "geography_signal": cls.get("geography_signal"),
            "other_nyc_holdings": as_json(res.other_nyc_holdings),
            "holdings_count": len(res.other_nyc_holdings),
            "work_email": contact.get("work_email"),
            "work_phone": contact.get("work_phone"),
            "linkedin_url": contact.get("linkedin_url"),
            "assistant_contact": contact.get("assistant_contact"),
            "attorney_firm": res.attorney_firm,
            "managing_agent": mg["name"] if mg else None,
            "broker_to_contact": res.selling_agent,
            "recommended_channel": rec_channel,
            "outreach_angle": cls.get("outreach_angle"),
            "sensitivity_flags": as_json(cls.get("sensitivity_flags") or []),
            "last_trigger_event_id": event["event_id"],
            "first_seen_date": _now(),
            "last_contacted_date": None,
            "outreach_status": "open",
        }
        pid = writer.upsert_prospect(row)
        row["prospect_id"] = pid
        if is_suppressed(pid):
            suppressed_count += 1
            continue
        # Pack trigger fields for briefing
        row["trigger_address"] = event.get("address")
        row["trigger_price"] = event.get("sale_price")
        row["trigger_asset_type"] = event.get("asset_type")
        row["source"] = event.get("source")
        row["sensitivity_flags"] = cls.get("sensitivity_flags") or []
        row["known_affiliations"] = cls.get("known_affiliations") or []
        row["other_nyc_holdings"] = res.other_nyc_holdings
        final_prospects.append(row)

    # Partition for the briefing
    hot = [p for p in final_prospects if p["confidence"] == "high" and (p.get("work_email") or p.get("work_phone"))]
    warm = [p for p in final_prospects if p not in hot and p["confidence"] in ("high", "medium")]
    indirect = [p for p in final_prospects if p["confidence"] not in ("high", "medium")]
    contracts = [p for p in final_prospects if p.get("source") == "urbandigs"]
    top5 = sorted(hot, key=lambda p: -(p.get("trigger_price") or 0))[:5]

    # Write outputs
    out_dir = Path(CONFIG.output_dir)
    today = date.today().isoformat()
    csv_path = out_dir / f"prospects_{today}.csv"
    xlsx_path = out_dir / f"prospects_{today}.xlsx"
    md_path = out_dir / f"briefing_{today}.md"

    csv_export.write_csv(final_prospects, csv_path)
    xlsx_export.write_xlsx(final_prospects, contracts, xlsx_path)
    briefing_md.write_briefing(
        md_path,
        as_of_date=date.today(),
        lookback_days=lookback_days,
        suppression_days=CONFIG.outreach_suppression_days,
        totals={
            "trigger_events": len(events),
            "prospects": len(final_prospects),
            "hot": len(hot),
            "warm": len(warm),
            "indirect": len(indirect),
            "contracts": len(contracts),
        },
        top5=top5,
        warm=warm,
        indirect=indirect,
        contracts=contracts,
    )

    # Log the run
    finished = _now()
    with tx() as conn:
        conn.execute(
            """
            INSERT INTO run_log
                (started_at, finished_at, mode, dry_run, lookback_days,
                 trigger_events_ingested, prospects_resolved, api_calls,
                 credits_consumed, errors, notes)
            VALUES (?, ?, 'weekly', ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                started, finished, 1 if dry_run else 0, lookback_days,
                len(events), len(final_prospects),
                as_json(api_calls), as_json(credits),
                as_json(errors),
                f"suppressed={suppressed_count} dedupe_matched={stats['matched']}",
            ),
        )

    return {
        "csv": str(csv_path),
        "xlsx": str(xlsx_path),
        "briefing": str(md_path),
        "totals": {
            "trigger_events": len(events),
            "prospects": len(final_prospects),
            "hot": len(hot),
            "warm": len(warm),
            "indirect": len(indirect),
            "contracts": len(contracts),
            "suppressed": suppressed_count,
            "dedupe_matched": stats["matched"],
        },
    }


@click.group()
@click.version_option(__version__)
def main():
    """NYC $4M+ luxury-buyer prospecting pipeline."""


@main.command("prospect-week")
@click.option("--lookback-days", type=int, default=7, show_default=True,
              help="Lookback window for trigger events.")
@click.option("--dry-run", is_flag=True, default=False,
              help="Use bundled fixtures and heuristic classification. No network.")
def prospect_week(lookback_days: int, dry_run: bool):
    """Main weekly run: ingest → dedupe → resolve → enrich → classify → write."""
    result = asyncio.run(_run_prospect_week(lookback_days, dry_run))
    click.echo(json.dumps(result, indent=2))


@main.command("resolve-buyer")
@click.argument("name_or_llc")
@click.option("--dry-run", is_flag=True, default=False)
def resolve_buyer(name_or_llc: str, dry_run: bool):
    """One-off buyer lookup via the cascade (Tiers 2 + 3 primarily)."""
    async def _run():
        setup_logging()
        init_db()
        from .buyer_resolver import tier2_marketproof as t2
        from .buyer_resolver import tier3_nydos as t3d
        t2_res = await t2.lookup(name_or_llc, dry_run=dry_run)
        t3_res = await t3d.lookup(name_or_llc, dry_run=dry_run)
        return {"tier2": t2_res, "tier3_nydos": t3_res}
    click.echo(json.dumps(asyncio.run(_run()), indent=2, default=str))


@main.command("holdings-report")
@click.argument("name")
def holdings_report(name: str):
    """Enumerate all NYC properties tied to this entity or principal."""
    setup_logging()
    init_db()
    rows = tier5_holdings.holdings_for(name)
    click.echo(json.dumps(rows, indent=2, default=str))


@main.command("mark-contacted")
@click.argument("prospect_id")
@click.option("--notes", default=None)
def mark_contacted(prospect_id: str, notes: str | None):
    """Record a contact against a prospect; will suppress for 90 days by default."""
    setup_logging()
    init_db()
    _mark_contacted(prospect_id, notes=notes)
    click.echo(f"marked contacted: {prospect_id}")


@main.command("do-not-contact")
@click.argument("prospect_id")
@click.option("--notes", default=None)
def do_not_contact(prospect_id: str, notes: str | None):
    """Permanently suppress a prospect."""
    setup_logging()
    init_db()
    mark_do_not_contact(prospect_id, notes=notes)
    click.echo(f"do-not-contact: {prospect_id}")


@main.command("push-to-crm")
@click.argument("prospect_id")
@click.option("--target", type=click.Choice(["hubspot", "salesforce"]), default="hubspot")
@click.option("--dry-run", is_flag=True, default=False)
def push_to_crm(prospect_id: str, target: str, dry_run: bool):
    """Push a single prospect dossier to the configured CRM."""
    async def _run():
        setup_logging()
        init_db()
        with tx() as conn:
            row = conn.execute("SELECT * FROM prospects WHERE prospect_id=?", (prospect_id,)).fetchone()
        if not row:
            raise click.ClickException(f"prospect not found: {prospect_id}")
        p = dict(row)
        if target == "hubspot":
            from .crm import hubspot
            return await hubspot.push_prospect(p, dry_run=dry_run)
        from .crm import salesforce
        return await salesforce.push_prospect(p, dry_run=dry_run)
    click.echo(json.dumps(asyncio.run(_run()), indent=2, default=str))


@main.command("seed-agents")
@click.argument("building_address")
@click.option("--dry-run", is_flag=True, default=False)
def seed_agents(building_address: str, dry_run: bool):
    """Scrape CityRealty / PropertyShark to grow the managing-agents YAML / DB."""
    async def _run():
        setup_logging()
        init_db()
        managing_agents.seed_database()
        return await managing_agents.seed_from_address(building_address, dry_run=dry_run)
    click.echo(json.dumps(asyncio.run(_run()), indent=2, default=str))


@main.command("backfill")
@click.option("--start", "start_", required=True, type=click.DateTime(formats=["%Y-%m-%d"]))
@click.option("--end", "end_", required=True, type=click.DateTime(formats=["%Y-%m-%d"]))
@click.option("--dry-run", is_flag=True, default=False)
def backfill(start_: datetime, end_: datetime, dry_run: bool):
    """Historical backfill over (start, end]. Uses the same pipeline with
    an extended lookback computed from the range."""
    today = date.today()
    start_d = start_.date()
    if start_d > today:
        raise click.ClickException("start date is in the future")
    lookback = (today - start_d).days
    result = asyncio.run(_run_prospect_week(lookback, dry_run))
    click.echo(json.dumps(result, indent=2))


@main.command("init-db")
def init_db_cmd():
    """Create the SQLite schema and seed managing_agents from YAML."""
    setup_logging()
    init_db()
    n = managing_agents.seed_database()
    click.echo(f"schema initialized; seeded {n} managing agents")


@main.command("health-check")
@click.option("--skip-network", is_flag=True, default=False,
              help="Skip live Socrata / Anthropic probes.")
@click.option("--skip-smoke", is_flag=True, default=False,
              help="Skip the end-to-end dry-run smoke test (faster).")
@click.option("--json", "as_json_out", is_flag=True, default=False,
              help="Emit JSON summary instead of human-readable report.")
def health_check(skip_network: bool, skip_smoke: bool, as_json_out: bool):
    """Pre-flight check for scheduled deployment. Exits non-zero on any FAIL.

    Typical use from cron/systemd:

        ExecStartPre=/opt/prospect-pipeline/.venv/bin/python -m prospect_pipeline.cli health-check --skip-smoke
    """
    setup_logging()
    res = healthcheck_mod.run_all(skip_network=skip_network, skip_smoke=skip_smoke)
    if as_json_out:
        click.echo(json.dumps(res.summary(), indent=2))
    else:
        click.echo(healthcheck_mod.format_report(res))
    if res.failed:
        sys.exit(1)


@main.command("list-agents")
def list_agents_cmd():
    """Print all managing agents in the DB with building counts."""
    setup_logging()
    init_db()
    managing_agents.seed_database()
    agents = managing_agents.all_agents()
    for a in agents:
        bcount = len(a.get("buildings") or [])
        click.echo(f"{a['name']:<45}  {bcount:>3} bldg(s)  src={a['source']}")
        for b in a.get("buildings") or []:
            click.echo(f"    - {b}")


@main.command("add-building")
@click.argument("agent_name")
@click.argument("building_address")
def add_building_cmd(agent_name: str, building_address: str):
    """Attach a building to an existing managing agent (or create a new one)."""
    setup_logging()
    init_db()
    managing_agents.seed_database()
    added = managing_agents.attach_building(agent_name, building_address)
    if added:
        click.echo(f"linked {building_address!r} -> {agent_name}")
    else:
        click.echo(f"already linked: {building_address!r} -> {agent_name}")


@main.command("bulk-seed-agents")
@click.argument("json_path", type=click.Path(exists=True, dir_okay=False))
def bulk_seed_cmd(json_path: str):
    """Bulk import building->agent mappings from a JSON file.

    Expected format:
        [
          {"agent": "FirstService Residential New York", "buildings": ["111 West 57 Street", ...]},
          ...
        ]
    """
    setup_logging()
    init_db()
    managing_agents.seed_database()
    data = json.loads(Path(json_path).read_text())
    added = 0
    for entry in data:
        agent = entry.get("agent")
        for b in entry.get("buildings") or []:
            if managing_agents.attach_building(agent, b):
                added += 1
    click.echo(f"added {added} new building links from {json_path}")


if __name__ == "__main__":
    main()
