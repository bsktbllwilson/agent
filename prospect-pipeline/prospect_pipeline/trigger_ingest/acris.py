"""ACRIS ingestion — real property (condos, townhouses, commercial).

Three Socrata endpoints are joined on `document_id`:
  - Master (bnx9-e6tj)   — sale price, doc type, recorded borough, dates
  - Legals (8h5j-fqxa)   — BBL + address
  - Parties (636b-3b5g)  — buyer (party_type=2), seller (party_type=1)

Filter:
    doc_type in (DEED, DEEDO)
    doc_amount >= 4_000_000
    recorded_borough in (1, 3)
    document_date within lookback window

Returns normalized `TriggerEvent` dicts ready to insert into `trigger_events`.
"""
from __future__ import annotations

import hashlib
from datetime import date, datetime, timedelta, timezone
from typing import Any

from ..db import as_json, insert_many, tx
from ..fixtures import render
from ..utils.logging import get_logger
from . import socrata

log = get_logger("acris")

MASTER_URL = "https://data.cityofnewyork.us/resource/bnx9-e6tj.json"
LEGALS_URL = "https://data.cityofnewyork.us/resource/8h5j-fqxa.json"
PARTIES_URL = "https://data.cityofnewyork.us/resource/636b-3b5g.json"

MIN_PRICE = 4_000_000
BOROUGHS = ("1", "3")  # Manhattan + Brooklyn
DEED_TYPES = ("DEED", "DEEDO")


def _borough_int(v: Any) -> int | None:
    try:
        return int(v)
    except (TypeError, ValueError):
        return None


def _to_int(v: Any) -> int | None:
    if v is None:
        return None
    try:
        return int(float(v))
    except (TypeError, ValueError):
        return None


def _asset_type_from_legal(legal: dict | None) -> str:
    if not legal:
        return "unknown"
    unit = (legal.get("addr_unit") or "").strip()
    # Rough heuristic — we refine with RPTT's building_class_category when present.
    return "condo" if unit else "townhouse"


def _normalize_address(legal: dict) -> str:
    if not legal:
        return ""
    num = (legal.get("street_number") or "").strip()
    street = (legal.get("street_name") or "").strip().title()
    unit = (legal.get("addr_unit") or "").strip()
    base = f"{num} {street}".strip()
    if unit:
        base += f", {unit}"
    return base


async def _fetch_master(lookback_days: int) -> list[dict]:
    start = (date.today() - timedelta(days=lookback_days)).isoformat()
    boroughs = ",".join(f"'{b}'" for b in BOROUGHS)
    deeds = ",".join(f"'{d}'" for d in DEED_TYPES)
    where = (
        f"doc_type in ({deeds}) "
        f"AND doc_amount >= {MIN_PRICE} "
        f"AND recorded_borough in ({boroughs}) "
        f"AND document_date >= '{start}T00:00:00.000'"
    )
    return await socrata.query_all(MASTER_URL, where)


async def _fetch_legals(doc_ids: list[str]) -> dict[str, dict]:
    """Batch legals by chunked `document_id in (...)` queries. Returns a map."""
    if not doc_ids:
        return {}
    out: dict[str, dict] = {}
    chunk = 200
    for i in range(0, len(doc_ids), chunk):
        batch = doc_ids[i : i + chunk]
        ids_csv = ",".join(f"'{d}'" for d in batch)
        where = f"document_id in ({ids_csv})"
        rows = await socrata.query_all(LEGALS_URL, where)
        # A document may have multiple legals (combined lots); keep first residential one.
        for r in rows:
            out.setdefault(r["document_id"], r)
    return out


async def _fetch_parties(doc_ids: list[str]) -> dict[str, dict[str, list[str]]]:
    """Returns {document_id: {"buyers": [...], "sellers": [...]}}."""
    if not doc_ids:
        return {}
    out: dict[str, dict[str, list[str]]] = {}
    chunk = 200
    for i in range(0, len(doc_ids), chunk):
        batch = doc_ids[i : i + chunk]
        ids_csv = ",".join(f"'{d}'" for d in batch)
        where = f"document_id in ({ids_csv})"
        rows = await socrata.query_all(PARTIES_URL, where)
        for r in rows:
            d = out.setdefault(r["document_id"], {"buyers": [], "sellers": []})
            name = (r.get("name") or "").strip()
            if not name:
                continue
            if str(r.get("party_type")) == "2":
                d["buyers"].append(name)
            elif str(r.get("party_type")) == "1":
                d["sellers"].append(name)
    return out


