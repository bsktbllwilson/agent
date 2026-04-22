"use client";

import { useEffect } from "react";

type Props = { listingId: string };

/** Fires one view POST per mount. Uses the beacon API when available so
 *  the request survives a quick bounce away from the page. */
export function ViewTracker({ listingId }: Props) {
  useEffect(() => {
    const body = JSON.stringify({ listing_id: listingId });
    const url = "/api/track/view";
    try {
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
        return;
      }
    } catch {
      // fall through to fetch
    }
    fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      /* silent */
    });
  }, [listingId]);
  return null;
}
