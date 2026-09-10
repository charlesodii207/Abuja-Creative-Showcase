import Link from "next/link";
import { participationCategories } from "@/lib/content";

export default function RegisterPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-20 md:py-28">
      <div className="tricolor-rule mb-6">
        <span /><span /><span />
      </div>
      <h1 className="font-display text-3xl text-cream sm:text-4xl">
        Register for ACS
      </h1>
      <p className="mt-3 max-w-xl text-muted">
        Choose the path that fits you.
      </p>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {participationCategories.map((category) => (
          <div
            key={category.name}
            className={`flex flex-col rounded-2xl border px-6 py-8 ${
              category.guaranteed ? "border-teal/30 bg-ink-raised" : "border-white/10 bg-ink-raised"
            }`}
          >
            <p className="font-display text-lg text-cream">{category.name}</p>
            <p className="mt-3 flex-1 text-sm text-muted">{category.blurb}</p>
            <p className={`mt-3 text-xs ${category.guaranteed ? "text-teal" : "text-gold"}`}>
              {category.note}
            </p>

            <Link
              href={`/register/${category.slug}`}
              className={`mt-6 rounded-full px-5 py-3 text-center text-sm font-medium transition-transform hover:scale-105 ${
                category.guaranteed ? "bg-teal text-ink" : "bg-gold text-ink"
              }`}
            >
              Continue
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Link
          href="/register/lookup"
          className="text-sm text-muted underline underline-offset-4 hover:text-cream"
        >
          Already registered? Check your status
        </Link>
      </div>
    </main>
  );
}