def _fixture_fetch(lookback_days: int) -> tuple[list[dict], dict[str, dict], dict[str, dict[str, list[str]]]]:
    """Return fixture data filtered to lookback window + $4M+ + boroughs."""
    cutoff = date.today() - timedelta(days=lookback_days)
    master = render("acris_master.json")
    legals = render("acris_legals.json")
    parties = render("acris_parties.json")

    keep_master = []
    for m in master:
        try:
            ddate = datetime.fromisoformat(m["document_date"].replace("Z", "")).date()
        except ValueError:
            continue
        if ddate < cutoff:
            continue
        if m.get("doc_type") not in DEED_TYPES:
            continue
        if int(float(m.get("doc_amount", 0))) < MIN_PRICE:
            continue
        if str(m.get("recorded_borough")) not in BOROUGHS:
            continue
        keep_master.append(m)

    keep_ids = {m["document_id"] for m in keep_master}
    legals_map = {l["document_id"]: l for l in legals if l["document_id"] in keep_ids}
    parties_map: dict[str, dict[str, list[str]]] = {}
    for p in parties:
        if p["document_id"] not in keep_ids:
            continue
        d = parties_map.setdefault(p["document_id"], {"buyers": [], "sellers": []})
        if str(p.get("party_type")) == "2":
            d["buyers"].append(p["name"])
        elif str(p.get("party_type")) == "1":
            d["sellers"].append(p["name"])
    return keep_master, legals_map, parties_map


async def ingest(lookback_days: int, *, dry_run: bool) -> list[dict]:
    """Ingest ACRIS transactions. Persists raw rows to raw_acris and
    normalized records to trigger_events. Returns list of normalized events."""
    if dry_run:
        log.info("ACRIS: dry-run mode, using built-in fixtures")
        master, legals_map, parties_map = _fixture_fetch(lookback_days)
    else:
        log.info("ACRIS: fetching master (lookback=%d days)", lookback_days)
        master = await _fetch_master(lookback_days)
        log.info("ACRIS: master returned %d rows", len(master))
        doc_ids = [m["document_id"] for m in master]
        legals_map = await _fetch_legals(doc_ids)
        parties_map = await _fetch_parties(doc_ids)

    now = datetime.now(timezone.utc).isoformat()
    raw_rows: list[dict] = []
    events: list[dict] = []

    for m in master:
        doc_id = m["document_id"]
        legal = legals_map.get(doc_id)
        parties = parties_map.get(doc_id, {"buyers": [], "sellers": []})
        bbl = (legal or {}).get("bbl")
        address = _normalize_address(legal) if legal else ""
        apartment = (legal or {}).get("addr_unit") or ""
        asset_type = _asset_type_from_legal(legal)
        sale_price = _to_int(m.get("doc_amount")) or 0
        try:
            sale_date = m["document_date"][:10]
        except Exception:
            sale_date = None

        dedup_key = f"acris:{doc_id}"
        event_id = hashlib.sha1(dedup_key.encode()).hexdigest()[:16]

        raw_rows.append(
            {
                "document_id": doc_id,
                "payload": as_json(
                    {
                        "master": m,
                        "legal": legal,
                        "parties": parties,
                    }
                ),
                "fetched_at": now,
            }
        )

        events.append(
            {
                "event_id": event_id,
                "source": "acris",
                "dedup_key": dedup_key,
                "bbl": bbl,
                "address": address,
                "apartment": apartment,
                "borough": _borough_int(m.get("recorded_borough")),
                "sale_price": sale_price,
                "sale_date": sale_date,
                "contract_date": None,
                "asset_type": asset_type,
                "document_id": doc_id,
                "raw_buyer_names": as_json(parties["buyers"]),
                "raw_seller_names": as_json(parties["sellers"]),
                "listing_agent": None,
                "selling_agent": None,
                "first_seen": now,
                "ingested_at": now,
            }
        )

    with tx() as conn:
        insert_many(conn, "raw_acris", raw_rows)
        # trigger_events is upserted via ON CONFLICT to keep first_seen stable
        for e in events:
            conn.execute(
                """
                INSERT INTO trigger_events
                    (event_id, source, dedup_key, bbl, address, apartment, borough,
                     sale_price, sale_date, contract_date, asset_type, document_id,
                     raw_buyer_names, raw_seller_names, listing_agent, selling_agent,
                     first_seen, ingested_at)
                VALUES (:event_id, :source, :dedup_key, :bbl, :address, :apartment, :borough,
                        :sale_price, :sale_date, :contract_date, :asset_type, :document_id,
                        :raw_buyer_names, :raw_seller_names, :listing_agent, :selling_agent,
                        :first_seen, :ingested_at)
                ON CONFLICT(event_id) DO UPDATE SET
                    ingested_at=excluded.ingested_at,
                    raw_buyer_names=excluded.raw_buyer_names,
                    raw_seller_names=excluded.raw_seller_names
                """,
                e,
            )

    log.info("ACRIS: ingested %d $4M+ deeds", len(events))
    return events
