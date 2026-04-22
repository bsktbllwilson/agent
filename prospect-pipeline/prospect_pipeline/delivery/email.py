"""Email delivery of the weekly briefing.

Sends the rendered Markdown briefing as the body (plus a text-flavored preview
for clients that don't render markdown) and attaches the CSV + XLSX. Only
fires if SMTP_HOST + REPORT_RECIPIENT are set; unconfigured or dry-run → noop.

Subject line is derived from run totals so the team can triage from the inbox:
    "NYC prospect briefing 2026-04-22 — 3 hot / 2 warm / 8 indirect"
"""
from __future__ import annotations

import mimetypes
import smtplib
import ssl
from dataclasses import dataclass
from email.message import EmailMessage
from pathlib import Path

from ..config import CONFIG
from ..utils.logging import get_logger

log = get_logger("delivery.email")


@dataclass
class DeliveryResult:
    sent: bool
    reason: str
    recipient: str | None = None


def _recipients() -> list[str]:
    """Parse REPORT_RECIPIENT. Accepts `"a@x"` or `"a@x, b@y"`."""
    raw = (CONFIG.report_recipient or "").strip()
    if not raw:
        return []
    return [r.strip() for r in raw.split(",") if r.strip()]


def _sender_identity() -> str:
    """Use SMTP_USER as From; fall back to a localhost-style sender if SMTP_USER
    lacks an `@` (some relays accept this)."""
    user = (CONFIG.smtp_user or "").strip()
    if "@" in user:
        return user
    return user or "prospect-pipeline@localhost"


def _attach(msg: EmailMessage, path: Path) -> None:
    """Attach a file with a best-guess MIME type."""
    if not path.exists():
        log.warning("skip attach (missing): %s", path)
        return
    ctype, encoding = mimetypes.guess_type(str(path))
    if ctype is None or encoding is not None:
        ctype = "application/octet-stream"
    maintype, subtype = ctype.split("/", 1)
    with path.open("rb") as f:
        msg.add_attachment(
            f.read(),
            maintype=maintype,
            subtype=subtype,
            filename=path.name,
        )


def send_briefing(
    *,
    briefing_md_path: Path,
    csv_path: Path | None,
    xlsx_path: Path | None,
    totals: dict,
    as_of_date: str,
    dry_run: bool = False,
) -> DeliveryResult:
    """Send the weekly briefing. Returns a DeliveryResult."""
    to_addrs = _recipients()
    if dry_run:
        return DeliveryResult(False, "dry-run")
    if not CONFIG.smtp_host or not to_addrs:
        return DeliveryResult(False, "smtp_not_configured")
    if not briefing_md_path.exists():
        return DeliveryResult(False, f"briefing missing: {briefing_md_path}")

    body = briefing_md_path.read_text()
    subject = (
        f"NYC prospect briefing {as_of_date} — "
        f"{totals.get('hot', 0)} hot / "
        f"{totals.get('warm', 0)} warm / "
        f"{totals.get('indirect', 0)} indirect"
    )

    msg = EmailMessage()
    msg["From"] = _sender_identity()
    msg["To"] = ", ".join(to_addrs)
    msg["Subject"] = subject
    # text/plain body = raw markdown; most email clients render headers/lists
    # legibly as plaintext. Intentionally no HTML — some shops strip HTML email.
    msg.set_content(body)

    for p in (csv_path, xlsx_path):
        if p is not None:
            _attach(msg, p)

    host = CONFIG.smtp_host
    port = CONFIG.smtp_port or 587
    use_tls = port in (587, 25) or "starttls" in host.lower()

    try:
        if port == 465:
            ctx = ssl.create_default_context()
            with smtplib.SMTP_SSL(host, port, context=ctx, timeout=30) as s:
                if CONFIG.smtp_user:
                    s.login(CONFIG.smtp_user, CONFIG.smtp_pass)
                s.send_message(msg)
        else:
            with smtplib.SMTP(host, port, timeout=30) as s:
                s.ehlo()
                if use_tls:
                    s.starttls(context=ssl.create_default_context())
                    s.ehlo()
                if CONFIG.smtp_user:
                    s.login(CONFIG.smtp_user, CONFIG.smtp_pass)
                s.send_message(msg)
    except (smtplib.SMTPException, OSError) as e:
        log.exception("email send failed: %s", e)
        return DeliveryResult(False, f"{type(e).__name__}: {e}")

    log.info("briefing emailed to %s (%s)", to_addrs, subject)
    return DeliveryResult(True, "sent", recipient=", ".join(to_addrs))
