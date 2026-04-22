"""Built-in fixtures used when --dry-run is set or when paid APIs are unavailable."""
from __future__ import annotations

import json
from datetime import date, timedelta
from pathlib import Path
from typing import Any

FIX_DIR = Path(__file__).resolve().parent


def load(name: str) -> Any:
    path = FIX_DIR / name
    with path.open() as f:
        return json.load(f)


def _today_minus(days: int) -> str:
    return (date.today() - timedelta(days=days)).isoformat()


def render(name: str) -> Any:
    """Load a fixture and substitute ${TODAY-N} placeholders with real dates."""
    raw = (FIX_DIR / name).read_text()
    # We keep fixtures lightweight and do a simple $TODAY-N substitution.
    out = []
    for line in raw.splitlines():
        while "${TODAY-" in line:
            start = line.index("${TODAY-")
            end = line.index("}", start)
            token = line[start : end + 1]
            n = int(token[len("${TODAY-") : -1])
            line = line.replace(token, _today_minus(n))
        out.append(line)
    return json.loads("\n".join(out))
