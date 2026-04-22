"""One-page Monday briefing for the broker team.

Format:
    - Header: week range, totals
    - Top 5 call list with angle
    - Warm/indirect counts
    - Contract-signed watchlist
"""
from __future__ import annotations

from datetime import date
from pathlib import Path
from typing import Sequence

from jinja2 import Template


BRIEFING_TMPL = Template("""# Prospect Briefing — {{ as_of_date }}

**Lookback window:** last {{ lookback_days }} days
**Trigger events (≥ $4M):** {{ totals.trigger_events }}
**Prospects resolved:** {{ totals.prospects }} ({{ totals.hot }} hot / {{ totals.warm }} warm / {{ totals.indirect }} indirect)
**Contract-signed watchlist (UrbanDigs):** {{ totals.contracts }}

---

## Top 5 calls this week

{% if top5 %}
{% for p in top5 %}
**{{ loop.index }}. {{ p.legal_name or p.resolved_principal }}** — {{ p.buyer_type }}{% if p.primary_firm %} at {{ p.primary_firm }}{% endif %}{% if p.title %} ({{ p.title }}){% endif %}{% if p.resolved_principal and p.resolved_principal != p.legal_name %} _(LLC principal: {{ p.resolved_principal }})_{% endif %}
- *Trigger:* {{ p.trigger_address }} — ${{ "{:,.0f}".format(p.trigger_price or 0) }} ({{ p.trigger_asset_type or "unknown" }})
- *Channel:* {{ p.recommended_channel }}{% if p.work_email %} — {{ p.work_email }}{% endif %}{% if p.work_phone %} / {{ p.work_phone }}{% endif %}
- *Angle:* {{ p.outreach_angle }}
{% if p.sensitivity_flags %}- *Flags:* {{ p.sensitivity_flags | join(", ") }}{% endif %}

{% endfor %}
{% else %}
_No high-confidence prospects this week._
{% endif %}

## Warm leads — {{ totals.warm }}

{% if warm %}
{% for p in warm[:10] %}
- {{ p.legal_name or p.resolved_principal }} — {{ p.trigger_address }} (${{ "{:,.0f}".format(p.trigger_price or 0) }}) → {{ p.recommended_channel }}
{% endfor %}
{% if warm|length > 10 %}_…and {{ warm|length - 10 }} more in the XLSX._{% endif %}
{% else %}
_None._
{% endif %}

## Indirect routes — {{ totals.indirect }}

{% if indirect %}
{% for p in indirect[:10] %}
- {{ p.legal_name }} — {{ p.trigger_address }} → {% if p.attorney_firm %}attorney: {{ p.attorney_firm }}{% elif p.managing_agent %}managing agent: {{ p.managing_agent }}{% elif p.broker_to_contact %}selling broker: {{ p.broker_to_contact }}{% else %}no route{% endif %}
{% endfor %}
{% if indirect|length > 10 %}_…and {{ indirect|length - 10 }} more._{% endif %}
{% else %}
_None._
{% endif %}

## Contract-signed watchlist

{% if contracts %}
{% for c in contracts[:10] %}
- {{ c.trigger_address or c.legal_name }} — ${{ "{:,.0f}".format(c.trigger_price or 0) }} — listing: {{ c.broker_to_contact or "unknown" }}
{% endfor %}
{% else %}
_None this week._
{% endif %}

---
_Suppression: prospects contacted within {{ suppression_days }} days are hidden from this list._
""")


def _prepare(prospect: dict) -> dict:
    """Copy + annotate fields the template references (trigger_* come from
    the join we do in write_briefing)."""
    return prospect


def write_briefing(
    path: Path,
    *,
    as_of_date: date,
    lookback_days: int,
    suppression_days: int,
    totals: dict,
    top5: Sequence[dict],
    warm: Sequence[dict],
    indirect: Sequence[dict],
    contracts: Sequence[dict],
) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    md = BRIEFING_TMPL.render(
        as_of_date=as_of_date.isoformat(),
        lookback_days=lookback_days,
        suppression_days=suppression_days,
        totals=totals,
        top5=[_prepare(p) for p in top5],
        warm=[_prepare(p) for p in warm],
        indirect=[_prepare(p) for p in indirect],
        contracts=[_prepare(p) for p in contracts],
    )
    path.write_text(md)
    return path
