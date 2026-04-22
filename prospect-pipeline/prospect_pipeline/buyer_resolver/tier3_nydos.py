"""Tier 3b — NY Department of State public inquiry.

https://apps.dos.ny.gov/publicInquiry/ is free but slow and bot-hostile. We:
  - rate-limit to 1 req / 3s,
  - cache every result in `llc_registry` indefinitely (filings rarely change),
  - match the service-of-process address against the `law_firms.yaml` list.

We use a lightweight HTML parse because the public inquiry returns server-rendered
HTML. In dry-run we serve a small fixture to avoid live hits.
"""
from __future__ import annotations

import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import httpx
import yaml

from ..config import CONFIG, project_root
from ..db import as_json, tx
from ..utils.logging import get_logger
from ..utils.rate_limit import RateLimiter
from ..utils.retry import retry_with_backoff

log = get_logger("tier3_nydos")
_LIMITER = RateLimiter(min_interval_seconds=3.0)

PUBLIC_INQUIRY_SEARCH = "https://apps.dos.ny.gov/publicInquiry/EntitySearch"

# Fixture stand-in for DOS public inquiry hits during dry-run.
_FIXTURE_DOS: dict[str, dict[str, Any]] = {
    "PARK AVENUE HOLDINGS LLC": {
        "dos_id": "4402019",
        "service_address": "One New York Plaza, New York NY 10004",
        "registered_agent": "Fried, Frank, Harris, Shriver & Jacobson LLP",
        "filing_date": "2019-03-14",
    },
    "REMSEN TOWNHOUSE TRUST": {
        "dos_id": None,  # trusts aren't in the DOS entity system
        "service_address": None,
        "registered_agent": None,
        "filing_date": None,
    },
    "WEST 74 STREET PROPERTIES LLC": {
        "dos_id": "5120331",
        "service_address": "477 Madison Avenue, New York NY 10022",
        "registered_agent": "Adam Leitman Bailey, P.C.",
        "filing_date": "2021-07-02",
    },
    "200 E 65 LLC": {
        "dos_id": "6010844",
        "service_address": "120 Broadway, Floor 18, New York NY 10271",
        "registered_agent": None,
        "filing_date": "2023-04-10",
    },
    "CPS 50 HOLDINGS LLC": {
        "dos_id": "5997231",
        "service_address": "One New York Plaza, New York NY 10004",
        "registered_agent": "Fried, Frank, Harris, Shriver & Jacobson LLP",
        "filing_date": "2023-01-22",
    },
    "15 CPW 20B LLC": {
        "dos_id": "5432108",
        "service_address": "1285 Avenue of the Americas, New York NY 10019",
        "registered_agent": "Paul, Weiss, Rifkind, Wharton & Garrison LLP",
        "filing_date": "2022-05-06",
    },
}


def _load_law_firms() -> list[dict]:
    path = project_root() / "law_firms.yaml"
    if not path.exists():
        return []
    return yaml.safe_load(path.read_text()).get("law_firms", [])


def match_law_firm(service_address: str | None, registered_agent: str | None) -> str | None:
    if not service_address and not registered_agent:
        return None
    hay = f"{service_address or ''} {registered_agent or ''}".upper()
    for f in _load_law_firms():
        candidates = [f["name"].upper(), *[a.upper() for a in f.get("aka", [])]]
        for cand in candidates:
            # Match on distinctive firm name substring.
            core = re.sub(r"[,.()]", "", cand.split(",")[0]).strip()
            if core and core in hay:
                return f["name"]
    return None


def _cached(llc_name: str) -> dict | None:
    with tx() as conn:
        row = conn.execute(
            "SELECT * FROM llc_registry WHERE llc_name=?",
            (llc_name.upper(),),
        ).fetchone()
    return dict(row) if row else None


def _cache(llc_name: str, record: dict) -> None:
    now = datetime.now(timezone.utc).isoformat()
    matched = match_law_firm(record.get("service_address"), record.get("registered_agent"))
    with tx() as conn:
        conn.execute(
            """
            INSERT INTO llc_registry
                (llc_name, service_address, registered_agent, filing_date, matched_law_firm, dos_id, raw, fetched_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(llc_name) DO UPDATE SET
                service_address=excluded.service_address,
                registered_agent=excluded.registered_agent,
                filing_date=excluded.filing_date,
                matched_law_firm=excluded.matched_law_firm,
                dos_id=excluded.dos_id,
                raw=excluded.raw,
                fetched_at=excluded.fetched_at
            """,
            (
                llc_name.upper(),
                record.get("service_address"),
                record.get("registered_agent"),
                record.get("filing_date"),
                matched,
                record.get("dos_id"),
                as_json(record),
                now,
            ),
        )


@retry_with_backoff(max_attempts=3)
async def _live_lookup(llc_name: str) -> dict[str, Any] | None:
    headers = {"User-Agent": CONFIG.scraper_user_agent}
    async with _LIMITER:
        async with httpx.AsyncClient(headers=headers, timeout=30.0, follow_redirects=True) as client:
            resp = await client.get(PUBLIC_INQUIRY_SEARCH, params={"searchByName": llc_name})
    if resp.status_code != 200:
        return None
    # NOTE: the real public inquiry is a multi-step form (CSRF token + POST).
    # A production implementation wraps that flow; for our scaffold we only
    # demonstrate the rate-limited shape and defer to the cache + fixture.
    return {"raw_html_len": len(resp.text)}


async def lookup(llc_name: str, *, dry_run: bool) -> dict[str, Any]:
    """Returns {evidence: {...}, matched_law_firm, service_address}."""
    if not llc_name:
        return {"evidence": {"reason": "no_name"}}
    cached = _cached(llc_name)
    if cached:
        log.debug("Tier3-NYDOS cache hit: %s", llc_name)
        return {
            "evidence": {"source": "nydos.cache", **cached},
            "matched_law_firm": cached.get("matched_law_firm"),
            "service_address": cached.get("service_address"),
        }
    if dry_run:
        fix = _FIXTURE_DOS.get(llc_name.upper())
        if fix:
            _cache(llc_name, fix)
            matched = match_law_firm(fix.get("service_address"), fix.get("registered_agent"))
            log.info("Tier3-NYDOS[fixture]: %s -> law_firm=%s", llc_name, matched)
            return {
                "evidence": {"source": "nydos.fixture", **fix},
                "matched_law_firm": matched,
                "service_address": fix.get("service_address"),
            }
        _cache(llc_name, {})
        return {"evidence": {"source": "nydos.fixture_miss"}, "matched_law_firm": None}

    try:
        data = await _live_lookup(llc_name)
    except httpx.HTTPError as e:
        log.warning("Tier3-NYDOS live lookup failed: %s", e)
        return {"evidence": {"error": str(e)}, "matched_law_firm": None}
    if not data:
        return {"evidence": {"source": "nydos", "raw": None}, "matched_law_firm": None}
    return {"evidence": {"source": "nydos", "raw": data}, "matched_law_firm": None}
