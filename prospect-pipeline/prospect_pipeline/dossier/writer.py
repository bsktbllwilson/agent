"""Persist a fully-resolved prospect row to the `prospects` table."""
from __future__ import annotations

import hashlib
from datetime import datetime, timezone
from typing import Any

from ..db import as_json, from_json, tx
from ..utils.logging import get_logger

log = get_logger("dossier.writer")


def _prospect_id(name: str, principal: str | None, event_id: str) -> str:
    raw = f"{(principal or name or '').upper()}|{event_id}"
    return "p_" + hashlib.sha1(raw.encode()).hexdigest()[:14]


def upsert_prospect(row: dict[str, Any]) -> str:
    """Insert or update the prospect. If the buyer was seen before (same
    resolved_principal or legal_name), we update in place and append the new
    trigger as last_trigger_event_id."""
    now = datetime.now(timezone.utc).isoformat()
    pid = row.get("prospect_id") or _prospect_id(
        row.get("legal_name") or "", row.get("resolved_principal"), row["last_trigger_event_id"]
    )
    row = {
        **row,
        "prospect_id": pid,
        "first_seen_date": row.get("first_seen_date") or now,
    }
    cols = [
        "prospect_id", "legal_name", "resolved_principal", "confidence",
        "resolution_path", "buyer_type", "primary_firm", "title",
        "estimated_net_worth_band", "known_affiliations", "geography_signal",
        "other_nyc_holdings", "holdings_count", "work_email", "work_phone",
        "linkedin_url", "assistant_contact", "attorney_firm", "managing_agent",
        "broker_to_contact", "recommended_channel", "outreach_angle",
        "sensitivity_flags", "last_trigger_event_id", "first_seen_date",
        "last_contacted_date", "outreach_status",
    ]
    placeholders = ",".join(f":{c}" for c in cols)
    updates = ",".join(f"{c}=excluded.{c}" for c in cols if c not in ("prospect_id", "first_seen_date"))
    sql = (
        f"INSERT INTO prospects ({','.join(cols)}) VALUES ({placeholders}) "
        f"ON CONFLICT(prospect_id) DO UPDATE SET {updates}"
    )
    with tx() as conn:
        conn.execute(sql, {c: row.get(c) for c in cols})
    return pid


def all_prospects_for_week() -> list[dict]:
    """Return every prospect row with list fields decoded."""
    with tx() as conn:
        rows = conn.execute("SELECT * FROM prospects ORDER BY first_seen_date DESC").fetchall()
    out = []
    for r in rows:
        d = dict(r)
        for k in ("known_affiliations", "other_nyc_holdings", "sensitivity_flags"):
            d[k] = from_json(d.get(k)) or []
        out.append(d)
    return out
