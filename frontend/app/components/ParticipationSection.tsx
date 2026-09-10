import Link from "next/link";
import { participationCategories } from "@/lib/content";
import Reveal from "./Reveal";

export default function ParticipationSection() {
  return (
    <section id="participate" className="border-b border-white/10 bg-ink-raised">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <Reveal>
          <div className="tricolor-rule mb-6">
            <span /><span /><span />
          </div>
        </Reveal>

        <Reveal delay={80}>
          <h2 className="font-display text-3xl text-cream sm:text-4xl">
            Choose how you join ACS
          </h2>
        </Reveal>

        <Reveal delay={140}>
          <p className="mt-3 max-w-xl text-muted">
            Six ways to be part of the Showcase — pick the one that fits you.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {participationCategories.map((category, index) => (
            <Reveal key={category.name} delay={80 + index * 90}>
              <div
                className={`flex h-full flex-col rounded-2xl border px-6 py-8 transition-colors duration-300 ${
                  category.guaranteed
                    ? "border-teal/30 bg-ink hover:border-teal/50"
                    : "border-white/10 bg-ink hover:border-gold/30"
                }`}
              >
                <p className="font-display text-lg text-cream">{category.name}</p>
                <p className="mt-3 flex-1 text-sm text-muted">{category.blurb}</p>
                <p className={`mt-4 text-xs ${category.guaranteed ? "text-teal" : "text-gold"}`}>
                  {category.note}
                </p>

                <Link
                  href={`/register/${category.slug}`}
                  className={`mt-6 rounded-full px-5 py-3 text-center text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 ${
                    category.guaranteed
                      ? "bg-teal text-ink"
                      : "bg-gold text-ink"
                  }`}
                >
                  Continue
                </Link>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={220}>
          <div className="mt-10 text-center">
            <Link
              href="/register/lookup"
              className="text-sm text-muted underline underline-offset-4 transition-colors duration-300 hover:text-cream"
            >
              Already registered? Check your status
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}