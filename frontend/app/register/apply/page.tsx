import Link from "next/link";
import { participationCategories } from "@/lib/content";

const categorySlugs: Record<string, string> = {
  Exhibitor: "exhibitor",
  Speaker: "speaker",
  Press: "press",
  "Pitching Participant": "pitcher",
};

export default function ApplyPage() {
  const applicationCategories = participationCategories.filter((c) => c.name !== "Visitor");

  return (
    <main className="mx-auto max-w-4xl px-6 py-20 md:py-28">
      <div className="tricolor-rule mb-6">
        <span /><span /><span />
      </div>
      <h1 className="font-display text-3xl text-cream sm:text-4xl">
        Apply to Take Part
      </h1>
      <p className="mt-3 max-w-xl text-muted">
        These categories are curated. Applying does not guarantee a spot.
      </p>

      <div className="mt-14 grid gap-6 sm:grid-cols-2">
        {applicationCategories.map((category) => {
          const slug = categorySlugs[category.name];
          return (
            <div
              key={category.name}
              className="flex flex-col rounded-2xl border border-white/10 bg-ink-raised px-6 py-8"
            >
              <p className="font-display text-xl text-cream">{category.name}</p>
              <p className="mt-3 flex-1 text-sm text-muted">{category.blurb}</p>
              <p className="mt-3 text-xs text-gold">{category.note}</p>

              <Link
                href={`/register/${slug}`}
                className="mt-6 rounded-full bg-red px-5 py-3 text-center text-sm font-medium text-cream transition-transform hover:scale-105"
              >
                Continue
              </Link>
            </div>
          );
        })}
      </div>

      <div className="mt-14 rounded-2xl border border-teal/20 bg-ink-raised px-6 py-6 text-center">
        <p className="text-sm text-muted">
          Just want to attend rather than apply?{" "}
          <Link href="/register/visitor" className="text-teal underline underline-offset-4">
            Register as a Visitor instead
          </Link>
        </p>
      </div>
    </main>
  );
}