"""Runtime configuration loaded from environment + .env."""
from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


def _bool(val: str | None, default: bool = False) -> bool:
    if val is None:
        return default
    return val.strip().lower() in {"1", "true", "yes", "on"}


def _int(val: str | None, default: int) -> int:
    try:
        return int(val) if val is not None else default
    except ValueError:
        return default


@dataclass(frozen=True)
class Config:
    # Trigger sources
    socrata_app_token: str = os.getenv("SOCRATA_APP_TOKEN", "")
    urbandigs_api_key: str = os.getenv("URBANDIGS_API_KEY", "")
    urbandigs_base_url: str = os.getenv("URBANDIGS_BASE_URL", "")
    urbandigs_enabled: bool = _bool(os.getenv("URBANDIGS_ENABLED"), False)

    # Buyer resolution
    marketproof_api_key: str = os.getenv("MARKETPROOF_API_KEY", "")
    marketproof_base_url: str = os.getenv(
        "MARKETPROOF_BASE_URL", "https://api.marketproof.com/v1"
    )
    propertyshark_api_key: str = os.getenv("PROPERTYSHARK_API_KEY", "")
    propertyshark_base_url: str = os.getenv(
        "PROPERTYSHARK_BASE_URL", "https://api.propertyshark.com/v1"
    )

    # Contact enrichment
    clay_api_key: str = os.getenv("CLAY_API_KEY", "")
    clay_workspace_id: str = os.getenv("CLAY_WORKSPACE_ID", "")

    # Classification
    anthropic_api_key: str = os.getenv("ANTHROPIC_API_KEY", "")
    buyer_classification_model: str = os.getenv(
        "BUYER_CLASSIFICATION_MODEL", "claude-opus-4-7"
    )

    # CRM
    hubspot_api_key: str = os.getenv("HUBSPOT_API_KEY", "")
    salesforce_creds: str = os.getenv("SALESFORCE_CREDS", "")

    # Scraping posture
    scraper_user_agent: str = os.getenv(
        "SCRAPER_USER_AGENT",
        "AlignmentRE-ResearchBot/1.0 (contact@alignmentre.com)",
    )
    enable_press_scraper: bool = _bool(os.getenv("ENABLE_PRESS_SCRAPER"), True)

    # Suppression
    outreach_suppression_days: int = _int(os.getenv("OUTREACH_SUPPRESSION_DAYS"), 90)

    # Delivery
    smtp_host: str = os.getenv("SMTP_HOST", "")
    smtp_port: int = _int(os.getenv("SMTP_PORT"), 587)
    smtp_user: str = os.getenv("SMTP_USER", "")
    smtp_pass: str = os.getenv("SMTP_PASS", "")
    report_recipient: str = os.getenv("REPORT_RECIPIENT", "")

    # Local paths
    db_path: str = os.getenv("PIPELINE_DB_PATH", "prospect_pipeline.db")
    output_dir: str = os.getenv("PIPELINE_OUTPUT_DIR", "./out")
    log_dir: str = os.getenv("PIPELINE_LOG_DIR", "./logs")


CONFIG = Config()


def project_root() -> Path:
    """Repo root (parent of the prospect_pipeline package)."""
    return Path(__file__).resolve().parent.parent
