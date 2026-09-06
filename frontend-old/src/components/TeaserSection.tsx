const placeholders = Array.from({ length: 6 });

export default function TeaserSection() {
  return (
    <section className="border-b border-white/10 bg-ink-raised">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="tricolor-rule mb-6">
          <span /><span /><span />
        </div>
        <h2 className="font-display text-3xl text-cream sm:text-4xl">
          Speakers & exhibitors
        </h2>
        <p className="mt-3 max-w-xl text-muted">
          Lineup announcements are coming as confirmations land. Check back
          here for updates.
        </p>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
          {placeholders.map((_, i) => (
            <div
              key={i}
              className="flex aspect-square items-center justify-center rounded-2xl border border-dashed border-white/15 text-center text-xs text-muted"
            >
              Coming soon
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
