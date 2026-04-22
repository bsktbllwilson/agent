"""Tier 5 — Holdings pattern self-join.

Once a buyer name is resolved (whether individual or LLC principal), scan the
local `trigger_events` table (and archival raw_acris) for other NYC properties
tied to the same name OR the same principal. Multi-property holders are the
highest-value prospects.
"""
from __future__ import annotations

from typing import Any

from ..db import from_json, tx
from ..utils.logging import get_logger

log = get_logger("tier5")


def _normalize(name: str) -> str:
    return (name or "").strip().upper()


def holdings_for(name: str) -> list[dict[str, Any]]:
    """Find all past NYC properties where `name` appears as a buyer (party_type 2)
    in ACRIS, OR where the LLC is registered to this principal in llc_registry.
    Returns list of {address, sale_price, sale_date, source, event_id}."""
    key = _normalize(name)
    if not key:
        return []
    holdings = []
    with tx() as conn:
        # Direct name match on trigger_events.raw_buyer_names
        rows = conn.execute(
            """
            SELECT event_id, address, sale_price, sale_date, source, raw_buyer_names
            FROM trigger_events
            WHERE raw_buyer_names LIKE ?
            ORDER BY sale_date DESC
            """,
            (f'%{key}%',),
        ).fetchall()
        for r in rows:
            buyers = from_json(r["raw_buyer_names"]) or []
            if any(_normalize(b) == key for b in buyers):
                holdings.append(
                    {
                        "event_id": r["event_id"],
                        "address": r["address"],
                        "sale_price": r["sale_price"],
                        "sale_date": r["sale_date"],
                        "source": r["source"],
                    }
                )

        # Also look up any LLCs that resolved to this principal in past runs.
        # (A simple heuristic: scan buyer_resolutions.evidence for `principal == name`.)
        reso_rows = conn.execute(
            """
            SELECT br.event_id, te.address, te.sale_price, te.sale_date, te.source
            FROM buyer_resolutions br
            JOIN trigger_events te ON te.event_id = br.event_id
            WHERE br.resolved_name = ? COLLATE NOCASE
            """,
            (name,),
        ).fetchall()
        seen = {h["event_id"] for h in holdings}
        for r in reso_rows:
            if r["event_id"] in seen:
                continue
            holdings.append(
                {
                    "event_id": r["event_id"],
                    "address": r["address"],
                    "sale_price": r["sale_price"],
                    "sale_date": r["sale_date"],
                    "source": r["source"],
                }
            )
    log.debug("Tier5: %d holdings for %s", len(holdings), name)
    return holdings
