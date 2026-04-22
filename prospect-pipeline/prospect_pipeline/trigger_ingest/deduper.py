"""Cross-source dedup for trigger events.

We keep ACRIS as the canonical record because it carries party names. Match
ACRIS ↔ RPTT on `(bbl, sale_date ± 3 days, sale_price)`; when matched, the RPTT
row is marked `source="rptt_matched"` and linked via `dedup_key` so it won't be
surfaced as a separate prospect.

UrbanDigs contracts are rarely matchable pre-closing; they stay as independent
leads until the ACRIS recording lands and supersedes them.
"""
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from ..db import tx
from ..utils.logging import get_logger

log = get_logger("deduper")

DATE_WINDOW_DAYS = 3
PRICE_TOLERANCE_PCT = 0.01


def _parse_date(s: str | None) -> datetime | None:
    if not s:
        return None
    try:
        return datetime.fromisoformat(s[:10])
    except ValueError:
        return None


def _price_match(a: int | None, b: int | None) -> bool:
    if not a or not b:
        return False
    if a == b:
        return True
    tol = max(a, b) * PRICE_TOLERANCE_PCT
    return abs(a - b) <= tol


def dedupe() -> dict[str, int]:
    """Run dedup pass. Returns counts by operation."""
    stats = {"matched": 0, "acris_kept": 0, "rptt_orphan": 0, "urbandigs": 0}
    with tx() as conn:
        acris = list(
            conn.execute(
                "SELECT event_id, bbl, sale_date, sale_price FROM trigger_events WHERE source='acris'"
            ).fetchall()
        )
        rptt = list(
            conn.execute(
                "SELECT event_id, bbl, sale_date, sale_price FROM trigger_events WHERE source='rptt_only'"
            ).fetchall()
        )
        log.info("dedupe: ACRIS=%d RPTT=%d", len(acris), len(rptt))

        matched_rptt: set[str] = set()
        for a in acris:
            a_date = _parse_date(a["sale_date"])
            for r in rptt:
                if r["event_id"] in matched_rptt:
                    continue
                if not a["bbl"] or not r["bbl"]:
                    continue
                if a["bbl"] != r["bbl"]:
                    continue
                r_date = _parse_date(r["sale_date"])
                if not a_date or not r_date:
                    continue
                if abs((a_date - r_date).days) > DATE_WINDOW_DAYS:
                    continue
                if not _price_match(a["sale_price"], r["sale_price"]):
                    continue
                # match!
                matched_rptt.add(r["event_id"])
                conn.execute(
                    "UPDATE trigger_events SET source='rptt_matched' WHERE event_id=?",
                    (r["event_id"],),
                )
                stats["matched"] += 1
                break
        stats["acris_kept"] = len(acris)
        stats["rptt_orphan"] = len(rptt) - len(matched_rptt)
        stats["urbandigs"] = conn.execute(
            "SELECT COUNT(*) FROM trigger_events WHERE source='urbandigs'"
        ).fetchone()[0]

    log.info(
        "dedupe results: matched=%d acris_kept=%d rptt_orphan=%d urbandigs=%d",
        stats["matched"], stats["acris_kept"], stats["rptt_orphan"], stats["urbandigs"],
    )
    return stats


def active_events() -> list[dict[str, Any]]:
    """Return all trigger events that should drive buyer resolution this run
    (i.e., ACRIS + RPTT-only orphans + UrbanDigs). Excludes `rptt_matched`."""
    with tx() as conn:
        rows = conn.execute(
            """
            SELECT * FROM trigger_events
            WHERE source IN ('acris', 'rptt_only', 'urbandigs')
            ORDER BY COALESCE(sale_date, contract_date) DESC
            """
        ).fetchall()
        return [dict(r) for r in rows]
