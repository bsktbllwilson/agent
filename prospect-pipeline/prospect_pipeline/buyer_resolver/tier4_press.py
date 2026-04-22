"""Tier 4 — Press resolution via fuzzy-matching weekly press index.

We maintain a press_index table of recent articles from The Real Deal, Mansion
Global, NY Post RE, Crain's, Bloomberg, WSJ. When a journalist names the buyer
directly, Tier 4 is high-confidence.

For dry-run we seed a small, illustrative press index. Live mode uses RSS where
available and respects robots.txt; scraping is gated behind ENABLE_PRESS_SCRAPER.
"""
from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any

from rapidfuzz import fuzz

from ..db import from_json, insert_many, tx
from ..fixtures import render
from ..utils.logging import get_logger

log = get_logger("tier4_press")

ADDRESS_MIN_SCORE = 80
PRICE_TOLERANCE_PCT = 0.05
DATE_TOLERANCE_DAYS = 14

# A tiny seed press index used in dry-run. Loaded from fixtures.
_SEED_INDEX_FILE = "press_index.json"


def seed_dry_run_index() -> None:
    """Idempotently seed the press_index table from the bundled fixture."""
    rows = render(_SEED_INDEX_FILE)
    now = datetime.now(timezone.utc).isoformat()
    prepared = []
    for r in rows:
        prepared.append(
            {
                "publication": r["publication"],
                "url": r["url"],
                "title": r["title"],
                "published_at": r["published_at"],
                "addresses": r.get("addresses_json") or r.get("addresses") or "[]",
                "price_mentions": r.get("price_mentions_json") or r.get("price_mentions") or "[]",
                "named_buyers": r.get("named_buyers_json") or r.get("named_buyers") or "[]",
                "excerpt": r.get("excerpt"),
                "ingested_at": now,
            }
        )
    with tx() as conn:
        insert_many(conn, "press_index", prepared)


def _address_match(a: str, b: str) -> int:
    if not a or not b:
        return 0
    return int(fuzz.token_set_ratio(a.lower(), b.lower()))


def _price_match(article_prices: list[int], event_price: int) -> bool:
    if not event_price:
        return False
    for p in article_prices:
        if not p:
            continue
        if abs(p - event_price) <= max(event_price, p) * PRICE_TOLERANCE_PCT:
            return True
    return False


def _date_within(article_date: str | None, event_date: str | None) -> bool:
    if not article_date or not event_date:
        return False
    try:
        a = datetime.fromisoformat(article_date[:10])
        e = datetime.fromisoformat(event_date[:10])
    except ValueError:
        return False
    return abs((a - e).days) <= DATE_TOLERANCE_DAYS


def _parse_prices(raw: Any) -> list[int]:
    if isinstance(raw, list):
        return [int(x) for x in raw if isinstance(x, (int, float))]
    parsed = from_json(raw) or []
    out = []
    for p in parsed:
        try:
            out.append(int(p))
        except (TypeError, ValueError):
            pass
    return out


def _parse_list(raw: Any) -> list[str]:
    if isinstance(raw, list):
        return [str(x) for x in raw]
    return from_json(raw) or []


def lookup(event: dict[str, Any]) -> dict[str, Any]:
    """Fuzzy-match the event against press_index. Returns a resolution or miss."""
    with tx() as conn:
        rows = conn.execute(
            "SELECT publication, url, title, published_at, addresses, price_mentions, named_buyers, excerpt FROM press_index"
        ).fetchall()
    event_addr = event.get("address") or ""
    event_price = event.get("sale_price") or 0
    event_date = event.get("sale_date") or event.get("contract_date")
    best: tuple[int, dict] | None = None
    for r in rows:
        addresses = _parse_list(r["addresses"])
        prices = _parse_prices(r["price_mentions"])
        score = max((_address_match(event_addr, a) for a in addresses), default=0)
        if score < ADDRESS_MIN_SCORE:
            continue
        if not _price_match(prices, event_price):
            continue
        if not _date_within(r["published_at"], event_date):
            continue
        named = _parse_list(r["named_buyers"])
        if not named:
            continue
        buyer = named[0]
        candidate = {
            "resolved_name": buyer,
            "confidence": "high",
            "evidence": {
                "publication": r["publication"],
                "url": r["url"],
                "title": r["title"],
                "published_at": r["published_at"],
                "excerpt": r["excerpt"],
                "score": score,
            },
        }
        if not best or score > best[0]:
            best = (score, candidate)
    if best:
        log.info("Tier4: press hit for %s -> %s", event_addr, best[1]["resolved_name"])
        return best[1]
    return {"resolved_name": None, "confidence": None, "evidence": {"reason": "no_press_match"}}
