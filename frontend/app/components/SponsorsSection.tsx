import Link from "next/link";

export default function SponsorsSection() {
  return (
    <section id="sponsors" className="border-b border-white/10">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="tricolor-rule mb-6">
          <span /><span /><span />
        </div>
        <h2 className="font-display text-3xl text-cream sm:text-4xl">
          Partners & sponsors
        </h2>
        <p className="mt-3 max-w-xl text-muted">
          ACS is built as a partnership platform across government, private
          sector, and development organizations. From naming rights to
          sector sponsorships, we offer tiers designed for organizations of
          every scale — with benefits spanning brand visibility, activations,
          and thought-leadership opportunities across the two-day Showcase.
        </p>

        <div className="mt-10">
          <Link
            href="/sponsorship"
            className="inline-block rounded-full bg-gold px-7 py-3.5 text-sm font-medium text-ink transition-transform hover:scale-105"
          >
            View Partnership Packages
          </Link>
        </div>
      </div>
    </section>
  );
}