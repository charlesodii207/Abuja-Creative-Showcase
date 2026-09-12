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
    const interval = setInterval(() => setDaysLeft(getDaysLeft()), 1000 * 60 * 60);
    return () => clearInterval(interval);
  }, []);

  if (daysLeft === null) return null;

  return (
    <Link
      href="/countdown"
      className="block bg-teal px-6 py-2.5 text-center text-sm font-medium text-ink transition-colors hover:bg-teal/90"
    >
      {daysLeft} days until ACS 2026 · Dec 4–5 · Old Parade Ground, Abuja →
    </Link>
  );
}