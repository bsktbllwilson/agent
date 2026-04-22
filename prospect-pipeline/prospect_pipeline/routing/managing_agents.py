"""Managing-agent loader + scrape-grow for Tier 9 indirect outreach routing.

We seed the managing_agents table from `managing_agents.yaml` at pipeline start,
and grow it via `prospect-pipeline seed-agents <address>` which politely scrapes
CityRealty / PropertyShark public building pages for the managing agent field.
"""
from __future__ import annotations

import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import httpx
import yaml
from bs4 import BeautifulSoup
from rapidfuzz import fuzz

from ..config import CONFIG, project_root
from ..db import as_json, from_json, tx
from ..utils.logging import get_logger
from ..utils.rate_limit import RateLimiter
from ..utils.retry import retry_with_backoff

log = get_logger("routing.managing_agents")
_LIMITER = RateLimiter(min_interval_seconds=2.0)

YAML_PATH = project_root() / "managing_agents.yaml"


def load_seed_yaml() -> list[dict]:
    if not YAML_PATH.exists():
        return []
    return yaml.safe_load(YAML_PATH.read_text()).get("managing_agents", [])


def seed_database() -> int:
    """Upsert YAML-seeded agents into DB. Safe on every run.

    Buildings are UNION-merged with any buildings already in the DB so that
    records added via `add-building` / `bulk-seed-agents` survive re-seeding.
    Contact fields (phone/email/website/aka) are treated as canonical from
    YAML — edit YAML to change them.
    """
    now = datetime.now(timezone.utc).isoformat()
    agents = load_seed_yaml()
    with tx() as conn:
        for a in agents:
            existing = conn.execute(
                "SELECT buildings FROM managing_agents WHERE name=?", (a["name"],)
            ).fetchone()
            existing_bldgs = from_json(existing["buildings"]) if existing else []
            yaml_bldgs = a.get("buildings") or []
            # Preserve order: existing DB buildings first (user-added), then new YAML entries.
            merged: list[str] = list(existing_bldgs or [])
            for b in yaml_bldgs:
                if b not in merged:
                    merged.append(b)
            conn.execute(
                """
                INSERT INTO managing_agents (name, aka, phone, email, website, buildings, source, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, 'yaml', ?)
                ON CONFLICT(name) DO UPDATE SET
                    aka=excluded.aka,
                    phone=excluded.phone,
                    email=excluded.email,
                    website=excluded.website,
                    buildings=excluded.buildings,
                    updated_at=excluded.updated_at
                """,
                (
                    a["name"],
                    as_json(a.get("aka", [])),
                    a.get("phone"),
                    a.get("email"),
                    a.get("website"),
                    as_json(merged),
                    now,
                ),
            )
    return len(agents)


def all_agents() -> list[dict]:
    with tx() as conn:
        rows = conn.execute("SELECT * FROM managing_agents").fetchall()
    out = []
    for r in rows:
        d = dict(r)
        d["aka"] = from_json(d.get("aka")) or []
        d["buildings"] = from_json(d.get("buildings")) or []
        out.append(d)
    return out


def attach_building(agent_name: str, building_address: str) -> bool:
    """Link a building to an agent. If the agent doesn't exist, create a
    bare `scraped`-sourced record. Returns True if this is a new link.

    Matching is exact-on-name then fuzzy-on-aka so "FirstService Residential"
    and "FSR" both resolve to the same row. We don't match on partial tokens
    (too loose for a mutation)."""
    now = datetime.now(timezone.utc).isoformat()
    agent_name = agent_name.strip()
    building_address = building_address.strip()
    with tx() as conn:
        # Exact-name or aka match
        row = conn.execute(
            "SELECT id, buildings, aka FROM managing_agents WHERE name = ? COLLATE NOCASE",
            (agent_name,),
        ).fetchone()
        if not row:
            rows = conn.execute("SELECT id, name, aka, buildings FROM managing_agents").fetchall()
            for r in rows:
                akas = [a.lower() for a in (from_json(r["aka"]) or [])]
                if agent_name.lower() in akas:
                    row = r
                    break
        if row:
            buildings = from_json(row["buildings"]) or []
            if building_address in buildings:
                return False
            buildings.append(building_address)
            conn.execute(
                "UPDATE managing_agents SET buildings=?, updated_at=? WHERE id=?",
                (as_json(buildings), now, row["id"]),
            )
            return True
        # New agent
        conn.execute(
            """
            INSERT INTO managing_agents (name, aka, buildings, source, updated_at)
            VALUES (?, '[]', ?, 'manual', ?)
            """,
            (agent_name, as_json([building_address]), now),
        )
        return True


