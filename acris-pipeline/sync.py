"""ACRIS → Airtable nightly pipeline.

Pulls $4M+ residential deeds from NYC Open Data ACRIS, enriches with PLUTO
building area, tags ownership structure, and upserts to Airtable.
"""

import argparse
import logging
import os
import re
import sys
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Any, Iterable

import requests
from pyairtable import Api

SOCRATA_BASE = "https://data.cityofnewyork.us/resource/{id}.json"
DATASET_MASTER = "bnx9-e6tj"
DATASET_LEGALS = "8h5j-fqxa"
DATASET_PARTIES = "636b-3b5g"
DATASET_PLUTO = "64uk-42ks"

SOCRATA_PAGE_SIZE = 50000
AIRTABLE_UPSERT_CHUNK = 10

DEED_DOC_TYPES = ("DEED", "DEEDO", "RPTT")
MORTGAGE_DOC_TYPES = ("MTGE", "AGMT", "MTGC")
TARGET_BOROUGHS = ("1", "3")
PRICE_FLOOR = 4_000_000

BOROUGHS = {"1": "Manhattan", "3": "Brooklyn"}

PROPERTY_TYPES = {
    "SC": "Condo", "RC": "Condo",
    "A0": "1-Fam", "A1": "1-Fam", "A2": "1-Fam", "A3": "1-Fam", "A4": "1-Fam",
    "A5": "1-Fam", "A6": "1-Fam", "A7": "1-Fam", "A8": "1-Fam", "A9": "1-Fam",
    "B1": "2-Fam", "B2": "2-Fam", "B3": "2-Fam", "B9": "2-Fam",
    "C0": "3-Fam",
}

LLC_RE = re.compile(r"\b(LLC|L\.L\.C\.?|LTD|LIMITED|HOLDINGS?)\b", re.IGNORECASE)
TRUST_RE = re.compile(
    r"\b(TRUST|TRUSTEE|REVOCABLE|IRREVOCABLE|U/T/A|U/A|FAMILY\s+TRUST)\b",
    re.IGNORECASE,
)
CORP_RE = re.compile(
    r"\b(INC\.?|CORP\.?|CORPORATION|INCORPORATED|CO\.?)\b", re.IGNORECASE
)
PARTNERSHIP_RE = re.compile(
    r"\b(LP|L\.P\.?|PARTNERS?|PARTNERSHIP)\b", re.IGNORECASE
)
FOREIGN_HINTS = re.compile(
    r"\b(BVI|CAYMAN|JERSEY|ISLE OF MAN|BERMUDA|LUXEMBOURG|HONG KONG|SINGAPORE|PANAMA|LIECHTENSTEIN)\b",
    re.IGNORECASE,
)
INSTITUTIONAL = re.compile(
    r"\b(BLACKSTONE|RELATED|TISHMAN|BROOKFIELD|KKR|CARLYLE|BLACKROCK|STARWOOD|FORTRESS)\b",
    re.IGNORECASE,
)

log = logging.getLogger("acris")


def socrata_get(dataset_id: str, params: dict[str, Any], token: str | None) -> list[dict]:
    """Fetch all rows from a Socrata dataset, paginating past the 50k cap."""
    url = SOCRATA_BASE.format(id=dataset_id)
    headers = {"X-App-Token": token} if token else {}
    rows: list[dict] = []
    offset = 0
    while True:
        page_params = dict(params)
        page_params["$limit"] = SOCRATA_PAGE_SIZE
        page_params["$offset"] = offset
        resp = requests.get(url, params=page_params, headers=headers, timeout=120)
        resp.raise_for_status()
        page = resp.json()
        rows.extend(page)
        if len(page) < SOCRATA_PAGE_SIZE:
            break
        offset += SOCRATA_PAGE_SIZE
    return rows


def make_bbl(borough: str, block: str, lot: str) -> str | None:
    try:
        return f"{int(borough)}{int(block):05d}{int(lot):04d}"
    except (TypeError, ValueError):
        return None


