"""Clay orchestrates a contact-enrichment waterfall across Apollo, ZoomInfo,
Hunter, LinkedIn Sales Navigator (legitimate API), and Findymail.

We never scrape LinkedIn directly. Clay's integration with LinkedIn Sales Nav
is the proper commercial channel.

Stub: in dry-run we return fixture hits for a few test names. Live mode posts
to a Clay workflow webhook (Clay's API pattern); a production implementation
would poll for completion or accept a callback.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import httpx

from ..config import CONFIG
from ..db import as_json, tx
from ..utils.logging import get_logger
from ..utils.rate_limit import RateLimiter
from ..utils.retry import retry_with_backoff

log = get_logger("clay")
_LIMITER = RateLimiter(min_interval_seconds=0.25)

# Only work contacts, no personal emails / phones / home addresses.
_FIXTURE_CONTACTS: dict[str, dict[str, Any]] = {
    "DAVID L. CHEN": {
        "work_email": "dchen@bridgewater.com",
        "work_phone": "+1-203-555-0114",
        "linkedin_url": "https://www.linkedin.com/in/david-l-chen-investing",
        "title": "Senior Portfolio Manager",
        "firm": "Bridgewater Associates",
        "seniority": "senior",
        "assistant_contact": "katelyn.morris@bridgewater.com",
        "verified": True,
    },
    "SOFIA BERGMAN": {
        "work_email": "sofia@bergmancapital.com",
        "work_phone": "+1-212-555-0133",
        "linkedin_url": "https://www.linkedin.com/in/sofia-bergman-capital",
        "title": "Managing Partner",
        "firm": "Bergman Capital Partners",
        "seniority": "c-suite",
        "assistant_contact": None,
        "verified": True,
    },
    "MOHAMMED AL-RASHID": {
        "work_email": "m.alrashid@alrashidfamilyoffice.ae",
        "work_phone": None,
        "linkedin_url": None,
        "title": "Principal",
        "firm": "Al-Rashid Family Office",
        "seniority": "c-suite",
        "assistant_contact": "ea@alrashidfamilyoffice.ae",
        "verified": False,
    },
    "JAMES PATRICK O'HARA": {
        "work_email": "johara@avonpartners.com",
        "work_phone": "+1-212-555-0177",
        "linkedin_url": "https://www.linkedin.com/in/james-patrick-ohara-avon",
        "title": "Founder & CIO",
        "firm": "Avon Partners",
        "seniority": "c-suite",
        "assistant_contact": "maria@avonpartners.com",
        "verified": True,
    },
    "RAVI PATEL": {
        "work_email": "ravi@patelventures.com",
        "work_phone": "+1-415-555-0149",
        "linkedin_url": "https://www.linkedin.com/in/ravi-patel-ventures",
        "title": "Partner",
        "firm": "Patel Ventures",
        "seniority": "senior",
        "assistant_contact": None,
        "verified": True,
    },
    "JEREMY T. ROGERS": {
        "work_email": None,  # sellers don't need enrichment
        "work_phone": None,
        "linkedin_url": None,
        "title": None,
        "firm": None,
        "seniority": None,
        "assistant_contact": None,
        "verified": False,
    },
}


def _log(prospect_id: str | None, input_name: str, input_firm: str | None,
         result: dict, credits: float) -> None:
    now = datetime.now(timezone.utc).isoformat()
    with tx() as conn:
        conn.execute(
            """
            INSERT INTO contact_enrichment_log
                (prospect_id, provider, input_name, input_firm, result, credits_consumed, ran_at)
            VALUES (?, 'clay', ?, ?, ?, ?, ?)
            """,
            (prospect_id, input_name, input_firm, as_json(result), credits, now),
        )


@retry_with_backoff(max_attempts=4)
async def _live_enrich(name: str, firm: str | None) -> dict[str, Any]:
    if not CONFIG.clay_api_key or not CONFIG.clay_workspace_id:
        return {}
    headers = {
        "Authorization": f"Bearer {CONFIG.clay_api_key}",
        "User-Agent": CONFIG.scraper_user_agent,
    }
    url = f"https://api.clay.com/v1/workspaces/{CONFIG.clay_workspace_id}/enrichments/contact"
    async with _LIMITER:
        async with httpx.AsyncClient(headers=headers, timeout=45.0) as client:
            resp = await client.post(url, json={"name": name, "firm": firm, "waterfall": [
                "apollo", "zoominfo", "hunter", "linkedin_sn", "findymail",
            ]})
    resp.raise_for_status()
    return resp.json()


async def enrich(
    prospect_id: str | None,
    name: str,
    firm: str | None,
    *,
    dry_run: bool,
) -> dict[str, Any]:
    """Return {work_email, work_phone, linkedin_url, title, firm, seniority, assistant_contact, verified}."""
    if not name:
        return {}

    if dry_run:
        fix = _FIXTURE_CONTACTS.get(name.upper())
        if fix:
            _log(prospect_id, name, firm, {"source": "clay.fixture", **fix}, 1.0)
            log.info("Clay[fixture]: %s -> email=%s", name, fix.get("work_email"))
            return fix
        _log(prospect_id, name, firm, {"source": "clay.fixture_miss"}, 1.0)
        return {}

    try:
        data = await _live_enrich(name, firm)
    except httpx.HTTPError as e:
        log.warning("Clay live enrichment failed for %s: %s", name, e)
        _log(prospect_id, name, firm, {"error": str(e)}, 0)
        return {}

    # Extract best contact from Clay waterfall result (shape depends on workflow).
    normalized = {
        "work_email": data.get("work_email"),
        "work_phone": data.get("work_phone"),
        "linkedin_url": data.get("linkedin_url"),
        "title": data.get("title"),
        "firm": data.get("company") or firm,
        "seniority": data.get("seniority"),
        "assistant_contact": data.get("assistant_email"),
        "verified": bool(data.get("email_verified", False)),
    }
    credits = float(data.get("credits_consumed", 1.0))
    _log(prospect_id, name, firm, {"source": "clay.live", **normalized, "raw": data}, credits)
    return normalized
