"""Pre-flight checks for scheduled deployment.

Run via `prospect-pipeline health-check`. Validates:
    - Python imports for every module (catches missing deps before cron fires)
    - DB file path is writable + schema initializes cleanly
    - Output and log directories are writable
    - prompts/ files are readable
    - managing_agents.yaml + law_firms.yaml parse and seed
    - `--dry-run` produces all three artifacts under a tempdir
    - Optional: if API keys are set, do a cheap liveness probe (HEAD request
      or 1-row Socrata query) so we catch expired keys on Monday at 8:00:01
      instead of discovering it in the briefing email

Exits 0 on pass, non-zero with a list of failures otherwise. Designed to be
called as a systemd ExecStartPre or cron prerun.
"""
from __future__ import annotations

import asyncio
import importlib
import json
import shutil
import sqlite3
import sys
import tempfile
from pathlib import Path
from typing import Callable

from .config import CONFIG, project_root
from .db import db_path, init_db
from .utils.logging import get_logger

log = get_logger("healthcheck")

REQUIRED_IMPORTS = [
    "httpx", "pandas", "jinja2", "openpyxl", "bs4", "yaml", "click",
    "anthropic", "tenacity", "rapidfuzz",
]

REQUIRED_PROMPTS = [
    "buyer_classification_v1.txt",
    "outreach_angle_v1.txt",
]

REQUIRED_YAMLS = [
    "managing_agents.yaml",
    "law_firms.yaml",
]


class CheckResult:
    def __init__(self):
        self.passed: list[str] = []
        self.failed: list[tuple[str, str]] = []
        self.warnings: list[tuple[str, str]] = []

    def ok(self, name: str) -> None:
        self.passed.append(name)

    def fail(self, name: str, msg: str) -> None:
        self.failed.append((name, msg))

    def warn(self, name: str, msg: str) -> None:
        self.warnings.append((name, msg))

    def summary(self) -> dict:
        return {
            "passed": len(self.passed),
            "failed": len(self.failed),
            "warnings": len(self.warnings),
            "details": {
                "passed": self.passed,
                "failed": [{"check": n, "message": m} for n, m in self.failed],
                "warnings": [{"check": n, "message": m} for n, m in self.warnings],
            },
        }


def _check_imports(res: CheckResult) -> None:
    for mod in REQUIRED_IMPORTS:
        try:
            importlib.import_module(mod)
            res.ok(f"import:{mod}")
        except ImportError as e:
            res.fail(f"import:{mod}", str(e))


def _check_db_writable(res: CheckResult) -> None:
    path = db_path()
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        init_db()
        conn = sqlite3.connect(str(path))
        conn.execute("SELECT name FROM sqlite_master WHERE type='table' LIMIT 1")
        conn.close()
        res.ok(f"db:writable:{path}")
    except Exception as e:
        res.fail(f"db:writable:{path}", str(e))


def _check_dir_writable(res: CheckResult, name: str, path: Path) -> None:
    try:
        path.mkdir(parents=True, exist_ok=True)
        probe = path / ".healthcheck-probe"
        probe.write_text("ok")
        probe.unlink()
        res.ok(f"dir:{name}:{path}")
    except Exception as e:
        res.fail(f"dir:{name}:{path}", str(e))


def _check_prompts(res: CheckResult) -> None:
    for name in REQUIRED_PROMPTS:
        p = project_root() / "prompts" / name
        if not p.exists():
            res.fail(f"prompt:{name}", f"not found at {p}")
            continue
        content = p.read_text()
        if len(content) < 50:
            res.warn(f"prompt:{name}", f"suspiciously short ({len(content)} chars)")
        res.ok(f"prompt:{name}")


def _check_yamls(res: CheckResult) -> None:
    import yaml
    for name in REQUIRED_YAMLS:
        p = project_root() / name
        if not p.exists():
            res.fail(f"yaml:{name}", f"not found at {p}")
            continue
        try:
            data = yaml.safe_load(p.read_text())
            if not data:
                res.warn(f"yaml:{name}", "empty file")
            res.ok(f"yaml:{name}")
        except yaml.YAMLError as e:
            res.fail(f"yaml:{name}", f"parse error: {e}")


