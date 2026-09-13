import Link from "next/link";
import { Ticket, Store, Newspaper, Presentation, Handshake } from "lucide-react";
import { participationCategories } from "@/lib/content";

const categoryIcons = {
  attendee: Ticket,
  exhibitor: Store,
  press: Newspaper,
  pitcher: Presentation,
  investor: Handshake,
} as const;

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
        {participationCategories.map((category) => {
          const Icon = categoryIcons[category.slug as keyof typeof categoryIcons];

          return (
            <div
              key={category.name}
              className="flex flex-col rounded-2xl border border-white/10 bg-ink-raised px-6 py-8"
            >
              {Icon && <Icon className="h-8 w-8 text-gold" strokeWidth={1.5} />}
              <p className="mt-4 font-display text-lg text-cream">{category.name}</p>
              <p className="mt-3 flex-1 text-sm text-muted">{category.blurb}</p>
              {category.note && (
                <p className="mt-3 text-xs text-gold">{category.note}</p>
              )}

              <Link
                href={`/register/${category.slug}`}
                className="mt-6 rounded-full bg-gold px-5 py-3 text-center text-sm font-medium text-ink transition-transform hover:scale-105"
              >
                Continue
              </Link>
            </div>
          );
        })}
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