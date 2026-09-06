import Link from "next/link";
import { participationCategories } from "@/lib/content";

export default function ParticipationSection() {
  const visitor = participationCategories.find((c) => c.name === "Visitor")!;
  const applicationCategories = participationCategories.filter((c) => c.name !== "Visitor");

  return (
    <section id="participate" className="border-b border-white/10 bg-ink-raised">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="tricolor-rule mb-6">
          <span /><span /><span />
        </div>
        <h2 className="font-display text-3xl text-cream sm:text-4xl">
          Choose how you join ACS
        </h2>

        {/* Visitor — standalone, prominent */}
        <div className="mt-14">
          <p className="text-sm text-teal">Just want to attend?</p>
          <div className="mt-4 flex flex-col items-start justify-between gap-6 rounded-2xl border border-teal/30 bg-ink px-8 py-8 sm:flex-row sm:items-center">
            <div>
              <p className="font-display text-xl text-cream">{visitor.name}</p>
              <p className="mt-2 text-sm text-muted">{visitor.blurb}</p>
              <p className="mt-3 text-xs text-teal">{visitor.note}</p>
            </div>

            <div className="flex shrink-0 flex-col items-center gap-2">
              <Link
                href="/register/visitor"
                className="rounded-full bg-teal px-6 py-3 text-sm font-medium text-ink transition-transform hover:scale-105"
              >
                Continue
              </Link>
              <p className="text-xs text-muted">New or returning</p>
            </div>
          </div>
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-muted">
            Registering as a Visitor is simple — pick a General or VIP ticket, add a Masterclass Pass
            if you&apos;d like one, and you&apos;re set to attend the full two-day Showcase.
          </p>
        </div>

        {/* Divider between the two sections */}
        <div className="mx-auto mt-16 max-w-xs border-t border-white/10" />

        {/* Application-based categories — grouped in one shared block */}
        <div className="mt-16">
          <div className="rounded-2xl border border-gold/30 bg-ink px-8 py-8">
            <p className="text-sm text-gold">Want a bigger role?</p>
            <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {applicationCategories.map((category) => (
                <div
                  key={category.name}
                  className="flex flex-col rounded-2xl border border-white/10 bg-ink-raised px-6 py-8"
                >
                  <p className="font-display text-lg text-cream">{category.name}</p>
                  <p className="mt-3 flex-1 text-sm text-muted">{category.blurb}</p>
                  <p className="mt-4 text-xs text-gold">{category.note}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col items-center gap-2">
              <Link
                href="/register/apply"
                className="inline-block rounded-full bg-gold px-7 py-3.5 text-sm font-medium text-ink transition-transform hover:scale-105"
              >
                Continue
              </Link>
              <p className="text-xs text-muted">New user or tracking your status</p>
            </div>
          </div>

          <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-muted">
            These categories are curated. Applying takes a few minutes. Spots are limited.
          </p>
        </div>

        {/* Direct lookup shortcut */}
        <div className="mt-10 text-center">
          <Link
            href="/register/lookup"
            className="text-sm text-muted underline underline-offset-4 hover:text-cream"
          >
            Already applied? Check your status
          </Link>
        </div>
      </div>
    </section>
  );
}