def classify_entity(name: str | None) -> str:
    if not name:
        return "Unknown"
    if TRUST_RE.search(name):
        return "Trust"
    if LLC_RE.search(name):
        return "LLC"
    if CORP_RE.search(name):
        return "Corp"
    if PARTNERSHIP_RE.search(name):
        return "Partnership"
    return "Individual"


def classify_beneficial_owner(
    buyer_name: str | None, buyer_addr: str | None, seller_name: str | None
) -> str:
    name = buyer_name or ""
    addr = buyer_addr or ""
    seller = seller_name or ""
    if INSTITUTIONAL.search(name):
        return "Institutional"
    if FOREIGN_HINTS.search(name) or FOREIGN_HINTS.search(addr):
        return "Foreign-inferred"
    if "SPONSOR" in seller.upper():
        return "Developer/sponsor"
    entity = classify_entity(buyer_name)
    if entity in ("Individual", "Trust"):
        return "Domestic individual"
    if entity in ("LLC", "Corp", "Partnership"):
        return "Domestic entity-shielded"
    return "Unknown"


def parse_date(s: str | None) -> str | None:
    if not s:
        return None
    return s[:10]


def to_float(v: Any) -> float | None:
    if v is None or v == "":
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def to_int(v: Any) -> int | None:
    f = to_float(v)
    return int(f) if f is not None else None


def fetch_deeds(start: str, end: str, token: str | None) -> list[dict]:
    doc_types = ",".join(f"'{t}'" for t in DEED_DOC_TYPES)
    where = (
        f"doc_type in ({doc_types}) "
        f"AND document_amt >= {PRICE_FLOOR} "
        f"AND recorded_datetime >= '{start}T00:00:00' "
        f"AND recorded_datetime < '{end}T00:00:00'"
    )
    params = {
        "$select": "document_id,doc_type,document_amt,recorded_datetime,document_date",
        "$where": where,
    }
    return socrata_get(DATASET_MASTER, params, token)


def fetch_legals(document_ids: Iterable[str], token: str | None) -> list[dict]:
    ids = list(document_ids)
    if not ids:
        return []
    results: list[dict] = []
    batch = 500
    for i in range(0, len(ids), batch):
        chunk = ids[i : i + batch]
        in_clause = ",".join(f"'{d}'" for d in chunk)
        params = {
            "$select": "document_id,borough,block,lot,street_number,street_name,property_type",
            "$where": f"document_id in ({in_clause})",
        }
        results.extend(socrata_get(DATASET_LEGALS, params, token))
    return results


def fetch_parties(document_ids: Iterable[str], token: str | None) -> list[dict]:
    ids = list(document_ids)
    if not ids:
        return []
    results: list[dict] = []
    batch = 500
    for i in range(0, len(ids), batch):
        chunk = ids[i : i + batch]
        in_clause = ",".join(f"'{d}'" for d in chunk)
        params = {
            "$select": "document_id,party_type,name,address_1,city,state,country",
            "$where": f"document_id in ({in_clause})",
        }
        results.extend(socrata_get(DATASET_PARTIES, params, token))
    return results


def fetch_mortgages(start: str, end: str, token: str | None) -> list[dict]:
    doc_types = ",".join(f"'{t}'" for t in MORTGAGE_DOC_TYPES)
    where = (
        f"doc_type in ({doc_types}) "
        f"AND recorded_datetime >= '{start}T00:00:00' "
        f"AND recorded_datetime < '{end}T00:00:00'"
    )
    params = {
        "$select": "document_id,doc_type,recorded_datetime",
        "$where": where,
    }
    return socrata_get(DATASET_MASTER, params, token)


def fetch_pluto(bbls: Iterable[str], token: str | None) -> list[dict]:
    bbl_list = [b for b in bbls if b]
    if not bbl_list:
        return []
    results: list[dict] = []
    batch = 500
    for i in range(0, len(bbl_list), batch):
        chunk = bbl_list[i : i + batch]
        in_clause = ",".join(f"'{b}'" for b in chunk)
        params = {
            "$select": "bbl,bldgarea,unitsres",
            "$where": f"bbl in ({in_clause})",
        }
        results.extend(socrata_get(DATASET_PLUTO, params, token))
    return results


