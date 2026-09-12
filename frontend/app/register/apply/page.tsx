import Link from "next/link";
import { participationCategories } from "@/lib/content";

const PAY_TO_CONFIRM = ["Exhibitor", "Pitching Participant"];
const APPLY_AND_REVIEW = ["Press", "Investor"];

export default function ApplyPage() {
  const payToConfirmCategories = participationCategories.filter((c) =>
    PAY_TO_CONFIRM.includes(c.name)
  );
  const applyCategories = participationCategories.filter((c) =>
    APPLY_AND_REVIEW.includes(c.name)
  );

  return (
    <main className="mx-auto max-w-4xl px-6 py-20 md:py-28">
      <div className="tricolor-rule mb-6">
        <span /><span /><span />
      </div>
      <h1 className="font-display text-3xl text-cream sm:text-4xl">
        Take Part in ACS
      </h1>
      <p className="mt-3 max-w-xl text-muted">
        Choose how you&apos;d like to be involved — some spots are secured by payment,
        others go through a short review.
      </p>

      {/* Pay-to-confirm categories */}
      <div className="mt-14">
        <h2 className="font-display text-lg text-cream">Register &amp; Pay</h2>
        <p className="mt-1 text-sm text-muted">
          Fill in your details, pay, and you&apos;re confirmed — no waiting on approval.
        </p>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {payToConfirmCategories.map((category) => (
            <div
              key={category.name}
              className="flex flex-col rounded-2xl border border-white/10 bg-ink-raised px-6 py-8"
            >
              <p className="font-display text-xl text-cream">{category.name}</p>
              <p className="mt-3 flex-1 text-sm text-muted">{category.blurb}</p>
              <p className="mt-3 text-xs text-gold">{category.note}</p>

              <Link
                href={`/register/${category.slug}`}
                className="mt-6 rounded-full bg-red px-5 py-3 text-center text-sm font-medium text-cream transition-transform hover:scale-105"
              >
                Continue
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Apply-and-review categories */}
      <div className="mt-14">
        <h2 className="font-display text-lg text-cream">Apply</h2>
        <p className="mt-1 text-sm text-muted">
          These categories are curated. Applying does not guarantee a spot.
        </p>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {applyCategories.map((category) => (
            <div
              key={category.name}
              className="flex flex-col rounded-2xl border border-white/10 bg-ink-raised px-6 py-8"
            >
              <p className="font-display text-xl text-cream">{category.name}</p>
              <p className="mt-3 flex-1 text-sm text-muted">{category.blurb}</p>
              <p className="mt-3 text-xs text-gold">{category.note}</p>

              <Link
                href={`/register/${category.slug}`}
                className="mt-6 rounded-full bg-red px-5 py-3 text-center text-sm font-medium text-cream transition-transform hover:scale-105"
              >
                Continue
              </Link>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-14 rounded-2xl border border-teal/20 bg-ink-raised px-6 py-6 text-center">
        <p className="text-sm text-muted">
          Just want to attend rather than take part as above?{" "}
          <Link href="/register/attendee" className="text-teal underline underline-offset-4">
            Register as an Attendee instead
          </Link>
        </p>
      </div>
    </main>
  );
}
