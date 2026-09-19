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

function Unit({
  value,
  label,
  accent,
}: {
  value: number;
  label: string;
  accent: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#151A3A] px-5 py-8 shadow-[0_20px_60px_rgba(0,0,0,0.14)] transition-all duration-300 hover:-translate-y-1 hover:border-white/15 sm:px-8 sm:py-10">
      <div
        aria-hidden="true"
        className="absolute left-0 top-0 h-[2px] w-full opacity-70"
        style={{ backgroundColor: accent }}
      />

      <div
        aria-hidden="true"
        className="absolute -right-10 -top-10 h-24 w-24 rounded-full blur-2xl opacity-10 transition-opacity duration-300 group-hover:opacity-20"
        style={{ backgroundColor: accent }}
      />

      <div className="relative">
        <span
          className="font-display text-5xl leading-none sm:text-6xl lg:text-7xl"
          style={{ color: accent }}
        >
          {String(value).padStart(2, "0")}
        </span>

        <span className="mt-3 block text-[9px] font-semibold uppercase tracking-[0.3em] text-[#B8B3AA]/50 sm:text-[10px]">
          {label}
        </span>
      </div>
    </div>
  );
}

export default function CountdownClock() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setTimeLeft(getTimeLeft());

    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  async function handleShare() {
    const shareData = {
      title: "Afriqa Creative Showcase 2026",
      text: "Counting down to ACS 2026 — Dec 4-5 at the Old Parade Ground, Abuja. Are you going?",
      url: "https://africacreativeshowcase.com/countdown",
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled.
      }
    } else {
      await navigator.clipboard.writeText(shareData.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#11152F]">
      {/* Ambient details */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 top-20 h-72 w-72 rounded-full border border-[#E59200]/10"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-28 bottom-20 h-56 w-56 rounded-full border border-[#00A5A8]/10"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-32 h-96 w-96 -translate-x-1/2 rounded-full bg-[#B80319]/[0.04] blur-[120px]"
      />

      <div className="relative mx-auto max-w-5xl px-6 py-20 sm:px-8 md:py-28 lg:px-10">
        {/* Header */}
        <div className="text-center">
          <div className="tricolor-rule mx-auto mb-7">
            <span />
            <span />
            <span />
          </div>

          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#E59200] sm:text-xs">
            December 4–5, 2026 · Abuja
          </p>

          <h1 className="mt-4 font-display text-4xl leading-[1.02] text-[#F5EFE6] sm:text-5xl md:text-6xl">
            Counting Down to ACS
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[#B8B3AA]/70 sm:text-lg">
            Where Creativity Meets Opportunity.
          </p>
        </div>

        {/* Countdown */}
        <div className="relative mt-14">
          <div
            aria-hidden="true"
            className="absolute -inset-3 rounded-[2.25rem] border border-white/[0.04]"
          />

          <div className="relative grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {timeLeft ? (
              <>
                <Unit
                  value={timeLeft.days}
                  label="Days"
                  accent="#B80319"
                />

                <Unit
                  value={timeLeft.hours}
                  label="Hours"
                  accent="#E59200"
                />

                <Unit
                  value={timeLeft.minutes}
                  label="Minutes"
                  accent="#00A5A8"
                />

                <Unit
                  value={timeLeft.seconds}
                  label="Seconds"
                  accent="#F5EFE6"
                />
              </>
            ) : (
              <div className="col-span-2 py-12 text-center text-sm text-[#B8B3AA]/50 sm:col-span-4">
                Loading countdown...
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button
            type="button"
            onClick={handleShare}
            className="group inline-flex items-center justify-center rounded-full border border-white/15 bg-[#151A3A] px-7 py-3.5 text-sm font-medium text-[#F5EFE6] transition-all duration-300 hover:-translate-y-1 hover:border-[#00A5A8]/50 hover:bg-[#191F43]"
          >
            {copied ? "Link Copied!" : "Share the Countdown"}

            <span className="ml-2 text-[#00A5A8] transition-transform duration-300 group-hover:translate-x-1">
              ↗
            </span>
          </button>

          <Link
            href="/register"
            className="group inline-flex items-center justify-center rounded-full bg-[#E59200] px-7 py-3.5 text-sm font-medium text-[#11152F] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_35px_rgba(229,146,0,0.2)]"
          >
            Register Now

            <span className="ml-2 transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>

        {/* Footer detail */}
        <div className="mx-auto mt-16 flex max-w-xl items-center justify-center gap-4">
          <span className="h-px flex-1 bg-white/10" />

          <span className="h-1.5 w-1.5 rounded-full bg-[#E59200]" />

          <span className="text-[9px] font-semibold uppercase tracking-[0.3em] text-[#F5EFE6]/30">
            Old Parade Ground
          </span>

          <span className="h-1.5 w-1.5 rounded-full bg-[#B80319]" />

          <span className="h-px flex-1 bg-white/10" />
        </div>
      </div>
    </main>
  );
}