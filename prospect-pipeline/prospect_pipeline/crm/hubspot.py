"""HubSpot CRM push — create a Contact + Deal with the dossier populated."""
from __future__ import annotations

from typing import Any

import httpx

from ..config import CONFIG
from ..utils.logging import get_logger
from ..utils.retry import retry_with_backoff

log = get_logger("crm.hubspot")


@retry_with_backoff(max_attempts=4)
async def _post(path: str, payload: dict) -> dict:
    headers = {
        "Authorization": f"Bearer {CONFIG.hubspot_api_key}",
        "Content-Type": "application/json",
        "User-Agent": CONFIG.scraper_user_agent,
    }
    url = f"https://api.hubapi.com{path}"
    async with httpx.AsyncClient(headers=headers, timeout=20.0) as client:
        resp = await client.post(url, json=payload)
    resp.raise_for_status()
    return resp.json()


async def push_prospect(prospect: dict, *, dry_run: bool) -> dict[str, Any]:
    """Push a prospect row to HubSpot as Contact + Deal. Returns ids or dry-run info."""
    if dry_run:
        log.info("HubSpot dry-run: would push %s", prospect.get("prospect_id"))
        return {"dry_run": True, "prospect_id": prospect.get("prospect_id")}
    if not CONFIG.hubspot_api_key:
        raise RuntimeError("HUBSPOT_API_KEY not configured")

    contact_props = {
        "email": prospect.get("work_email") or "",
        "firstname": "",
        "lastname": prospect.get("resolved_principal") or prospect.get("legal_name") or "",
        "phone": prospect.get("work_phone") or "",
        "company": prospect.get("primary_firm") or "",
        "jobtitle": prospect.get("title") or "",
        "hs_lead_status": "NEW",
        "buyer_type": prospect.get("buyer_type") or "",
        "estimated_net_worth_band": prospect.get("estimated_net_worth_band") or "",
    }
    contact = await _post("/crm/v3/objects/contacts", {"properties": contact_props})
    deal_props = {
        "dealname": f"NYC Prospect — {prospect.get('legal_name') or prospect.get('resolved_principal')}",
        "dealstage": "appointmentscheduled",
        "pipeline": "default",
        "amount": "",
        "description": prospect.get("outreach_angle") or "",
    }
    deal = await _post("/crm/v3/objects/deals", {"properties": deal_props})
    return {"contact_id": contact.get("id"), "deal_id": deal.get("id")}
