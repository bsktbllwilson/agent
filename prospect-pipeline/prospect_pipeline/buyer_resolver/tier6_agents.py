"""Tier 6 — UrbanDigs listing + selling agent capture.

Run on every event in parallel with the rest of the cascade. The selling agent
often has a direct buyer relationship; we record them as `broker_to_contact` on
the prospect even when another tier resolved the buyer name.

For ACRIS/RPTT events (which don't carry agents), we try to fuzzy-join to the
most recent UrbanDigs contract on (address match, price ± 5%, date within 90d)
and lift the agents from there.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any

from rapidfuzz import fuzz

from ..db import tx
from ..utils.logging import get_logger

log = get_logger("tier6")

ADDRESS_MIN_SCORE = 85
PRICE_TOLERANCE_PCT = 0.05
CONTRACT_WINDOW_DAYS = 90


def _fuzzy(a: str, b: str) -> int:
    if not a or not b:
        return 0
    return int(fuzz.token_set_ratio(a.lower(), b.lower()))


def capture(event: dict[str, Any]) -> dict[str, Any]:
    """Return {listing_agent, selling_agent, source, evidence} for the event."""
    # Direct agents already stored on the event (UrbanDigs-origin events).
    if event.get("listing_agent") or event.get("selling_agent"):
        return {
            "listing_agent": event.get("listing_agent"),
            "selling_agent": event.get("selling_agent"),
            "source": "event_direct",
            "evidence": {"origin": event.get("source")},
        }

    # Cross-match to UrbanDigs contract for ACRIS/RPTT events.
    addr = event.get("address") or ""
    price = event.get("sale_price") or 0
    sale_date = event.get("sale_date")
    try:
        e_date = datetime.fromisoformat(sale_date[:10]) if sale_date else None
    except ValueError:
        e_date = None
    with tx() as conn:
        ud = conn.execute(
            "SELECT event_id, address, sale_price, contract_date, listing_agent, selling_agent FROM trigger_events WHERE source='urbandigs'"
        ).fetchall()
    best: tuple[int, dict] | None = None
    for r in ud:
        score = _fuzzy(addr, r["address"] or "")
        if score < ADDRESS_MIN_SCORE:
            continue
        if price and r["sale_price"]:
            tol = max(price, r["sale_price"]) * PRICE_TOLERANCE_PCT
            if abs(price - r["sale_price"]) > tol:
                continue
        if e_date and r["contract_date"]:
            try:
                cd = datetime.fromisoformat(r["contract_date"][:10])
                if abs((e_date - cd).days) > CONTRACT_WINDOW_DAYS:
                    continue
            except ValueError:
                continue
        candidate = {
            "listing_agent": r["listing_agent"],
            "selling_agent": r["selling_agent"],
            "source": "urbandigs_crossmatch",
            "evidence": {
                "ud_event_id": r["event_id"],
                "score": score,
            },
        }
        if not best or score > best[0]:
            best = (score, candidate)
    if best:
        return best[1]
    return {"listing_agent": None, "selling_agent": None, "source": None, "evidence": {}}
