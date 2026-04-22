"""CRM-ready flat CSV export. One row per prospect, no nested JSON in cells."""
from __future__ import annotations

import csv
from pathlib import Path
from typing import Sequence


CSV_COLUMNS = [
    "prospect_id",
    "legal_name",
    "resolved_principal",
    "confidence",
    "resolution_path",
    "buyer_type",
    "primary_firm",
    "title",
    "estimated_net_worth_band",
    "known_affiliations",
    "geography_signal",
    "other_nyc_holdings",
    "holdings_count",
    "work_email",
    "work_phone",
    "linkedin_url",
    "assistant_contact",
    "attorney_firm",
    "managing_agent",
    "broker_to_contact",
    "recommended_channel",
    "outreach_angle",
    "sensitivity_flags",
    "last_trigger_event_id",
    "first_seen_date",
    "last_contacted_date",
    "outreach_status",
]


def _flatten(v):
    if isinstance(v, list):
        return "; ".join(
            str(item.get("address") if isinstance(item, dict) else item)
            for item in v
        )
    return v if v is not None else ""


def write_csv(rows: Sequence[dict], path: Path) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=CSV_COLUMNS, extrasaction="ignore")
        w.writeheader()
        for r in rows:
            out = {k: _flatten(r.get(k)) for k in CSV_COLUMNS}
            w.writerow(out)
    return path