def build_records(
    deeds: list[dict],
    legals_by_doc: dict[str, list[dict]],
    parties_by_doc: dict[str, list[dict]],
    mortgage_bbl_dates: set[tuple[str, str]],
    pluto_by_bbl: dict[str, dict],
) -> list[dict]:
    records: list[dict] = []
    for deed in deeds:
        doc_id = deed.get("document_id")
        if not doc_id:
            continue
        legals = legals_by_doc.get(doc_id, [])
        # Keep the first legal whose property_type is in our residential map.
        legal = next(
            (l for l in legals if (l.get("property_type") or "").strip() in PROPERTY_TYPES),
            None,
        )
        if not legal:
            continue
        borough = (legal.get("borough") or "").strip()
        if borough not in TARGET_BOROUGHS:
            continue

        ptype_code = (legal.get("property_type") or "").strip()
        ptype_label = PROPERTY_TYPES[ptype_code]
        bbl = make_bbl(borough, legal.get("block"), legal.get("lot"))

        street_num = (legal.get("street_number") or "").strip()
        street_name = (legal.get("street_name") or "").strip()
        address = " ".join(p for p in (street_num, street_name) if p).strip() or None

        parties = parties_by_doc.get(doc_id, [])
        buyers = [p for p in parties if str(p.get("party_type")) == "2"]
        sellers = [p for p in parties if str(p.get("party_type")) == "1"]
        buyer_names = [p.get("name") for p in buyers if p.get("name")]
        seller_names = [p.get("name") for p in sellers if p.get("name")]
        first_buyer = buyers[0] if buyers else {}
        first_seller_name = seller_names[0] if seller_names else None
        buyer_name_primary = first_buyer.get("name")
        buyer_addr_parts = [
            first_buyer.get("address_1"),
            first_buyer.get("city"),
            first_buyer.get("state"),
            first_buyer.get("country"),
        ]
        buyer_addr = ", ".join(p for p in buyer_addr_parts if p) or None

        recorded_date = parse_date(deed.get("recorded_datetime"))
        doc_date = parse_date(deed.get("document_date"))
        price = to_float(deed.get("document_amt"))

        all_cash_flag = True
        if bbl and recorded_date and (bbl, recorded_date) in mortgage_bbl_dates:
            all_cash_flag = False

        pluto = pluto_by_bbl.get(bbl or "", {})
        bldgarea = to_float(pluto.get("bldgarea"))
        if ptype_label == "Condo":
            sqft = None
        else:
            sqft = bldgarea
        ppsf = (price / sqft) if price and sqft else None

        entity_type = classify_entity(buyer_name_primary)
        beneficial = classify_beneficial_owner(
            buyer_name_primary, buyer_addr, first_seller_name
        )
        llc_flag = bool(buyer_name_primary and LLC_RE.search(buyer_name_primary))
        trust_flag = bool(buyer_name_primary and TRUST_RE.search(buyer_name_primary))

        records.append(
            {
                "document_id": doc_id,
                "recorded_date": recorded_date,
                "doc_date": doc_date,
                "borough": BOROUGHS.get(borough, borough),
                "address": address,
                "bbl": bbl,
                "property_type": ptype_label,
                "price": price,
                "sqft": sqft,
                "ppsf": ppsf,
                "all_cash_flag": all_cash_flag,
                "buyer_name": " | ".join(buyer_names) if buyer_names else None,
                "seller_name": " | ".join(seller_names) if seller_names else None,
                "llc_flag": llc_flag,
                "trust_flag": trust_flag,
                "entity_type": entity_type,
                "beneficial_owner_category": beneficial,
                "acris_url": f"https://a836-acris.nyc.gov/DS/DocumentSearch/DocumentDetail?doc_id={doc_id}",
            }
        )
    return records


