"""UrbanDigs ingestion — Manhattan contract-signed leading indicator.

Contracts close in ~30-60 days, so these are the highest-actionability outreach
targets. If URBANDIGS_ENABLED=false or the API key is missing, we skip (never
scrape the paywalled site).

Stubbed client: `_fetch_live` returns [] with a warning when no key is set.
`dry_run=True` loads the bundled fixture so end-to-end runs still have data.
"""
from __future__ import annotations

import hashlib
from datetime import date, datetime, timedelta, timezone

import httpx

from ..config import CONFIG
from ..db import as_json, insert_many, tx
from ..fixtures import render
from ..utils.logging import get_logger
from ..utils.rate_limit import RateLimiter
from ..utils.retry import retry_with_backoff

log = get_logger("urbandigs")
_LIMITER = RateLimiter(min_interval_seconds=0.5)
MIN_PRICE = 4_000_000


@retry_with_backoff(max_attempts=4)
async def _fetch_live(lookback_days: int) -> list[dict]:
    if not CONFIG.urbandigs_enabled or not CONFIG.urbandigs_api_key or not CONFIG.urbandigs_base_url:
        log.info("UrbanDigs disabled or unconfigured — skipping")
        return []
    start = (date.today() - timedelta(days=lookback_days)).isoformat()
    headers = {
        "Authorization": f"Bearer {CONFIG.urbandigs_api_key}",
        "User-Agent": CONFIG.scraper_user_agent,
    }
    url = f"{CONFIG.urbandigs_base_url.rstrip('/')}/contracts"
    params = {
        "min_price": MIN_PRICE,
        "borough": "Manhattan",
        "contract_date_gte": start,
    }
    async with _LIMITER:
        async with httpx.AsyncClient(headers=headers, timeout=30.0) as client:
            resp = await client.get(url, params=params)
    if resp.status_code == 404:
        log.warning("UrbanDigs endpoint 404 — verify API availability")
        return []
    resp.raise_for_status()
    payload = resp.json()
    return payload.get("data", payload) if isinstance(payload, dict) else payload


def _fixture_fetch(lookback_days: int) -> list[dict]:
    cutoff = date.today() - timedelta(days=lookback_days)
    rows = render("urbandigs.json")
    return [
        r for r in rows
        if int(r.get("contract_price", 0)) >= MIN_PRICE
        and datetime.fromisoformat(r["contract_date"]).date() >= cutoff
    ]


def _borough_int(label: str | None) -> int | None:
    if not label:
        return None
    s = label.lower().strip()
    return {"manhattan": 1, "brooklyn": 3}.get(s)


async def ingest(lookback_days: int, *, dry_run: bool, end_date=None) -> list[dict]:
    # UrbanDigs contract-signed data is a leading indicator; backfills typically
    # don't need historical contracts (they've already closed), so we accept
    # end_date for API symmetry but don't use it for filtering beyond lookback.
    _ = end_date
    if dry_run:
        log.info("UrbanDigs: dry-run mode, using built-in fixtures")
        rows = _fixture_fetch(lookback_days)
    else:
        rows = await _fetch_live(lookback_days)

    now = datetime.now(timezone.utc).isoformat()
    raw_rows = []
    events = []
    for r in rows:
        cid = r["contract_id"]
        price = int(r.get("contract_price") or 0)
        if price < MIN_PRICE:
            continue
        building = r.get("building") or ""
        unit = r.get("unit") or ""
        contract_date = r.get("contract_date")
        dedup_key = f"ud:{hashlib.sha1(f'{building}|{unit}|{contract_date}'.encode()).hexdigest()[:16]}"
        event_id = hashlib.sha1(dedup_key.encode()).hexdigest()[:16]

        raw_rows.append(
            {
                "contract_id": cid,
                "payload": as_json(r),
                "fetched_at": now,
            }
        )
        events.append(
            {
                "event_id": event_id,
                "source": "urbandigs",
                "dedup_key": dedup_key,
                "bbl": None,
                "address": f"{building}, {unit}" if unit else building,
                "apartment": unit,
                "borough": _borough_int(r.get("borough")),
                "sale_price": price,
                "sale_date": None,
                "contract_date": contract_date,
                "asset_type": r.get("asset_type") or "condo",
                "document_id": None,
                "raw_buyer_names": as_json([]),
                "raw_seller_names": as_json([]),
                "listing_agent": r.get("listing_agent"),
                "selling_agent": r.get("selling_agent"),
                "first_seen": now,
                "ingested_at": now,
            }
        )

    with tx() as conn:
        insert_many(conn, "raw_urbandigs", raw_rows)
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
                ON CONFLICT(event_id) DO UPDATE SET ingested_at=excluded.ingested_at
                """,
                e,
            )

    log.info("UrbanDigs: ingested %d contracts", len(events))
    return events
