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

        <div className="mt-10 grid gap-10 md:grid-cols-[1.3fr_0.7fr] md:items-end">
          <Reveal delay={160}>
            <p className="max-w-2xl text-lg leading-relaxed text-muted">
              ACS is built as a partnership platform across government,
              private sector, and development organizations. From naming
              rights to sector sponsorships, we offer tiers designed for
              organizations of every scale — with benefits spanning brand
              visibility, activations, and thought-leadership opportunities
              across the two-day Showcase.
            </p>
          </Reveal>

          <Reveal delay={260} distance={22}>
            <div className="group rounded-2xl border border-gold/20 bg-ink-raised p-7 transition-all duration-500 hover:-translate-y-1 hover:border-gold/40">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.2em] text-gold">
                  Partnership
                </span>

                <span className="text-lg text-gold transition-transform duration-500 group-hover:translate-x-1">
                  →
                </span>
              </div>

              <p className="mt-5 font-display text-xl text-cream">
                Put your brand inside the ecosystem.
              </p>

              <p className="mt-2 text-sm leading-relaxed text-muted">
                Explore partnership opportunities and find a package that
                fits your organization.
              </p>

              <Link
                href="/sponsorship"
                className="mt-6 inline-flex items-center rounded-full bg-gold px-7 py-3.5 text-sm font-medium text-ink transition-all duration-300 hover:-translate-y-0.5"
              >
                View Partnership Packages
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}