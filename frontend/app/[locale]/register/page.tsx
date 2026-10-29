import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Register.meta" });
  return { title: t("title"), description: t("description") };
}



/* ---------- Passes ---------- */
// The pass is chosen here, then carried to the attendee flow as ?ticket=<slug>.
// slug values match the stored ticket types: general, vip, masterclass, vvip.
const ATTENDEE_HREF = "/register/attendee";

// Names, notes and button text are translated: see messages/*.json (Register.passes).
const passes: { slug: string; price: string | null }[] = [
  { slug: "general", price: null },
  { slug: "vip", price: "₦20,000" },
  { slug: "masterclass", price: "₦50,000" },
  { slug: "vvip", price: "₦150,000" },
];

// true = included, false = not included, string = shown as text
// Row labels are translated: see messages/*.json (Register.rows).
const rows: { key: string; values: (boolean | string)[] }[] = [
  { key: "r1", values: [true, true, true, true] },
  { key: "r2", values: [true, true, true, true] },
  { key: "r3", values: [true, true, true, true] },
  { key: "r4", values: [true, true, true, true] },
  { key: "r5", values: ["General", "Priority", "General", "Front, reserved"] },
  { key: "r6", values: [false, false, false, true] },
  { key: "r7", values: [false, false, false, true] },
  { key: "r8", values: [false, false, true, true] },
  { key: "r9", values: [false, false, false, true] },
];

// Maps the seating values above to their translation keys.
const SEAT: Record<string, string> = {
  General: "general",
  Priority: "priority",
  "Front, reserved": "front",
};

/* ---------- Take part ---------- */
type Card = { id: string; ns: "cards" | "calls"; price?: string; href?: string };

// Names, descriptions and button text are translated: see messages/*.json (Register.cards).
const takePart: Card[] = [
  { id: "boothNormal", ns: "cards", price: "₦200,000", href: "/register/exhibitor?type=booth&size=small" },
  { id: "boothDouble", ns: "cards", price: "₦300,000", href: "/register/exhibitor?type=booth&size=big" },
  { id: "runway", ns: "cards", price: "₦300,000", href: "/register/exhibitor?type=fashion_runway" },
  { id: "pitcher", ns: "cards", price: "₦100,000", href: "/register/pitcher" },
  { id: "investor", ns: "cards", price: "Free", href: "/register/investor" },
  { id: "press", ns: "cards", price: "Free", href: "/register/press" },
];

/* ---------- Call for Creatives ---------- */
// A card with no href shows as "Opening soon". External links open in a new tab.
const CREATIVES_FORM_HREF =
  "https://docs.google.com/forms/d/e/1FAIpQLScRIwzwA-551I-C_rLLvZQLwIojNowkJzQZ8fSQW1GeKOhG6Q/viewform?usp=dialog";
const FILM_HREF = "https://filmfreeway.com/ACS2026";

// Names, descriptions and button text are translated: see messages/*.json (Register.calls).
const calls: Card[] = [
  { id: "music", ns: "calls", href: CREATIVES_FORM_HREF },
  { id: "fashion", ns: "calls", href: CREATIVES_FORM_HREF },
  { id: "visual", ns: "calls", href: CREATIVES_FORM_HREF },
  { id: "film", ns: "calls", href: FILM_HREF },
];

const btn =
  "inline-block rounded-full bg-gold px-5 py-3 text-center text-sm font-medium text-ink transition-transform hover:scale-105";
const btnOff =
  "inline-block cursor-not-allowed rounded-full bg-white/15 px-5 py-3 text-center text-sm font-medium text-cream";

