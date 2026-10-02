// components/PageTracker.tsx
"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Same fallback as lib/admin/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const ATTR_KEY = "acs_attribution";

type Attribution = { referrer: string | null; utm_source: string | null };

// Sends one hit per page view. Where the visitor came from (utm_source /
// referrer) is only known on the first page, so it is saved for the
// browsing session and reused on later pages. The server marks the first
// hit as a "landing" — that is the actual click from a social post.
export default function PageTracker() {
  const pathname = usePathname();
  const params = useSearchParams();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return; // never track staff

    let attribution: Attribution = {
      referrer: document.referrer || null,
      utm_source: params.get("utm_source"),
    };
    let isLanding = true;

    try {
      const saved = sessionStorage.getItem(ATTR_KEY);
      if (saved) {
        attribution = JSON.parse(saved);
        isLanding = false;
      } else {
        sessionStorage.setItem(ATTR_KEY, JSON.stringify(attribution));
      }
    } catch {
      // storage blocked — every hit counts as a landing, which is fine
    }

    fetch(`${API_URL}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "omit",
      keepalive: true,
      body: JSON.stringify({
        path: pathname,
        referrer: attribution.referrer,
        utm_source: attribution.utm_source,
        is_landing: isLanding,
      }),
    }).catch(() => {}); // tracking must never break the page
  }, [pathname, params]);

  return null;
}
