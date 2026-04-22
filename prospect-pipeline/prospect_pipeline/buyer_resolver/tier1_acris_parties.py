"""Tier 1 — ACRIS Parties direct match.

Non-LLC, non-trust, non-estate buyer names go straight through with `confidence=high`.
LLC/trust/estate strings get flagged as needing Tier 2/3 unmasking.
"""
from __future__ import annotations

import re
from typing import Any

from ..db import from_json
from ..utils.logging import get_logger

log = get_logger("tier1")

ENTITY_PATTERNS = [
    r"\bLLC\b",
    r"\bLLP\b",
    r"\bL\.P\.",
    r"\bLP\b",
    r"\bINC\b",
    r"\bCORP\b",
    r"\bTRUST\b",
    r"\bESTATE OF\b",
    r"\bHOLDINGS\b",
    r"\bPARTNERS\b",
    r"\bFOUNDATION\b",
]
_ENTITY_RE = re.compile("|".join(ENTITY_PATTERNS), re.IGNORECASE)


def is_entity_name(name: str) -> bool:
    return bool(_ENTITY_RE.search(name or ""))


def resolve(event: dict[str, Any]) -> dict[str, Any]:
    """Returns a resolution dict: {resolved_name, confidence, evidence}."""
    buyers = from_json(event.get("raw_buyer_names")) or []
    if not buyers:
        return {
            "resolved_name": None,
            "confidence": None,
            "evidence": {"reason": "no_parties"},
            "needs_entity_unmask": False,
        }

    individuals = [b for b in buyers if not is_entity_name(b)]
    entities = [b for b in buyers if is_entity_name(b)]

    if individuals:
        # Prefer a named individual as direct hit.
        return {
            "resolved_name": individuals[0],
            "confidence": "high",
            "evidence": {
                "all_buyers": buyers,
                "selected_individual": individuals[0],
                "additional_entities": entities,
            },
            "needs_entity_unmask": False,
        }

    # All entities — needs Tier 2/3 unmask. Pass the entity through as resolved_name.
    return {
        "resolved_name": entities[0],
        "confidence": "low",
        "evidence": {"all_buyers": buyers, "all_entities": entities},
        "needs_entity_unmask": True,
    }
