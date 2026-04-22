"""RPTT ingestion — co-ops + all transfers with tax filings.

Resource: 7yay-m4ae (verify current ID at runtime; DOF occasionally rotates).
If Socrata returns 404, fall back to DOF Rolling Sales Excel files.

Filter:
    sale_price >= 4_000_000
    borough in (1, 3)
    sale_date within lookback
    sale_price >= 10   # exclude placeholder transfers

Co-op flag: `building_class_category` starting with "09" -> asset_type="coop".
Flag (don't exclude) records where buyer and seller name tokens match — these
are usually intra-family transfers but occasionally legitimate sales.
"""
from __future__ import annotations

import hashlib
from datetime import date, datetime, timedelta, timezone
from typing import Any

import httpx

from ..config import CONFIG
from ..db import as_json, insert_many, tx
from ..fixtures import render
from ..utils.logging import get_logger
from . import socrata

log = get_logger("rptt")

DATASET_URL = "https://data.cityofnewyork.us/resource/7yay-m4ae.json"
ROLLING_SALES_PAGE = (
    "https://www.nyc.gov/site/finance/property/property-rolling-sales-data.page"
)
MIN_PRICE = 4_000_000
BOROUGHS = ("1", "3")


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


def _asset_type(bcc: str | None) -> str:
    if not bcc:
        return "unknown"
    bcc = bcc.strip()
    if bcc.startswith("09"):
        return "coop"
    if bcc.startswith("13") or bcc.startswith("15"):
        return "condo"
    if bcc.startswith("01") or bcc.startswith("02"):
        return "townhouse"
    return "unknown"


def _dedup_hash(bbl: str, apartment: str, sale_date: str, sale_price: int) -> str:
    raw = f"{bbl}|{apartment}|{sale_date}|{sale_price}"
    return hashlib.sha1(raw.encode()).hexdigest()[:20]


def _row_hash(row: dict) -> str:
    # Stable hash for raw storage (the dataset has no primary key).
    blob = f"{row.get('borough')}|{row.get('block')}|{row.get('lot')}|{row.get('apartment_number')}|{row.get('sale_date')}|{row.get('sale_price')}"
    return hashlib.sha1(blob.encode()).hexdigest()


def _make_bbl(row: dict) -> str:
    borough = str(row.get("borough") or "").strip()
    block = str(row.get("block") or "").strip().zfill(5)
    lot = str(row.get("lot") or "").strip().zfill(4)
    if not borough:
        return ""
    return f"{borough}{block}{lot}"


def _flag_family_transfer(row: dict) -> bool:
    """Buyer-seller token overlap suggests family transfer; flag for review."""
    buyer = str(row.get("buyer_name") or "").upper()
    seller = str(row.get("seller_name") or "").upper()
    if not buyer or not seller:
        return False
    btoks = {t for t in buyer.replace(",", " ").split() if len(t) >= 3}
    stoks = {t for t in seller.replace(",", " ").split() if len(t) >= 3}
    stopwords = {"LLC", "TRUST", "ESTATE", "THE", "AND"}
    btoks -= stopwords
    stoks -= stopwords
    return bool(btoks & stoks)


async def _fetch_socrata(lookback_days: int) -> list[dict]:
    start = (date.today() - timedelta(days=lookback_days)).isoformat()
    boroughs = ",".join(f"'{b}'" for b in BOROUGHS)
    where = (
        f"sale_price >= {MIN_PRICE} "
        f"AND borough in ({boroughs}) "
        f"AND sale_date >= '{start}T00:00:00.000'"
    )
    return await socrata.query_all(DATASET_URL, where)


