import Link from "next/link";
import { participationCategories } from "@/lib/content";

const categorySlugs: Record<string, string> = {
  Exhibitor: "exhibitor",
  Speaker: "speaker",
  Press: "press",
  "Pitching Participant": "pitcher",
};

export default function RegisterPage() {
  const visitor = participationCategories.find((c) => c.name === "Visitor")!;
  const applicationCategories = participationCategories.filter((c) => c.name !== "Visitor");

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

      {/* Visitor — standalone, prominent */}
      <div className="mt-14">
        <p className="text-sm text-teal">Just want to attend?</p>
        <div className="mt-4 rounded-2xl border border-teal/30 bg-ink-raised px-8 py-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-md">
              <p className="font-display text-2xl text-cream">{visitor.name}</p>
              <p className="mt-3 text-muted">{visitor.blurb}</p>
              <p className="mt-3 text-xs text-teal">{visitor.note}</p>
            </div>

            <div className="flex flex-col items-center gap-2 sm:min-w-[220px]">
              <Link
                href="/register/visitor"
                className="w-full rounded-full bg-teal px-5 py-3 text-center text-sm font-medium text-ink transition-transform hover:scale-105"
              >
                Continue
              </Link>
              <p className="text-xs text-muted">New or returning</p>
            </div>
          </div>
        </div>
      </div>

      {/* Application-based categories — grouped */}
      <div className="mt-16">
        <p className="text-sm text-gold">Want a bigger role?</p>
        <p className="mt-1 text-sm text-muted">
          These categories are curated. Applying does not guarantee a spot.
        </p>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
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
      </div>
    </main>
  );
}