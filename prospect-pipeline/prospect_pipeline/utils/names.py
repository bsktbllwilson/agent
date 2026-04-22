"""Name normalization helpers.

ACRIS parties come as `LASTNAME, FIRSTNAME MIDDLE.` — we canonicalize to
`FIRSTNAME MIDDLE. LASTNAME` so downstream lookups (Clay, LinkedIn) match.
"""
from __future__ import annotations

import re

SUFFIXES = {"JR", "JR.", "SR", "SR.", "II", "III", "IV"}


def canonical_person_name(raw: str) -> str:
    """Convert `LAST, FIRST MIDDLE.` → `FIRST MIDDLE. LAST`. Leaves already-
    canonical names unchanged."""
    if not raw:
        return raw
    s = raw.strip()
    if "," not in s:
        return s
    parts = [p.strip() for p in s.split(",", 1)]
    if len(parts) != 2 or not parts[1]:
        return s
    last, rest = parts
    # Strip trailing suffix from rest (e.g. "JOHN JR" -> "JOHN")
    rest_tokens = rest.split()
    suffix = None
    if rest_tokens and rest_tokens[-1].upper().strip(".") in {s.rstrip(".") for s in SUFFIXES}:
        suffix = rest_tokens.pop()
    first_middle = " ".join(rest_tokens)
    canonical = f"{first_middle} {last}".strip()
    if suffix:
        canonical += f" {suffix}"
    return re.sub(r"\s+", " ", canonical)
