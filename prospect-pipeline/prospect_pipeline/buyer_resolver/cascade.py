"""Buyer resolution cascade orchestrator.

For each trigger event:
    Tier 1 (ACRIS parties): if a named individual, stop — confidence=high
    Tier 4 (press):          always try, high-confidence when journalist names buyer
    Tier 2 (Marketproof):    only for entity buyers, unmask principal
    Tier 3 (PropertyShark):  BBL-level filings
    Tier 3 (NY DOS):         LLC registered agent + service address -> law firm
    Tier 5 (holdings):       always, once a name is picked — annotate holdings
    Tier 6 (agents):         always in parallel, capture listing/selling agents

Resolution picks the highest-confidence named_principal across Tiers 1/2/4 in
that priority. Attorney + managing-agent hints are accumulated regardless.
"""
from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

from ..db import as_json, tx
from ..utils.logging import get_logger
from . import tier1_acris_parties as t1
from . import tier2_marketproof as t2
from . import tier3_nydos as t3_dos
from . import tier3_propertyshark as t3_ps
from . import tier4_press as t4
from . import tier5_holdings as t5
from . import tier6_agents as t6

log = get_logger("cascade")

CONFIDENCE_RANK = {"high": 3, "medium": 2, "low": 1, None: 0}


@dataclass
class Resolution:
    event_id: str
    resolved_name: str | None = None
    resolved_principal: str | None = None
    confidence: str | None = None
    resolution_path: list[str] = field(default_factory=list)
    primary_firm: str | None = None
    title: str | None = None
    attorney_firm: str | None = None
    other_nyc_holdings: list[dict] = field(default_factory=list)
    listing_agent: str | None = None
    selling_agent: str | None = None
    tier_evidence: dict[str, Any] = field(default_factory=dict)


