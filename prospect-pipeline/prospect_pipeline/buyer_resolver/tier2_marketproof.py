"""Tier 2 — Marketproof beneficial owner lookup.

Stub client. When MARKETPROOF_API_KEY is absent, returns a fixture-driven
response in dry-run, else returns None (the cascade falls through to Tier 3).
"""
from __future__ import annotations

from typing import Any

import httpx

from ..config import CONFIG
from ..utils.logging import get_logger
from ..utils.rate_limit import RateLimiter
from ..utils.retry import retry_with_backoff

log = get_logger("tier2")
_LIMITER = RateLimiter(min_interval_seconds=0.5)

# Built-in fixture: pretend Marketproof unmasks a few LLCs for dry-run demos.
_FIXTURE_UNMASKS: dict[str, dict[str, Any]] = {
    "15 CPW 20B LLC": {
        "principal": "SOFIA BERGMAN",
        "principal_firm": "Bergman Capital Partners",
        "principal_title": "Managing Partner",
        "confidence": "high",
        "source": "marketproof.llc_principals",
    },
    "CPS 50 HOLDINGS LLC": {
        "principal": "MOHAMMED AL-RASHID",
        "principal_firm": "Al-Rashid Family Office",
        "principal_title": "Principal",
        "confidence": "medium",
        "source": "marketproof.llc_principals",
    },
    "200 E 65 LLC": {
        "principal": None,  # masked — Marketproof has nothing
        "confidence": None,
        "source": "marketproof.llc_principals",
    },
}


@retry_with_backoff(max_attempts=4)
async def _live_lookup(llc_name: str) -> dict[str, Any] | None:
    if not CONFIG.marketproof_api_key:
        return None
    headers = {
        "Authorization": f"Bearer {CONFIG.marketproof_api_key}",
        "User-Agent": CONFIG.scraper_user_agent,
    }
    url = f"{CONFIG.marketproof_base_url.rstrip('/')}/llc/principals"
    async with _LIMITER:
        async with httpx.AsyncClient(headers=headers, timeout=20.0) as client:
            resp = await client.get(url, params={"q": llc_name})
    if resp.status_code == 404:
        return None
    resp.raise_for_status()
    return resp.json()


async def lookup(llc_name: str, *, dry_run: bool) -> dict[str, Any]:
    """Return a resolution dict; `principal` may be None if unmasking fails."""
    if dry_run:
        fix = _FIXTURE_UNMASKS.get(llc_name.upper())
        if fix:
            log.info("Tier2[fixture]: %s -> %s", llc_name, fix.get("principal"))
            return {
                "resolved_name": fix.get("principal"),
                "confidence": fix.get("confidence"),
                "evidence": {
                    "llc": llc_name,
                    "principal_firm": fix.get("principal_firm"),
                    "principal_title": fix.get("principal_title"),
                    "source": fix.get("source"),
                },
                "credits_consumed": 1.0,
            }
        return {
            "resolved_name": None,
            "confidence": None,
            "evidence": {"llc": llc_name, "source": "marketproof.fixture_miss"},
            "credits_consumed": 1.0,
        }

    try:
        data = await _live_lookup(llc_name)
    except httpx.HTTPError as e:
        log.warning("Tier2 live lookup failed for %s: %s", llc_name, e)
        return {"resolved_name": None, "confidence": None, "evidence": {"error": str(e)}, "credits_consumed": 0}

    if not data:
        return {
            "resolved_name": None,
            "confidence": None,
            "evidence": {"llc": llc_name, "source": "marketproof", "raw": None},
            "credits_consumed": 0,
        }
    principal = data.get("principal") or data.get("beneficial_owner")
    return {
        "resolved_name": principal,
        "confidence": "high" if principal else None,
        "evidence": {"llc": llc_name, "source": "marketproof", "raw": data},
        "credits_consumed": 1.0,
    }
