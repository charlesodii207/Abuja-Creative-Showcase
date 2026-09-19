"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const EVENT_DATE = new Date("2026-12-04T09:00:00+01:00").getTime();

function getDaysLeft(): number {
  const diff = Math.max(EVENT_DATE - Date.now(), 0);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function CountdownBanner() {
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    setDaysLeft(getDaysLeft());

    const interval = setInterval(
      () => setDaysLeft(getDaysLeft()),
      1000 * 60 * 60
    );

    return () => clearInterval(interval);
  }, []);

  if (daysLeft === null) return null;

  return (
    <Link
      href="/countdown"
      className="group relative block overflow-hidden border-b border-white/10 bg-[#0D1128] px-6 py-3 text-center transition-all duration-300 hover:bg-[#11152F]"
    >
      {/* Subtle ambient accents */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-px w-32 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#E59200] to-transparent opacity-70"
      />

      <span className="relative inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs sm:text-sm">
        <span className="font-semibold uppercase tracking-[0.18em] text-[#E59200]">
          {daysLeft} days
        </span>

        <span className="hidden h-1 w-1 rounded-full bg-[#B80319] sm:block" />

        <span className="font-medium tracking-wide text-[#F5EFE6]/80">
          Until ACS 2026
        </span>

        <span className="hidden h-px w-5 bg-white/15 sm:block" />

        <span className="text-[#B8B3AA]/65">
          Dec 4–5 · Abuja
        </span>

        <span className="ml-1 text-[#00A5A8] transition-transform duration-300 group-hover:translate-x-1">
          →
        </span>
      </span>

      <span
        aria-hidden="true"
        className="absolute bottom-0 left-0 h-px w-0 bg-[#00A5A8] transition-all duration-500 group-hover:w-full"
      />
    </Link>
  );
}