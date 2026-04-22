"""Tier 3a — PropertyShark BBL → filings, owner corrections, linked entities.

Stub client; in dry-run we return a small fixture keyed on BBL that surfaces
attorney-filing hints ("matched_law_firm") for specific buildings.
"""
from __future__ import annotations

from typing import Any

import httpx

from ..config import CONFIG
from ..utils.logging import get_logger
from ..utils.rate_limit import RateLimiter
from ..utils.retry import retry_with_backoff

log = get_logger("tier3_propertyshark")
_LIMITER = RateLimiter(min_interval_seconds=0.75)

# Built-in fixture: a couple of BBLs with useful linked-entity hints.
_FIXTURE_BBL: dict[str, dict[str, Any]] = {
    "1013851101": {  # 220 CPS 50A — famous billionaire row
        "linked_entities": ["CPS 50 HOLDINGS LLC"],
        "filing_attorney_firm": "Fried, Frank, Harris, Shriver & Jacobson",
        "service_address": "One New York Plaza, New York NY",
        "notes": "Multiple super-tall condo filings with same counsel.",
    },
    "1010800022": {  # 200 E 65 3F — mid-block coop conversion
        "linked_entities": ["200 E 65 LLC"],
        "filing_attorney_firm": "Adam Leitman Bailey, P.C.",
        "service_address": "120 Broadway, New York NY",
        "notes": "Boutique residential counsel.",
    },
}


@retry_with_backoff(max_attempts=4)
async def _live_lookup(bbl: str) -> dict[str, Any] | None:
    if not CONFIG.propertyshark_api_key:
        return None
    headers = {
        "Authorization": f"Bearer {CONFIG.propertyshark_api_key}",
        "User-Agent": CONFIG.scraper_user_agent,
    }
    url = f"{CONFIG.propertyshark_base_url.rstrip('/')}/bbl/filings"
    async with _LIMITER:
        async with httpx.AsyncClient(headers=headers, timeout=20.0) as client:
            resp = await client.get(url, params={"bbl": bbl})
    if resp.status_code == 404:
        return None
    resp.raise_for_status()
    return resp.json()


async def lookup(bbl: str | None, *, dry_run: bool) -> dict[str, Any]:
    if not bbl:
        return {"evidence": {"reason": "no_bbl"}}
    if dry_run:
        fix = _FIXTURE_BBL.get(bbl)
        if fix:
            log.info("Tier3-PS[fixture]: BBL %s -> %s", bbl, fix.get("filing_attorney_firm"))
            return {"evidence": {"bbl": bbl, "source": "propertyshark.fixture", **fix}}
        return {"evidence": {"bbl": bbl, "source": "propertyshark.fixture_miss"}}

    try:
        data = await _live_lookup(bbl)
    except httpx.HTTPError as e:
        log.warning("Tier3-PS live lookup failed: %s", e)
        return {"evidence": {"error": str(e)}}
    return {"evidence": {"bbl": bbl, "source": "propertyshark", "raw": data}}