async def _fetch_fallback_xlsx(lookback_days: int) -> list[dict]:
    """Fallback: scrape DOF Rolling Sales page for Excel links, parse with pandas.
    Returns an empty list if the page isn't reachable."""
    try:
        import pandas as pd
        from bs4 import BeautifulSoup
    except ImportError:
        log.warning("RPTT fallback needs pandas + beautifulsoup4")
        return []

    headers = {"User-Agent": CONFIG.scraper_user_agent}
    try:
        async with httpx.AsyncClient(headers=headers, timeout=30.0) as client:
            resp = await client.get(ROLLING_SALES_PAGE)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "html.parser")
            xlsx_links = [
                a["href"] for a in soup.find_all("a", href=True)
                if a["href"].endswith(".xlsx")
                and ("manhattan" in a["href"].lower() or "brooklyn" in a["href"].lower())
            ]
    except httpx.HTTPError as e:
        log.warning("RPTT rolling-sales fallback failed: %s", e)
        return []

    rows: list[dict] = []
    cutoff = date.today() - timedelta(days=lookback_days)
    for link in xlsx_links:
        url = link if link.startswith("http") else f"https://www.nyc.gov{link}"
        try:
            async with httpx.AsyncClient(headers=headers, timeout=60.0) as client:
                resp = await client.get(url)
                resp.raise_for_status()
            # pandas reads in-memory bytes via BytesIO
            import io
            df = pd.read_excel(io.BytesIO(resp.content), skiprows=4)
            df.columns = [str(c).strip().lower().replace(" ", "_") for c in df.columns]
            for _, r in df.iterrows():
                try:
                    sale_price = int(r.get("sale_price") or 0)
                    sd = r.get("sale_date")
                    sd = pd.to_datetime(sd).date() if sd is not None else None
                except Exception:
                    continue
                if sale_price < MIN_PRICE or not sd or sd < cutoff:
                    continue
                rows.append({k: (None if pd.isna(v) else v) for k, v in r.items()})
        except Exception as e:
            log.warning("RPTT xlsx parse failed for %s: %s", url, e)

    return rows


def _fixture_fetch(lookback_days: int) -> list[dict]:
    cutoff = date.today() - timedelta(days=lookback_days)
    rows = render("rptt.json")
    keep = []
    for r in rows:
        try:
            sd = datetime.fromisoformat(r["sale_date"].replace("Z", "")).date()
        except (ValueError, KeyError):
            continue
        if sd < cutoff:
            continue
        if str(r.get("borough")) not in BOROUGHS:
            continue
        sp = int(float(r.get("sale_price") or 0))
        if sp < MIN_PRICE:
            # placeholder transfers (<$10) should be filtered here too
            continue
        keep.append(r)
    return keep


async def ingest(lookback_days: int, *, dry_run: bool) -> list[dict]:
    """Ingest RPTT transactions. Returns normalized events flagged as
    `source="rptt_only"`; dedupe against ACRIS happens in `deduper`."""
    if dry_run:
        log.info("RPTT: dry-run mode, using built-in fixtures")
        rows = _fixture_fetch(lookback_days)
    else:
        log.info("RPTT: fetching (lookback=%d days)", lookback_days)
        try:
            rows = await _fetch_socrata(lookback_days)
        except httpx.HTTPError as e:
            log.warning("RPTT Socrata resource failed (%s); falling back to rolling sales", e)
            rows = await _fetch_fallback_xlsx(lookback_days)
        log.info("RPTT: got %d rows", len(rows))

    now = datetime.now(timezone.utc).isoformat()
    raw_rows = []
    events = []
    for r in rows:
        sp = _to_int(r.get("sale_price")) or 0
        if sp < 10:
            continue  # placeholder transfer
        family_flag = _flag_family_transfer(r)
        try:
            sale_date = r["sale_date"][:10] if isinstance(r["sale_date"], str) else str(r["sale_date"])[:10]
        except Exception:
            sale_date = None

        bbl = _make_bbl(r)
        apartment = str(r.get("apartment_number") or "").strip()
        asset = _asset_type(r.get("building_class_category"))
        dedup_key = f"rptt:{_dedup_hash(bbl, apartment, sale_date or '', sp)}"
        event_id = hashlib.sha1(dedup_key.encode()).hexdigest()[:16]

        raw_rows.append(
            {
                "row_hash": _row_hash(r),
                "payload": as_json(r),
                "fetched_at": now,
            }
        )
        events.append(
            {
                "event_id": event_id,
                "source": "rptt_only",  # downgraded to "rptt_matched" during dedup if ACRIS matches
                "dedup_key": dedup_key,
                "bbl": bbl,
                "address": r.get("address"),
                "apartment": apartment,
                "borough": _borough_int(r.get("borough")),
                "sale_price": sp,
                "sale_date": sale_date,
                "contract_date": None,
                "asset_type": asset,
                "document_id": None,
                "raw_buyer_names": as_json([]),   # RPTT rarely carries parties
                "raw_seller_names": as_json([]),
                "listing_agent": None,
                "selling_agent": None,
                "first_seen": now,
                "ingested_at": now,
            }
        )
        if family_flag:
            # Store the flag in the payload so downstream can surface it
            raw_rows[-1]["payload"] = as_json({**r, "_flags": ["family_transfer_candidate"]})

    with tx() as conn:
        insert_many(conn, "raw_rptt", raw_rows)
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

    log.info("RPTT: ingested %d events", len(events))
    return events
