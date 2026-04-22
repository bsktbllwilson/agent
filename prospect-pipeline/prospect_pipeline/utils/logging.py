"""Logging setup with file rotation."""
from __future__ import annotations

import logging
import logging.handlers
from pathlib import Path

from ..config import CONFIG

_CONFIGURED = False


def setup_logging(level: int = logging.INFO) -> logging.Logger:
    global _CONFIGURED
    logger = logging.getLogger("prospect_pipeline")
    if _CONFIGURED:
        return logger
    logger.setLevel(level)
    logger.propagate = False

    fmt = logging.Formatter(
        "%(asctime)s  %(levelname)-7s  %(name)s  %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
    )

    console = logging.StreamHandler()
    console.setFormatter(fmt)
    logger.addHandler(console)

    log_dir = Path(CONFIG.log_dir)
    try:
        log_dir.mkdir(parents=True, exist_ok=True)
        fh = logging.handlers.RotatingFileHandler(
            log_dir / "pipeline.log",
            maxBytes=5_000_000,
            backupCount=5,
        )
        fh.setFormatter(fmt)
        logger.addHandler(fh)
    except OSError:
        # If log dir not writable (sandboxed envs), stderr-only is fine.
        pass

    _CONFIGURED = True
    return logger


def get_logger(name: str) -> logging.Logger:
    setup_logging()
    return logging.getLogger(f"prospect_pipeline.{name}")
