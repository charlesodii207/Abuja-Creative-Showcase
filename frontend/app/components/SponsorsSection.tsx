import Link from "next/link";
import Reveal from "./Reveal";

export default function SponsorsSection() {
  return (
    <section id="sponsors" className="border-b border-white/10">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <Reveal>
          <div className="tricolor-rule mb-6">
            <span />
            <span />
            <span />
          </div>
        </Reveal>

        <Reveal delay={80}>
          <h2 className="font-display text-3xl text-cream sm:text-4xl">
            Partners & sponsors
          </h2>
        </Reveal>

        <Reveal delay={160} distance={24}>
          <p className="mt-3 max-w-3xl text-lg leading-relaxed text-muted">
            ACS is built as a partnership platform across government, private
            sector, and development organizations. From naming rights to sector
            sponsorships, we offer tiers designed for organizations of every
            scale — with benefits spanning brand visibility, activations, and
            thought-leadership opportunities across the two-day Showcase.
          </p>
        </Reveal>

        <Reveal delay={280} distance={20}>
          <Link
            href="/sponsorship"
            className="mt-10 inline-flex items-center rounded-full bg-gold px-8 py-4 text-sm font-medium text-ink transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(229,146,0,0.18)]"
          >
            View Partnership Packages
          </Link>
        </Reveal>
      </div>
    </section>
  );
}