import type { Metadata } from "next";
import { sponsorshipTiers } from "@/lib/content";

export const metadata: Metadata = {
  title: "Sponsorship & Partnership Packages",
  description:
    "Partner with Abuja Creative Showcase 2026. Six sponsorship tiers, from Bronze to Title Partner, connecting your brand with Abuja's creative industry.",
  alternates: {
    canonical: "/sponsorship",
  },
};

type TierVisual = { icon: (color: string) => React.ReactNode; color: string; benefitsCount: number };

function GemIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 48 48" className="h-10 w-10">
      <path d="M12 16 L24 8 L36 16 L24 42 Z" fill={color} opacity="0.9" />
      <path d="M12 16 L24 8 L18 16 Z" fill="white" opacity="0.25" />
      <path d="M12 16 L24 42 L18 16 Z" fill="black" opacity="0.15" />
      <path d="M36 16 L24 42 L30 16 Z" fill="black" opacity="0.25" />
    </svg>
  );
}

function StarIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 48 48" className="h-10 w-10">
      <path d="M24 6 L29 19 L43 19 L32 28 L36 42 L24 34 L12 42 L16 28 L5 19 L19 19 Z" fill={color} />
    </svg>
  );
}

function CrownIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 48 48" className="h-10 w-10">
      <path d="M6 36 L10 16 L18 26 L24 12 L30 26 L38 16 L42 36 Z" fill={color} />
      <rect x="6" y="36" width="36" height="5" fill={color} />
    </svg>
  );
}

const tierVisuals: Record<string, TierVisual> = {
  "Bronze Sponsor": { icon: (c) => <GemIcon color={c} />, color: "#B08D57", benefitsCount: 2 },
  "Silver Sponsor": { icon: (c) => <GemIcon color={c} />, color: "#C7CDD6", benefitsCount: 2 },
  "Gold Partner": { icon: (c) => <GemIcon color={c} />, color: "#e59200", benefitsCount: 3 },
  "Platinum Partner": { icon: (c) => <GemIcon color={c} />, color: "#E5E4E2", benefitsCount: 3 },
  "Presenting Partner": { icon: (c) => <StarIcon color={c} />, color: "#00a5a8", benefitsCount: 4 },
  "Title Partner": { icon: (c) => <CrownIcon color={c} />, color: "#e59200", benefitsCount: 5 },
};

const NAIRA_PER_USD = 1316;

export default function SponsorshipPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-20 md:py-28">
      <div className="tricolor-rule mb-6">
        <span /><span /><span />
      </div>
      <h1 className="font-display text-3xl text-cream sm:text-4xl">
        Partnership Packages
      </h1>
      <p className="mt-3 max-w-xl text-muted">
        Six tiers, from Bronze to Title Partner. Reach out and we&apos;ll walk you through what fits best.
      </p>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sponsorshipTiers
          .slice()
          .reverse()
          .map((tier) => {
            const visual = tierVisuals[tier.name];
            const usdEquivalent = Math.round(tier.amount / NAIRA_PER_USD / 100) * 100;

            return (
              <div
                key={tier.name}
                className="flex flex-col rounded-2xl border border-white/10 bg-ink-raised px-6 py-8 text-center"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center">
                  {visual.icon(visual.color)}
                </div>

                <p className="mt-4 font-display text-xl text-cream">{tier.name}</p>
                <p className="mt-1 text-lg" style={{ color: visual.color }}>
                  {tier.price}
                </p>
                <p className="mt-1 text-xs text-muted">≈ ${usdEquivalent.toLocaleString()} USD</p>

                <div className="mt-6 space-y-3 border-t border-dashed border-white/15 pt-6">
                  {Array.from({ length: visual.benefitsCount }).map((_, i) => (
                    <p key={i} className="text-sm text-muted">
                      Benefits — coming soon
                    </p>
                  ))}
                </div>
              </div>
            );
          })}
      </div>

      <div className="mt-10 rounded-2xl border border-teal/20 bg-ink-raised px-8 py-10 text-center">
        <p className="text-muted">
          Ready to partner with Abuja Creative Showcase?{" "}
          <a href="mailto:partnerships@abujacreativeshowcase.com" className="text-teal underline underline-offset-4">
            Get in touch
          </a>
        </p>
      </div>
    </main>
  );
}