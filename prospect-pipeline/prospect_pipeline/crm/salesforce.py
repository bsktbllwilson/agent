"""Salesforce CRM push — Lead + Opportunity. Stubbed; SF auth is nontrivial."""
from __future__ import annotations

import base64
import json
from typing import Any

import httpx

from ..config import CONFIG
from ..utils.logging import get_logger

log = get_logger("crm.salesforce")


def _load_creds() -> dict[str, str]:
    """SALESFORCE_CREDS accepts either a JSON string or a base64-encoded JSON.
    Expected keys: instance_url, access_token, version (optional)."""
    raw = CONFIG.salesforce_creds.strip()
    if not raw:
        return {}
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        try:
            return json.loads(base64.b64decode(raw).decode())
        except Exception as e:
            log.warning("SALESFORCE_CREDS not JSON or base64 JSON: %s", e)
            return {}


async def push_prospect(prospect: dict, *, dry_run: bool) -> dict[str, Any]:
    if dry_run:
        log.info("Salesforce dry-run: would push %s", prospect.get("prospect_id"))
        return {"dry_run": True, "prospect_id": prospect.get("prospect_id")}
    creds = _load_creds()
    if not creds.get("instance_url") or not creds.get("access_token"):
        raise RuntimeError("SALESFORCE_CREDS missing instance_url / access_token")

    version = creds.get("version", "v59.0")
    base = creds["instance_url"].rstrip("/")
    headers = {
        "Authorization": f"Bearer {creds['access_token']}",
        "Content-Type": "application/json",
        "User-Agent": CONFIG.scraper_user_agent,
    }
    lead_payload = {
        "LastName": prospect.get("resolved_principal") or prospect.get("legal_name") or "Unknown",
        "Email": prospect.get("work_email") or "",
        "Phone": prospect.get("work_phone") or "",
        "Company": prospect.get("primary_firm") or "NYC Prospect",
        "Title": prospect.get("title") or "",
        "Description": prospect.get("outreach_angle") or "",
        "LeadSource": "Prospect Pipeline",
    }
    async with httpx.AsyncClient(headers=headers, timeout=20.0) as client:
        resp = await client.post(f"{base}/services/data/{version}/sobjects/Lead", json=lead_payload)
    resp.raise_for_status()
    return resp.json()
