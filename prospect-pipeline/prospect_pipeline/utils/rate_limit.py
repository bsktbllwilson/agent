"""Simple per-host token-bucket rate limiter.

Usage:
    limiter = RateLimiter(min_interval_seconds=2.0)
    async with limiter:
        await httpx.AsyncClient().get(...)
"""
from __future__ import annotations

import asyncio
import time


class RateLimiter:
    """Enforce a minimum interval between calls, shared across callers."""

    def __init__(self, min_interval_seconds: float):
        self.min_interval = float(min_interval_seconds)
        self._last = 0.0
        self._lock = asyncio.Lock()

    async def __aenter__(self):
        async with self._lock:
            now = time.monotonic()
            wait = self.min_interval - (now - self._last)
            if wait > 0:
                await asyncio.sleep(wait)
            self._last = time.monotonic()
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False
