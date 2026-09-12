"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const EVENT_DATE = new Date("2026-12-04T09:00:00+01:00").getTime();

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(): TimeLeft {
  const diff = Math.max(EVENT_DATE - Date.now(), 0);
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-ink-raised px-6 py-8 sm:px-10">
      <span className="font-display text-4xl text-teal sm:text-6xl">
        {String(value).padStart(2, "0")}
      </span>
      <span className="mt-2 text-xs uppercase tracking-widest text-muted sm:text-sm">
        {label}
      </span>
    </div>
  );
}

export default function CountdownClock() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setTimeLeft(getTimeLeft());
    const interval = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(interval);
  }, []);

  async function handleShare() {
    const shareData = {
      title: "Abuja Creative Showcase 2026",
      text: "Counting down to ACS 2026 — Dec 4-5 at the Old Parade Ground, Abuja. Are you going?",
      url: "https://www.abujacreativeshowcase.com/countdown",
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled, ignore
      }
    } else {
      await navigator.clipboard.writeText(shareData.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-20 text-center md:py-28">
      <div className="tricolor-rule mx-auto mb-6 w-fit">
        <span /><span /><span />
      </div>

      <p className="text-sm uppercase tracking-widest text-gold">
        December 4–5, 2026 · Old Parade Ground, Abuja
      </p>
      <h1 className="mt-3 font-display text-3xl text-cream sm:text-5xl">
        Counting Down to ACS
      </h1>
      <p className="mt-4 text-muted">
        Where Creativity Meets Opportunity.
      </p>

      <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {timeLeft ? (
          <>
            <Unit value={timeLeft.days} label="Days" />
            <Unit value={timeLeft.hours} label="Hours" />
            <Unit value={timeLeft.minutes} label="Minutes" />
            <Unit value={timeLeft.seconds} label="Seconds" />
          </>
        ) : (
          <div className="col-span-4 py-8 text-muted">Loading...</div>
        )}
      </div>

      <div className="mt-14 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <button
          onClick={handleShare}
          className="rounded-full bg-teal px-7 py-3.5 text-sm font-medium text-ink transition-transform hover:scale-105"
        >
          {copied ? "Link Copied!" : "Share the Countdown"}
        </button>
        <Link
          href="/register"
          className="rounded-full bg-gold px-7 py-3.5 text-sm font-medium text-ink transition-transform hover:scale-105"
        >
          Register Now
        </Link>
      </div>
    </main>
  );
}