import type { Metadata } from "next";
import { aboutExtended } from "@/lib/content";

export const metadata: Metadata = {
  title: "About the Event",
  description:
    "Learn about Abuja Creative Showcase 2026 — a two-day creative industry platform at the Old Parade Ground, Abuja, connecting film, music, fashion, art, and tech talent with markets, capital, and opportunity.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20 md:py-28">
      <div className="tricolor-rule mb-6">
        <span /><span /><span />
      </div>
      <h1 className="font-display text-3xl text-cream sm:text-4xl">
        About Abuja Creative Showcase
      </h1>

      <div className="mt-10 space-y-6 text-lg leading-relaxed text-muted">
        {aboutExtended.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>
    </main>
  );
}