def _check_dry_run_smoke(res: CheckResult) -> None:
    """Run the weekly pipeline in dry-run under a tempdir and confirm all
    three artifact files exist. This is the highest-confidence check — if it
    passes, the scheduled run will too."""
    from . import cli as cli_mod

    tmp = Path(tempfile.mkdtemp(prefix="prospect-healthcheck-"))
    db_before = CONFIG.db_path
    out_before = CONFIG.output_dir
    # Monkey-patch via env since CONFIG is a frozen dataclass instance.
    # Simpler: redirect by rebuilding the dataclass? Instead, just call the
    # runner with explicit overrides — we don't want to mutate prod config.
    import os
    os.environ["PIPELINE_DB_PATH"] = str(tmp / "health.db")
    os.environ["PIPELINE_OUTPUT_DIR"] = str(tmp / "out")
    # Re-import config module to pick up new env
    from . import config as _config
    importlib.reload(_config)
    # cli imports config lazily inside _run_prospect_week via CONFIG. We
    # re-import cli too so it binds to the reloaded CONFIG.
    importlib.reload(cli_mod)

    try:
        result = asyncio.run(cli_mod._run_prospect_week(lookback_days=14, dry_run=True))
        for key in ("csv", "xlsx", "briefing"):
            if not Path(result[key]).exists():
                res.fail(f"smoke:{key}", f"not produced: {result[key]}")
                return
        res.ok("smoke:dry_run_end_to_end")
    except Exception as e:
        res.fail("smoke:dry_run_end_to_end", f"{type(e).__name__}: {e}")
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
        os.environ["PIPELINE_DB_PATH"] = db_before
        os.environ["PIPELINE_OUTPUT_DIR"] = out_before
        importlib.reload(_config)
        importlib.reload(cli_mod)


def _optional_socrata_probe(res: CheckResult) -> None:
    """One cheap call to confirm Socrata is reachable. Always-on since ACRIS
    is free; app token is only used when present."""
    import httpx
    headers = {"User-Agent": CONFIG.scraper_user_agent}
    if CONFIG.socrata_app_token:
        headers["X-App-Token"] = CONFIG.socrata_app_token
    try:
        with httpx.Client(headers=headers, timeout=10.0) as client:
            resp = client.get(
                "https://data.cityofnewyork.us/resource/bnx9-e6tj.json",
                params={"$limit": 1},
            )
            resp.raise_for_status()
        res.ok("probe:socrata_acris")
    except httpx.HTTPError as e:
        res.warn("probe:socrata_acris", f"unreachable: {e}")


def _optional_anthropic_probe(res: CheckResult) -> None:
    """Verify ANTHROPIC_API_KEY works. Skipped if key is empty (dry-run mode
    will use the heuristic classifier)."""
    if not CONFIG.anthropic_api_key:
        res.warn("probe:anthropic", "ANTHROPIC_API_KEY not set — classifier will use heuristic fallback")
        return
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=CONFIG.anthropic_api_key)
        resp = client.messages.create(
            model=CONFIG.buyer_classification_model,
            max_tokens=8,
            messages=[{"role": "user", "content": "ok"}],
        )
        if resp.content:
            res.ok("probe:anthropic")
        else:
            res.warn("probe:anthropic", "empty response")
    except Exception as e:
        res.fail("probe:anthropic", f"{type(e).__name__}: {e}")


CHECKS: list[tuple[str, Callable[[CheckResult], None]]] = [
    ("imports", _check_imports),
    ("db", _check_db_writable),
    ("output_dir", lambda r: _check_dir_writable(r, "output", Path(CONFIG.output_dir))),
    ("log_dir", lambda r: _check_dir_writable(r, "log", Path(CONFIG.log_dir))),
    ("prompts", _check_prompts),
    ("yamls", _check_yamls),
    ("socrata_probe", _optional_socrata_probe),
    ("anthropic_probe", _optional_anthropic_probe),
    ("dry_run_smoke", _check_dry_run_smoke),
]


def run_all(skip_network: bool = False, skip_smoke: bool = False) -> CheckResult:
    res = CheckResult()
    for name, check in CHECKS:
        if skip_network and name.endswith("_probe"):
            continue
        if skip_smoke and name == "dry_run_smoke":
            continue
        try:
            check(res)
        except Exception as e:
            res.fail(f"check:{name}", f"unexpected failure: {type(e).__name__}: {e}")
    return res


def format_report(res: CheckResult) -> str:
    lines = [f"Passed: {len(res.passed)}  Failed: {len(res.failed)}  Warnings: {len(res.warnings)}", ""]
    for name in res.passed:
        lines.append(f"  OK    {name}")
    for name, msg in res.warnings:
        lines.append(f"  WARN  {name}: {msg}")
    for name, msg in res.failed:
        lines.append(f"  FAIL  {name}: {msg}")
    return "\n".join(lines)