def _log_tier(event_id: str, tier: int, tier_name: str, source: str | None,
              resolved_name: str | None, confidence: str | None, evidence: dict) -> None:
    now = datetime.now(timezone.utc).isoformat()
    with tx() as conn:
        conn.execute(
            """
            INSERT INTO buyer_resolutions
                (event_id, tier, tier_name, source, resolved_name, confidence, evidence, ran_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (event_id, tier, tier_name, source, resolved_name, confidence, as_json(evidence), now),
        )


def _better(a: str | None, b: str | None) -> bool:
    return CONFIDENCE_RANK.get(a, 0) > CONFIDENCE_RANK.get(b, 0)


async def resolve_event(event: dict, *, dry_run: bool) -> Resolution:
    eid = event["event_id"]
    res = Resolution(event_id=eid)

    # Tier 6 always runs in parallel. Kick it off early.
    tier6_task = asyncio.create_task(asyncio.to_thread(t6.capture, event))

    # Tier 4 (press): always try; high-confidence beats LLC fallback.
    tier4_task = asyncio.create_task(asyncio.to_thread(t4.lookup, event))

    # Tier 1
    t1_res = t1.resolve(event)
    _log_tier(eid, 1, "acris_parties", "acris", t1_res["resolved_name"],
              t1_res["confidence"], t1_res["evidence"])
    res.tier_evidence["tier1"] = t1_res
    if t1_res["resolved_name"] and not t1_res["needs_entity_unmask"]:
        # Named individual — this is our best answer for now.
        res.resolved_name = t1_res["resolved_name"]
        res.confidence = t1_res["confidence"]
        res.resolution_path.append("tier1_acris_parties")

    # Tier 4 (await)
    t4_res = await tier4_task
    _log_tier(eid, 4, "press", t4_res.get("evidence", {}).get("publication"),
              t4_res.get("resolved_name"), t4_res.get("confidence"), t4_res.get("evidence", {}))
    res.tier_evidence["tier4"] = t4_res
    if t4_res.get("resolved_name") and _better(t4_res.get("confidence"), res.confidence):
        res.resolved_name = t4_res["resolved_name"]
        res.confidence = t4_res["confidence"]
        res.resolution_path.append("tier4_press")

    # Tier 2 (Marketproof) — only if we have an entity to unmask
    entity_name: str | None = None
    if t1_res.get("needs_entity_unmask"):
        entity_name = t1_res.get("resolved_name")
    elif not res.resolved_name:
        # RPTT-only or UrbanDigs events with no ACRIS parties — we may still have
        # a seller-side name or no name at all. Not much Marketproof can do.
        entity_name = None

    if entity_name:
        t2_res = await t2.lookup(entity_name, dry_run=dry_run)
        _log_tier(eid, 2, "marketproof", "marketproof",
                  t2_res.get("resolved_name"), t2_res.get("confidence"), t2_res.get("evidence", {}))
        res.tier_evidence["tier2"] = t2_res
        if t2_res.get("resolved_name"):
            principal = t2_res["resolved_name"]
            res.resolved_principal = principal
            if _better(t2_res.get("confidence"), res.confidence):
                res.resolved_name = principal
                res.confidence = t2_res.get("confidence")
            firm = (t2_res.get("evidence") or {}).get("principal_firm")
            title = (t2_res.get("evidence") or {}).get("principal_title")
            if firm:
                res.primary_firm = firm
            if title:
                res.title = title
            res.resolution_path.append("tier2_marketproof")

    # Tier 3 — PropertyShark on BBL
    t3ps_res = await t3_ps.lookup(event.get("bbl"), dry_run=dry_run)
    _log_tier(eid, 3, "propertyshark", "propertyshark",
              None, None, t3ps_res.get("evidence", {}))
    res.tier_evidence["tier3_propertyshark"] = t3ps_res
    ps_ev = t3ps_res.get("evidence") or {}
    if ps_ev.get("filing_attorney_firm"):
        res.attorney_firm = ps_ev["filing_attorney_firm"]

    # Tier 3 — NY DOS on each entity buyer (cache aggressively)
    entity_buyers = [b for b in (t1_res.get("evidence") or {}).get("all_buyers", []) if t1.is_entity_name(b)] \
        or ([entity_name] if entity_name else [])
    nydos_firms: list[str] = []
    nydos_addrs: list[str] = []
    for ent in entity_buyers:
        t3dos_res = await t3_dos.lookup(ent, dry_run=dry_run)
        _log_tier(eid, 3, "nydos", "nydos", None, None, t3dos_res.get("evidence", {}))
        if t3dos_res.get("matched_law_firm"):
            nydos_firms.append(t3dos_res["matched_law_firm"])
        if t3dos_res.get("service_address"):
            nydos_addrs.append(t3dos_res["service_address"])
    res.tier_evidence["tier3_nydos"] = {"firms": nydos_firms, "service_addresses": nydos_addrs}
    if nydos_firms and not res.attorney_firm:
        res.attorney_firm = nydos_firms[0]

    # Tier 5 — holdings on the final picked name (or entity)
    target = res.resolved_name or entity_name or ""
    if target:
        holdings = await asyncio.to_thread(t5.holdings_for, target)
        # Exclude the current trigger so we don't double-count
        holdings = [h for h in holdings if h["event_id"] != eid]
        res.other_nyc_holdings = holdings
        _log_tier(eid, 5, "holdings", "local",
                  target, None, {"count": len(holdings)})

    # Tier 6 agents (await)
    t6_res = await tier6_task
    _log_tier(eid, 6, "agents", t6_res.get("source"), None, None, t6_res.get("evidence", {}))
    res.listing_agent = t6_res.get("listing_agent")
    res.selling_agent = t6_res.get("selling_agent")

    log.info(
        "cascade: event=%s resolved=%s confidence=%s path=%s attorney=%s agents=(%s|%s)",
        eid,
        res.resolved_name,
        res.confidence,
        ",".join(res.resolution_path) or "none",
        res.attorney_firm,
        res.listing_agent,
        res.selling_agent,
    )
    return res


async def resolve_all(events: list[dict], *, dry_run: bool, concurrency: int = 4) -> list[Resolution]:
    sem = asyncio.Semaphore(concurrency)

    async def _run(e: dict) -> Resolution:
        async with sem:
            try:
                return await resolve_event(e, dry_run=dry_run)
            except Exception as exc:
                log.exception("cascade failure for %s: %s", e.get("event_id"), exc)
                return Resolution(event_id=e["event_id"])

    return await asyncio.gather(*[_run(e) for e in events])
