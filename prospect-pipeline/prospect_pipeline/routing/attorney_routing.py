"""Attorney-routing: pick the outreach channel given what we know.

Priority (recommended_channel):
  1. `direct_work_contact`  — we have the buyer's work email or work phone
  2. `selling_broker`       — the selling agent (from Tier 6) is the warmest relay
  3. `attorney`             — filing attorney on the LLC (most prestige)
  4. `managing_agent`       — co-op board's managing agent (slowest but reliable)
  5. `none`                 — nothing to route to
"""
from __future__ import annotations

from typing import Any


def pick_channel(
    *,
    work_email: str | None,
    work_phone: str | None,
    selling_agent: str | None,
    attorney_firm: str | None,
    managing_agent: dict | None,
) -> tuple[str, dict[str, Any]]:
    if work_email or work_phone:
        return "direct_work_contact", {
            "email": work_email,
            "phone": work_phone,
        }
    if selling_agent:
        return "selling_broker", {"agent": selling_agent}
    if attorney_firm:
        return "attorney", {"firm": attorney_firm}
    if managing_agent:
        return "managing_agent", {
            "name": managing_agent.get("name"),
            "phone": managing_agent.get("phone"),
            "email": managing_agent.get("email"),
        }
    return "none", {}
