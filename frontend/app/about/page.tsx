import type { Metadata } from "next";
import { aboutExtended } from "@/lib/content";
import Reveal from "../components/Reveal";

export const metadata: Metadata = {
  title: "About the Event",
  description:
    "Learn about Afriqa Creative Showcase 2026 — a two-day creative industry platform at the Old Parade Ground, Abuja, connecting film, music, fashion, art, and tech talent with markets, capital, and opportunity.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#11152F]">
      {/* Subtle decorative accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 top-24 h-48 w-48 rounded-full border border-[#E59200]/15"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-16 bottom-32 h-32 w-32 rounded-full border border-[#00A5A8]/15"
      />

      <div className="mx-auto max-w-4xl px-6 py-20 sm:px-8 md:py-28 lg:px-10">
        <div className="relative">
          {/* Editorial frame */}
          <div
            aria-hidden="true"
            className="absolute -inset-4 rounded-[2rem] border border-white/[0.06] sm:-inset-6"
          />

          <div className="relative">
            {/* Section marker */}
            <Reveal>
              <div className="mb-7 flex items-center gap-4">
                <div className="tricolor-rule">
                  <span />
                  <span />
                  <span />
                </div>

                <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cream/45">
                  The Showcase
                </span>
              </div>
            </Reveal>

            {/* Heading */}
            <Reveal delay={80}>
              <h1 className="max-w-3xl font-display text-4xl leading-[1.05] text-cream sm:text-5xl md:text-6xl">
                About Afriqa Creative Showcase
              </h1>
            </Reveal>

            {/* Accent line */}
            <Reveal delay={140}>
              <div className="mt-8 h-px w-24 bg-[#E59200]/60" />
            </Reveal>

            {/* Content */}
            <div className="mt-10 max-w-3xl space-y-6 text-base leading-relaxed text-white/65 sm:text-lg">
              {aboutExtended.map((paragraph, i) => (
                <Reveal key={i} delay={180 + i * 70}>
                  <p>{paragraph}</p>
                </Reveal>
              ))}
            </div>

            {/* Closing detail */}
            <Reveal delay={aboutExtended.length * 70 + 220}>
              <div className="mt-12 flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-[#00A5A8]" />
                <span className="h-px w-16 bg-white/15" />
                <span className="text-[10px] uppercase tracking-[0.3em] text-cream/35">
                  Abuja · Nigeria
                </span>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </main>
  );
}