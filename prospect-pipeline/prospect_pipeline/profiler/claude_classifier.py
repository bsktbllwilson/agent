"""Tier 8 — buyer classification via Claude.

Inputs: everything we have (name, firm, title, press excerpts, other holdings,
the triggering transaction, attorney firm).

Output: structured JSON per `prompts/buyer_classification_v1.txt`.

In dry-run (or if ANTHROPIC_API_KEY is missing) we return a deterministic
heuristic classification so the pipeline produces a useful dossier end-to-end.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from ..config import CONFIG, project_root
from ..utils.logging import get_logger

log = get_logger("classifier")

PROMPT_PATH = project_root() / "prompts" / "buyer_classification_v1.txt"


def _load_prompt() -> str:
    return PROMPT_PATH.read_text()


def _heuristic_classify(ctx: dict[str, Any]) -> dict[str, Any]:
    """Deterministic fallback classification based on simple signals. Used when
    no ANTHROPIC_API_KEY is configured or in dry-run."""
    name = (ctx.get("resolved_name") or "").upper()
    firm = (ctx.get("primary_firm") or "").lower()
    title = (ctx.get("title") or "").lower()
    holdings_count = ctx.get("holdings_count") or 0
    attorney = (ctx.get("attorney_firm") or "").lower()
    trig_price = ctx.get("trigger_price") or 0
    trig_asset = ctx.get("trigger_asset_type") or ""

    buyer_type = "Unresolved"
    if firm:
        if any(tok in firm for tok in ["family office", "wealth"]):
            buyer_type = "Family Office"
        elif any(tok in firm for tok in ["bridgewater", "citadel", "millennium", "two sigma", "hedge", "capital partners", "avon partners"]):
            buyer_type = "Hedge Fund"
        elif any(tok in firm for tok in ["blackstone", "kkr", "carlyle", "apollo management", "private equity"]):
            buyer_type = "Private Equity"
        elif any(tok in firm for tok in ["ventures", "google", "meta", "amazon", "openai", "anthropic", "stripe"]):
            buyer_type = "Tech Executive"
        elif any(tok in firm for tok in ["goldman", "morgan stanley", "jpmorgan", "citi", "lazard"]):
            buyer_type = "Finance Executive"
    if buyer_type == "Unresolved" and title:
        if any(tok in title for tok in ["partner", "managing partner", "principal", "cio", "ceo"]):
            buyer_type = "Finance Executive"

    # Net worth band — conservative
    if buyer_type == "Unresolved":
        band = "Unknown"
    elif trig_price >= 20_000_000 or holdings_count >= 3:
        band = "$250M-1B"
    elif trig_price >= 10_000_000 or holdings_count >= 2:
        band = "$50-250M"
    else:
        band = "$10-50M"

    geography = "domestic_ny"
    if any(tok in (ctx.get("primary_firm") or "").lower() for tok in ["ae", "uae", "dubai", "riyadh", "saudi"]):
        geography = "foreign"

    affiliations: list[str] = []
    if attorney:
        affiliations.append(f"Counsel: {ctx.get('attorney_firm')}")

    if trig_asset == "coop":
        angle = (
            f"Closed {trig_asset} at {ctx.get('trigger_address')} for ${trig_price:,}; "
            "calling about sideways move options in the building and similar boards."
        )
    elif holdings_count:
        angle = (
            f"Owner of {holdings_count+1} NYC properties including {ctx.get('trigger_address')}; "
            "calling about a quiet nearby listing."
        )
    else:
        angle = (
            f"Recent {trig_asset} purchase at {ctx.get('trigger_address')} for ${trig_price:,}; "
            "introductory call to discuss neighborhood inventory coming to market."
        )

    flags = []
    if "estate of" in (ctx.get("raw_context") or "").lower():
        flags.append("estate seller — sensitive timing")
    return {
        "buyer_type": buyer_type,
        "estimated_net_worth_band": band,
        "geography_signal": geography,
        "known_affiliations": affiliations,
        "outreach_angle": angle,
        "sensitivity_flags": flags,
        "confidence": "medium" if buyer_type != "Unresolved" else "low",
        "rationale": "Heuristic classifier (no API key or dry-run).",
    }


def _anthropic_classify(ctx: dict[str, Any]) -> dict[str, Any]:
    try:
        import anthropic
    except ImportError:
        log.warning("anthropic SDK not available — using heuristic fallback")
        return _heuristic_classify(ctx)
    client = anthropic.Anthropic(api_key=CONFIG.anthropic_api_key)
    prompt = _load_prompt()
    user_content = json.dumps(ctx, default=str, indent=2)
    resp = client.messages.create(
        model=CONFIG.buyer_classification_model,
        max_tokens=800,
        temperature=0.1,
        system=prompt,
        messages=[{"role": "user", "content": user_content}],
    )
    raw = resp.content[0].text.strip() if resp.content else ""
    # Model returns JSON per prompt instructions.
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        log.warning("Claude returned non-JSON; falling back. Response: %s", raw[:200])
        return _heuristic_classify(ctx)


def classify(ctx: dict[str, Any], *, dry_run: bool) -> dict[str, Any]:
    """Main entry. `ctx` should include: resolved_name, primary_firm, title,
    holdings_count, attorney_firm, trigger_address, trigger_price, trigger_asset_type,
    press_excerpts (optional), raw_context (optional)."""
    if dry_run or not CONFIG.anthropic_api_key:
        return _heuristic_classify(ctx)
    try:
        return _anthropic_classify(ctx)
    except Exception as e:
        log.warning("Claude classification failed: %s — using heuristic", e)
        return _heuristic_classify(ctx)