function CardView({ c }: { c: Card }) {
  const t = useTranslations("Register");
  const isExternal = c.href?.startsWith("http");

  return (
    <div className="flex flex-col rounded-2xl border border-white/10 bg-ink-raised px-6 py-7">
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-display text-lg text-cream">{t(`${c.ns}.${c.id}.name`)}</p>
        {c.price && <span className="text-sm font-medium text-gold">{c.price === "Free" ? t("free") : c.price}</span>}
      </div>
      <p className="mt-3 flex-1 text-sm text-muted">{t(`${c.ns}.${c.id}.text`)}</p>
      <div className="mt-6">
        {c.href ? (
          isExternal ? (
            <a
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              className={btn}
            >
              {t(`${c.ns}.${c.id}.cta`)}
              <span className="sr-only"> {t("opensNewTab")}</span>
            </a>
          ) : (
            <Link href={c.href} className={btn}>
              {t(`${c.ns}.${c.id}.cta`)}
            </Link>
          )
        ) : (
          <span className={btnOff} aria-disabled="true">
            {t("openingSoon")}
          </span>
        )}
      </div>
    </div>
  );
}

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Register");

  return (
    <main className="mx-auto max-w-5xl px-6 pt-10 pb-20 md:pt-14 md:pb-28">
      <div className="tricolor-rule mb-6">
        <span />
        <span />
        <span />
      </div>
      <h1 className="font-display text-3xl text-cream sm:text-4xl md:max-w-3xl">
        {t("title")}
      </h1>
      <p className="mt-3 max-w-2xl text-muted">
        {t("intro")}
      </p>
      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <span className="rounded-full border border-white/10 bg-ink-raised px-4 py-2 text-cream">
          {t("dates")}
        </span>
        <span className="rounded-full border border-white/10 bg-ink-raised px-4 py-2 text-cream">
          {t("venue")}
        </span>
        <span className="rounded-full bg-gold px-4 py-2 font-medium text-ink">{t("freeEntry")}</span>
      </div>

      {/* Passes */}
      <section id="passes" className="mt-16">
        <h2 className="font-display text-2xl text-cream sm:text-3xl">{t("passesHeading")}</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          {t("passesIntro")}
        </p>

        {/* Mobile: one card per pass, no sideways scrolling */}
        <div className="mt-8 grid gap-5 md:hidden">
          {passes.map((p, pi) => (
            <div
              key={p.slug}
              className="rounded-2xl border border-white/10 bg-ink-raised px-5 py-6"
            >
              <div className="flex items-baseline justify-between gap-4">
                <div>
                  <p className="font-display text-xl text-cream">{t(`passes.${p.slug}.name`)}</p>
                  <p className="text-xs text-muted">{t(`passes.${p.slug}.note`)}</p>
                </div>
                <p className="text-xl font-semibold text-gold">{p.price ?? t("free")}</p>
              </div>

              <ul className="mt-5 divide-y divide-white/5 text-sm">
                {rows.map((r) => {
                  const v = r.values[pi];
                  return (
                    <li
                      key={r.key}
                      className="flex items-start justify-between gap-4 py-2.5"
                    >
                      <span className={v === false ? "text-muted" : "text-cream"}>
                        {t(`rows.${r.key}`)}
                      </span>
                      <span className="shrink-0 text-right">
                        {v === true ? (
                          <>
                            <span aria-hidden="true" className="font-semibold text-gold">
                              ✓
                            </span>
                            <span className="sr-only">{t("included")}</span>
                          </>
                        ) : v === false ? (
                          <>
                            <span aria-hidden="true" className="text-muted">
                              –
                            </span>
                            <span className="sr-only">{t("notIncluded")}</span>
                          </>
                        ) : (
                          <span className="text-cream">{t(`seat.${SEAT[v as string]}`)}</span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <Link
                href={`${ATTENDEE_HREF}?ticket=${p.slug}`}
                className={`${btn} mt-6 block w-full`}
              >
                {t(`passes.${p.slug}.cta`)}
              </Link>
            </div>
          ))}
        </div>

        {/* Tablet and desktop: comparison table */}
        <div className="mt-8 hidden overflow-x-auto rounded-2xl border border-white/10 bg-ink-raised md:block">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <caption className="sr-only">{t("comparison")}</caption>
            <thead>
              <tr>
                <td className="p-4">
                  <span className="sr-only">{t("benefit")}</span>
                </td>
                {passes.map((p) => (
                  <th key={p.slug} scope="col" className="border-b border-white/10 p-5 align-top">
                    <span className="block font-display text-lg text-cream">{t(`passes.${p.slug}.name`)}</span>
                    <span className="mt-1 block text-xl font-semibold text-gold">{p.price ?? t("free")}</span>
                    <span className="mb-4 block text-xs font-normal text-muted">{t(`passes.${p.slug}.note`)}</span>
                    <Link href={`${ATTENDEE_HREF}?ticket=${p.slug}`} className={btn}>
                      {t(`passes.${p.slug}.cta`)}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key}>
                  <th
                    scope="row"
                    className="border-b border-white/5 p-4 text-left font-medium text-cream"
                  >
                    {t(`rows.${r.key}`)}
                  </th>
                  {r.values.map((v, i) => (
                    <td key={passes[i].slug} className="border-b border-white/5 p-4 text-center">
                      {v === true ? (
                        <>
                          <span aria-hidden="true" className="text-lg font-semibold text-gold">
                            ✓
                          </span>
                          <span className="sr-only">{t("included")}</span>
                        </>
                      ) : v === false ? (
                        <>
                          <span aria-hidden="true" className="text-muted">
                            –
                          </span>
                          <span className="sr-only">{t("notIncluded")}</span>
                        </>
                      ) : (
                        <span className="text-cream">{t(`seat.${SEAT[v as string]}`)}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 max-w-3xl text-xs text-muted">
          {t("seatingNote")}
        </p>
      </section>

      {/* Take part */}
      <section id="take-part" className="mt-20">
        <h2 className="font-display text-2xl text-cream sm:text-3xl">{t("takePartHeading")}</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          {t("takePartIntro")}
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {takePart.map((c) => (
            <CardView key={c.id} c={c} />
          ))}
        </div>
      </section>

      {/* Call for Creatives */}
      <section id="call" className="mt-20">
        <h2 className="font-display text-2xl text-cream sm:text-3xl">
          {t("callHeading")}{" "}
          <span className="ml-2 inline-block rounded-full bg-red-700 px-3 py-1 align-middle font-sans text-xs font-medium text-white">
            {t("deadline")}
          </span>
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          {t("callIntro")}
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {calls.map((c) => (
            <CardView key={c.id} c={c} />
          ))}
        </div>
      </section>

      <div className="mt-12 text-center">
        <Link
          href="/register/lookup"
          className="text-sm text-muted underline underline-offset-4 hover:text-cream"
        >
          {t("lookup")}
        </Link>
      </div>
    </main>
  );
}