def upsert_airtable(records: list[dict], api_key: str, base_id: str, table_name: str) -> int:
    api = Api(api_key)
    table = api.table(base_id, table_name)
    total = 0
    for i in range(0, len(records), AIRTABLE_UPSERT_CHUNK):
        chunk = records[i : i + AIRTABLE_UPSERT_CHUNK]
        try:
            table.batch_upsert(
                [{"fields": r} for r in chunk],
                key_fields=["document_id"],
                typecast=True,
            )
            total += len(chunk)
        except Exception as e:
            log.exception("Airtable upsert failed for chunk %d: %s", i // AIRTABLE_UPSERT_CHUNK, e)
    return total


def run(backfill_days: int, dry_run: bool = False, limit: int | None = None) -> None:
    if dry_run:
        airtable_key = base_id = table_name = None
        log.info("DRY RUN: Airtable credentials not required; no writes will occur.")
    else:
        airtable_key = os.environ["AIRTABLE_API_KEY"]
        base_id = os.environ["AIRTABLE_BASE_ID"]
        table_name = os.environ["AIRTABLE_TABLE_NAME"]
    token = os.environ.get("SOCRATA_APP_TOKEN") or None

    end_dt = datetime.now(timezone.utc).date() + timedelta(days=1)
    start_dt = end_dt - timedelta(days=backfill_days)
    start = start_dt.isoformat()
    end = end_dt.isoformat()
    log.info("Window: %s → %s", start, end)

    deeds = fetch_deeds(start, end, token)
    log.info("Deeds fetched: %d", len(deeds))
    if limit is not None:
        deeds = deeds[:limit]
        log.info("Deeds truncated to --limit: %d", len(deeds))

    doc_ids = [d["document_id"] for d in deeds if d.get("document_id")]
    legals = fetch_legals(doc_ids, token)
    legals_by_doc: dict[str, list[dict]] = defaultdict(list)
    for l in legals:
        legals_by_doc[l["document_id"]].append(l)
    log.info("Legals matched: %d (rows across %d deeds)", len(legals), len(legals_by_doc))

    parties = fetch_parties(doc_ids, token)
    parties_by_doc: dict[str, list[dict]] = defaultdict(list)
    for p in parties:
        parties_by_doc[p["document_id"]].append(p)
    log.info("Parties fetched: %d", len(parties))

    mortgages = fetch_mortgages(start, end, token)
    log.info("Mortgages found: %d", len(mortgages))
    mort_doc_ids = [m["document_id"] for m in mortgages if m.get("document_id")]
    mort_legals = fetch_legals(mort_doc_ids, token)
    mort_date_by_doc = {
        m["document_id"]: parse_date(m.get("recorded_datetime"))
        for m in mortgages
        if m.get("document_id")
    }
    mortgage_bbl_dates: set[tuple[str, str]] = set()
    for l in mort_legals:
        bbl = make_bbl(l.get("borough"), l.get("block"), l.get("lot"))
        d = mort_date_by_doc.get(l.get("document_id"))
        if bbl and d:
            mortgage_bbl_dates.add((bbl, d))

    bbls_needed = set()
    for ls in legals_by_doc.values():
        for l in ls:
            b = make_bbl(l.get("borough"), l.get("block"), l.get("lot"))
            if b:
                bbls_needed.add(b)
    pluto_rows = fetch_pluto(bbls_needed, token)
    pluto_by_bbl = {p["bbl"]: p for p in pluto_rows if p.get("bbl")}
    log.info("PLUTO BBLs fetched: %d", len(pluto_by_bbl))

    records = build_records(
        deeds, legals_by_doc, parties_by_doc, mortgage_bbl_dates, pluto_by_bbl
    )
    log.info("Records assembled: %d", len(records))

    if not records:
        log.info("No records to upsert.")
        return

    if dry_run:
        log.info("DRY RUN: would upsert %d records. Sample (up to 3):", len(records))
        for r in records[:3]:
            log.info("  %s", r)
        return

    upserted = upsert_airtable(records, airtable_key, base_id, table_name)
    log.info("Records upserted: %d", upserted)


def main(argv: list[str] | None = None) -> int:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
    )
    parser = argparse.ArgumentParser(description="ACRIS → Airtable sync")
    parser.add_argument("--backfill-days", type=int, default=2)
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Fetch and tag, but skip Airtable writes. No credentials required.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Truncate deeds to first N after fetch; useful for quick smoke tests.",
    )
    args = parser.parse_args(argv)
    run(args.backfill_days, dry_run=args.dry_run, limit=args.limit)
    return 0


if __name__ == "__main__":
    sys.exit(main())
