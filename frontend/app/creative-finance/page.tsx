import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Creative Finance, Investment & Pitching",
  description:
    "Abuja Creative Showcase 2026's Creative Finance Forum connects filmmakers, musicians, fashion brands, and creative entrepreneurs with investors, funders, and distributors through a dedicated Pitch & Deal Room.",
  keywords: [
    "creative industry funding Nigeria",
    "creative industry investors Nigeria",
    "creative investment Nigeria",
    "creative business opportunities Nigeria",
    "film funding Nigeria",
    "creative industry networking Nigeria",
    "pitching events Abuja",
    "investor events Abuja",
  ],
  alternates: {
    canonical: "/creative-finance",
  },
};

const forumPillars = [
  {
    title: "Creative Finance Forum",
    description:
      "Panel sessions and conversations on how film, music, fashion, and creative-tech projects in Nigeria access capital — from grants and equity to co-production financing.",
  },
  {
    title: "Pitch & Deal Room",
    description:
      "A structured space where selected creative entrepreneurs pitch projects directly to investors, brands, and distributors in short, focused sessions.",
  },
  {
    title: "International Opportunities Hub",
    description:
      "Information and direct access to international funders, festivals, markets, and commissioning bodies actively looking for African creative talent.",
  },
];

const whoShouldAttend = [
  "Filmmakers seeking production or distribution funding",
  "Musicians and labels exploring investment or brand partnerships",
  "Fashion entrepreneurs looking to scale with outside capital",
  "Investors and funders scouting Nigerian creative-industry opportunities",
  "Brands and commissioners looking to partner with creative talent",
];

export default function CreativeFinancePage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-20 md:py-28">
      <div className="tricolor-rule mb-6">
        <span /><span /><span />
      </div>

      <h1 className="font-display text-3xl text-cream sm:text-4xl">
        Creative Finance, Investment & Pitching
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
        Abuja Creative Showcase 2026 isn&apos;t only a showcase of creative work — it&apos;s
        where that work meets capital. A dedicated finance and investment track runs
        alongside the main event, built for creatives who need funding and investors
        looking for Nigeria&apos;s next opportunity.
      </p>

      <div className="mt-14 grid gap-6 sm:grid-cols-3">
        {forumPillars.map((pillar) => (
          <div
            key={pillar.title}
            className="flex flex-col rounded-2xl border border-white/10 bg-ink-raised px-6 py-8"
          >
            <p className="font-display text-lg text-cream">{pillar.title}</p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {pillar.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-16">
        <h2 className="font-display text-2xl text-cream">Who this is for</h2>
        <ul className="mt-6 space-y-3">
          {whoShouldAttend.map((item) => (
            <li key={item} className="flex items-start gap-3 text-muted">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-16 rounded-2xl border border-teal/20 bg-ink-raised px-8 py-10 text-center">
        <p className="font-display text-xl text-cream">
          Want to pitch, invest, or partner at ACS 2026?
        </p>
        <p className="mt-3 text-muted">
          Reach out and we&apos;ll point you to the right track.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href="/register"
            className="rounded-full bg-teal px-7 py-3.5 text-sm font-medium text-ink transition-transform hover:scale-105"
          >
            Register Your Interest
          </Link>
          <Link
            href="/sponsorship"
            className="rounded-full bg-gold px-7 py-3.5 text-sm font-medium text-ink transition-transform hover:scale-105"
          >
            View Partnership Packages
          </Link>
        </div>
      </div>
    </main>
  );
}