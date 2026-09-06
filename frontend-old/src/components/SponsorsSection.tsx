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
          sector, and development organizations. Sponsor logos will appear
          here as partnerships are confirmed.
        </p>

        <div className="mt-12 rounded-2xl border border-white/10 bg-ink-raised px-8 py-14 text-center">
          <p className="text-muted">
            Interested in partnering with Abuja Creative Showcase?{" "}
            <a href="mailto:partnerships@abujacreativeshowcase.com" className="text-teal underline underline-offset-4">
              Get in touch
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