def find_agent_for_building(address: str) -> dict | None:
    """Return the managing-agent record linked to this building, if any."""
    if not address:
        return None
    needle = re.sub(r"[,]", "", address.strip().lower())
    best: tuple[int, dict] | None = None
    for a in all_agents():
        for b in a.get("buildings", []):
            hay = re.sub(r"[,]", "", str(b).strip().lower())
            score = int(fuzz.token_set_ratio(needle, hay))
            if score >= 85 and (not best or score > best[0]):
                best = (score, a)
    return best[1] if best else None


@retry_with_backoff(max_attempts=3)
async def _scrape_cityrealty(address: str) -> str | None:
    """Best-effort: try CityRealty's public building page search.
    Returns the managing-agent string if found, else None. Respects robots.txt
    (CityRealty allows building-page crawling at reasonable rates)."""
    headers = {"User-Agent": CONFIG.scraper_user_agent}
    q = address.replace(" ", "+")
    search_url = f"https://www.cityrealty.com/search/?q={q}"
    async with _LIMITER:
        async with httpx.AsyncClient(headers=headers, timeout=30.0, follow_redirects=True) as client:
            resp = await client.get(search_url)
    if resp.status_code != 200:
        return None
    soup = BeautifulSoup(resp.text, "html.parser")
    # Find a first building-page link.
    link = soup.find("a", href=re.compile(r"/building/"))
    if not link:
        return None
    building_url = link["href"]
    if not building_url.startswith("http"):
        building_url = f"https://www.cityrealty.com{building_url}"
    async with _LIMITER:
        async with httpx.AsyncClient(headers=headers, timeout=30.0, follow_redirects=True) as client:
            bresp = await client.get(building_url)
    if bresp.status_code != 200:
        return None
    page = BeautifulSoup(bresp.text, "html.parser")
    # Managing agent on CityRealty is usually labeled "Management Company".
    for label in page.find_all(string=re.compile(r"(Management Company|Managing Agent)", re.I)):
        parent = label.parent
        if not parent:
            continue
        sibling = parent.find_next_sibling()
        if sibling:
            return sibling.get_text(strip=True)
    return None


async def seed_from_address(address: str, *, dry_run: bool) -> dict[str, Any]:
    """CLI entry for `seed-agents`. In dry-run, no network call."""
    if dry_run:
        log.info("seed-agents dry-run: would scrape CityRealty for %s", address)
        return {"address": address, "scraped": None, "dry_run": True}
    scraped = await _scrape_cityrealty(address)
    if not scraped:
        return {"address": address, "scraped": None}
    now = datetime.now(timezone.utc).isoformat()
    with tx() as conn:
        row = conn.execute(
            "SELECT * FROM managing_agents WHERE name=? OR aka LIKE ?",
            (scraped, f'%"{scraped}"%'),
        ).fetchone()
        if row:
            # Append this building to its list
            buildings = from_json(row["buildings"]) or []
            if address not in buildings:
                buildings.append(address)
                conn.execute(
                    "UPDATE managing_agents SET buildings=?, updated_at=? WHERE id=?",
                    (as_json(buildings), now, row["id"]),
                )
        else:
            conn.execute(
                """
                INSERT INTO managing_agents (name, aka, buildings, source, updated_at)
                VALUES (?, '[]', ?, 'scraped', ?)
                ON CONFLICT(name) DO UPDATE SET
                    buildings=excluded.buildings,
                    updated_at=excluded.updated_at
                """,
                (scraped, as_json([address]), now),
            )
    return {"address": address, "scraped": scraped}
