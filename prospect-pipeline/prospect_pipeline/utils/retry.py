"""Retry helpers backed by tenacity.

We use `retry_with_backoff` as a decorator for any function making a network
call. Exponential backoff, caps at 5 attempts by default.
"""
from __future__ import annotations

from typing import Callable, TypeVar

import httpx
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

T = TypeVar("T")


RETRYABLE_EXC = (
    httpx.TransportError,
    httpx.RemoteProtocolError,
    httpx.TimeoutException,
)


def retry_with_backoff(
    max_attempts: int = 5,
    min_wait: float = 1.0,
    max_wait: float = 30.0,
) -> Callable[[Callable[..., T]], Callable[..., T]]:
    return retry(
        reraise=True,
        stop=stop_after_attempt(max_attempts),
        wait=wait_exponential(multiplier=1, min=min_wait, max=max_wait),
        retry=retry_if_exception_type(RETRYABLE_EXC),
    )
