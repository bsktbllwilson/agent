"""Outreach suppression — don't re-surface prospects contacted recently."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from .config import CONFIG
from .db import tx


def is_suppressed(prospect_id: str, now: datetime | None = None) -> bool:
    """Returns True if the prospect has been contacted within the suppression window."""
    now = now or datetime.now(timezone.utc)
    cutoff = now - timedelta(days=CONFIG.outreach_suppression_days)
    with tx() as conn:
        row = conn.execute(
            "SELECT last_contacted_date, status FROM outreach_status WHERE prospect_id = ?",
            (prospect_id,),
        ).fetchone()
    if not row:
        return False
    if row["status"] == "do-not-contact":
        return True
    if not row["last_contacted_date"]:
        return False
    try:
        last = datetime.fromisoformat(row["last_contacted_date"])
    except ValueError:
        return False
    if last.tzinfo is None:
        last = last.replace(tzinfo=timezone.utc)
    return last >= cutoff


def mark_contacted(prospect_id: str, notes: str | None = None) -> None:
    now = datetime.now(timezone.utc).isoformat()
    with tx() as conn:
        conn.execute(
            """
            INSERT INTO outreach_status (prospect_id, status, last_contacted_date, notes, updated_at)
            VALUES (?, 'contacted', ?, ?, ?)
            ON CONFLICT(prospect_id) DO UPDATE SET
                status='contacted',
                last_contacted_date=excluded.last_contacted_date,
                notes=COALESCE(excluded.notes, outreach_status.notes),
                updated_at=excluded.updated_at
            """,
            (prospect_id, now, notes, now),
        )
        conn.execute(
            "UPDATE prospects SET last_contacted_date=?, outreach_status='contacted' WHERE prospect_id=?",
            (now, prospect_id),
        )


def mark_do_not_contact(prospect_id: str, notes: str | None = None) -> None:
    now = datetime.now(timezone.utc).isoformat()
    with tx() as conn:
        conn.execute(
            """
            INSERT INTO outreach_status (prospect_id, status, notes, updated_at)
            VALUES (?, 'do-not-contact', ?, ?)
            ON CONFLICT(prospect_id) DO UPDATE SET
                status='do-not-contact',
                notes=COALESCE(excluded.notes, outreach_status.notes),
                updated_at=excluded.updated_at
            """,
            (prospect_id, notes, now),
        )
        conn.execute(
            "UPDATE prospects SET outreach_status='do-not-contact' WHERE prospect_id=?",
            (prospect_id,),
        )
