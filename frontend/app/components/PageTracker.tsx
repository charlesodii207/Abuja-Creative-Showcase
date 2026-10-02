// components/PageTracker.tsx
"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Same fallback as lib/admin/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Sends one hit per page view. The server reads the visitor's IP from the
// request headers and works out the source from utm_source / referrer.
export default function PageTracker() {
  const pathname = usePathname();
  const params = useSearchParams();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return; // never track staff

    fetch(`${API_URL}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "omit",
      keepalive: true,
      body: JSON.stringify({
        path: pathname,
        referrer: document.referrer || null,
        utm_source: params.get("utm_source"),
      }),
    }).catch(() => {}); // tracking must never break the page
  }, [pathname, params]);

  return null;
}
