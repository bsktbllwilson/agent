"""Thin async client for Socrata Open Data (data.cityofnewyork.us).

Handles pagination (`$limit` + `$offset`) and adds the app token header when
configured. Rate-limited to be polite regardless of token (10 req/sec is fine
with a token; we stay well under).
"""
from __future__ import annotations

import asyncio
from typing import Any

import httpx

from ..config import CONFIG
from ..utils.logging import get_logger
from ..utils.rate_limit import RateLimiter
from ..utils.retry import retry_with_backoff

log = get_logger("socrata")
_LIMITER = RateLimiter(min_interval_seconds=0.2)

PAGE_SIZE = 1000


@retry_with_backoff(max_attempts=5)
async def _get(
    client: httpx.AsyncClient, url: str, params: dict[str, Any]
) -> list[dict]:
    async with _LIMITER:
        resp = await client.get(url, params=params, timeout=30.0)
    resp.raise_for_status()
    return resp.json()


async def query_all(url: str, where: str, select: str | None = None) -> list[dict]:
    """Page through all rows matching `where`. Returns combined list."""
    headers = {"User-Agent": CONFIG.scraper_user_agent}
    if CONFIG.socrata_app_token:
        headers["X-App-Token"] = CONFIG.socrata_app_token

    results: list[dict] = []
    offset = 0
    async with httpx.AsyncClient(headers=headers) as client:
        while True:
            params: dict[str, Any] = {
                "$where": where,
                "$limit": PAGE_SIZE,
                "$offset": offset,
                "$order": ":id",
            }
            if select:
                params["$select"] = select
            batch = await _get(client, url, params)
            if not batch:
                break
            results.extend(batch)
            log.debug("socrata page url=%s offset=%d rows=%d", url, offset, len(batch))
            if len(batch) < PAGE_SIZE:
                break
            offset += PAGE_SIZE
            # Micro-pause between pages
            await asyncio.sleep(0.05)
    return results
