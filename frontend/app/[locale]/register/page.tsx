import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Register for Afriqa Creative Showcase 2026",
  description:
    "Compare every pass, see the prices and register for Afriqa Creative Showcase, 4 and 5 December 2026, Abuja.",
};

const CALL_DEADLINE = "15 November 2026";

/* ---------- Passes ---------- */
// The pass is chosen here, then carried to the attendee flow as ?ticket=<slug>.
// slug values match the stored ticket types: general, vip, masterclass, vvip.
const ATTENDEE_HREF = "/register/attendee";

const passes = [
  { slug: "general", name: "General", price: "Free", note: "Both days", cta: "Get free pass" },
  { slug: "vip", name: "VIP", price: "₦20,000", note: "Status pass", cta: "Get VIP" },
  { slug: "masterclass", name: "Masterclass", price: "₦50,000", note: "Learning pass", cta: "Get Masterclass" },
  { slug: "vvip", name: "VVIP", price: "₦150,000", note: "Everything included", cta: "Get VVIP" },
];

// true = included, false = not included, string = shown as text
const rows: { label: string; values: (boolean | string)[] }[] = [
  { label: "Fashion runway", values: [true, true, true, true] },
  { label: "Film screenings and art exhibitions", values: [true, true, true, true] },
  { label: "Creative Market and networking", values: [true, true, true, true] },
  { label: "Live concert", values: [true, true, true, true] },
  { label: "Seating at runway and concert", values: ["General", "Priority", "General", "Front, reserved"] },
  { label: "Reserved table at concert and dinner", values: [false, false, false, true] },
  { label: "Meet and greet", values: [false, false, false, true] },
  { label: "Masterclasses, both days", values: [false, false, true, true] },
  { label: "Pitch and Deal Room access", values: [false, false, false, true] },
];

/* ---------- Take part ---------- */
type Card = { name: string; price?: string; text: string; cta: string; href?: string };

const takePart: Card[] = [
  {
    name: "Normal Booth",
    price: "₦200,000",
    text: "A branded Creative Market stand across both days. Sell to buyers, brands and the public. Confirmed as soon as you pay.",
    cta: "Book my booth",
    href: "/register/exhibitor?type=booth&size=small",
  },
  {
    name: "Double Booth",
    price: "₦300,000",
    text: "Twice the space, with room to display art. Confirmed as soon as you pay.",
    cta: "Book my booth",
    href: "/register/exhibitor?type=booth&size=big",
  },
  {
    name: "Fashion Runway",
    price: "₦300,000",
    text: "Present your collection at the fashion showcase to an industry audience.",
    cta: "Book my runway slot",
    href: "/register/exhibitor?type=fashion_runway",
  },
  {
    name: "Pitching Participant",
    price: "₦100,000",
    text: "Selected projects pitch to investors, commissioners, distributors and brands in the Deal Room. Selection required.",
    cta: "Apply to pitch",
    href: "/register/pitcher",
  },
  {
    name: "Investor",
    price: "Free",
    text: "Meet curated pitching participants and find creative projects worth backing. Registration reviewed.",
    cta: "Register as investor",
    href: "/register/investor",
  },
  {
    name: "Press",
    price: "Free",
    text: "Interviews, behind-the-scenes access and press briefings. Accreditation required.",
    cta: "Apply for accreditation",
    href: "/register/press",
  },
];

/* ---------- Call for Creatives ---------- */
// A card with no href shows as "Opening soon". External links open in a new tab.
const CREATIVES_FORM_HREF =
  "https://docs.google.com/forms/d/e/1FAIpQLScRIwzwA-551I-C_rLLvZQLwIojNowkJzQZ8fSQW1GeKOhG6Q/viewform?usp=dialog";
const FILM_HREF = "https://filmfreeway.com/ACS2026";

const calls: Card[] = [
  {
    name: "Music and Performing Arts",
    text: "Musicians, singers, performers and DJs.",
    cta: "Apply now",
    href: CREATIVES_FORM_HREF,
  },
  {
    name: "Fashion and Design",
    text: "Fashion designers, brands and textile creatives.",
    cta: "Apply now",
    href: CREATIVES_FORM_HREF,
  },
  {
    name: "Visual Arts and Photography",
    text: "Artists, photographers, illustrators and digital creatives.",
    cta: "Apply now",
    href: CREATIVES_FORM_HREF,
  },
  {
    name: "Film and Screen",
    text: "Filmmakers, directors, producers and screen creatives. Applications run through FilmFreeway.",
    cta: "Apply on FilmFreeway",
    href: FILM_HREF,
  },
];

const btn =
  "inline-block rounded-full bg-gold px-5 py-3 text-center text-sm font-medium text-ink transition-transform hover:scale-105";
const btnOff =
  "inline-block cursor-not-allowed rounded-full bg-white/15 px-5 py-3 text-center text-sm font-medium text-cream";

function CardView({ c }: { c: Card }) {
  const isExternal = c.href?.startsWith("http");

  return (
    <div className="flex flex-col rounded-2xl border border-white/10 bg-ink-raised px-6 py-7">
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-display text-lg text-cream">{c.name}</p>
        {c.price && <span className="text-sm font-medium text-gold">{c.price}</span>}
      </div>
      <p className="mt-3 flex-1 text-sm text-muted">{c.text}</p>
      <div className="mt-6">
        {c.href ? (
          isExternal ? (
            <a
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              className={btn}
            >
              {c.cta}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : (
            <Link href={c.href} className={btn}>
              {c.cta}
            </Link>
          )
        ) : (
          <span className={btnOff} aria-disabled="true">
            Opening soon
          </span>
        )}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 pt-10 pb-20 md:pt-14 md:pb-28">
      <div className="tricolor-rule mb-6">
        <span />
        <span />
        <span />
      </div>
      <h1 className="font-display text-3xl text-cream sm:text-4xl md:max-w-3xl">
        Register for Afriqa Creative Showcase 2026
      </h1>
      <p className="mt-3 max-w-2xl text-muted">
        Two days of fashion, film, music, art, a creative market, industry masterclasses and a Pitch
        and Deal Room. Compare every pass and its price below.
      </p>
      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <span className="rounded-full border border-white/10 bg-ink-raised px-4 py-2 text-cream">
          4 and 5 December 2026
        </span>
        <span className="rounded-full border border-white/10 bg-ink-raised px-4 py-2 text-cream">
          Old Parade Ground, Abuja
        </span>
        <span className="rounded-full bg-gold px-4 py-2 font-medium text-ink">General entry is free</span>
      </div>

      {/* Passes */}
      <section id="passes" className="mt-16">
        <h2 className="font-display text-2xl text-cream sm:text-3xl">Choose your pass</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Status passes decide where you sit at the runway and the concert and dinner. The Masterclass
          Pass is for learning. VVIP combines both.
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
                  <p className="font-display text-xl text-cream">{p.name}</p>
                  <p className="text-xs text-muted">{p.note}</p>
                </div>
                <p className="text-xl font-semibold text-gold">{p.price}</p>
              </div>

              <ul className="mt-5 divide-y divide-white/5 text-sm">
                {rows.map((r) => {
                  const v = r.values[pi];
                  return (
                    <li
                      key={r.label}
                      className="flex items-start justify-between gap-4 py-2.5"
                    >
                      <span className={v === false ? "text-muted" : "text-cream"}>
                        {r.label}
                      </span>
                      <span className="shrink-0 text-right">
                        {v === true ? (
                          <>
                            <span aria-hidden="true" className="font-semibold text-gold">
                              ✓
                            </span>
                            <span className="sr-only">Included</span>
                          </>
                        ) : v === false ? (
                          <>
                            <span aria-hidden="true" className="text-muted">
                              –
                            </span>
                            <span className="sr-only">Not included</span>
                          </>
                        ) : (
                          <span className="text-cream">{v}</span>
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
                {p.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Tablet and desktop: comparison table */}
        <div className="mt-8 hidden overflow-x-auto rounded-2xl border border-white/10 bg-ink-raised md:block">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <caption className="sr-only">Pass comparison</caption>
            <thead>
              <tr>
                <td className="p-4">
                  <span className="sr-only">Benefit</span>
                </td>
                {passes.map((p) => (
                  <th key={p.name} scope="col" className="border-b border-white/10 p-5 align-top">
                    <span className="block font-display text-lg text-cream">{p.name}</span>
                    <span className="mt-1 block text-xl font-semibold text-gold">{p.price}</span>
                    <span className="mb-4 block text-xs font-normal text-muted">{p.note}</span>
                    <Link href={`${ATTENDEE_HREF}?ticket=${p.slug}`} className={btn}>
                      {p.cta}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label}>
                  <th
                    scope="row"
                    className="border-b border-white/5 p-4 text-left font-medium text-cream"
                  >
                    {r.label}
                  </th>
                  {r.values.map((v, i) => (
                    <td key={passes[i].name} className="border-b border-white/5 p-4 text-center">
                      {v === true ? (
                        <>
                          <span aria-hidden="true" className="text-lg font-semibold text-gold">
                            ✓
                          </span>
                          <span className="sr-only">Included</span>
                        </>
                      ) : v === false ? (
                        <>
                          <span aria-hidden="true" className="text-muted">
                            –
                          </span>
                          <span className="sr-only">Not included</span>
                        </>
                      ) : (
                        <span className="text-cream">{v}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 max-w-3xl text-xs text-muted">
          VIP and VVIP seating is limited and given in order: VVIP in the front reserved seats first,
          then VIP, then everyone else. The Masterclass Pass includes general seating.
        </p>
      </section>

      {/* Take part */}
      <section id="take-part" className="mt-20">
        <h2 className="font-display text-2xl text-cream sm:text-3xl">Take part</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          For exhibitors, designers, project owners, investors and the press. Each has its own booking.
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {takePart.map((c) => (
            <CardView key={c.name} c={c} />
          ))}
        </div>
      </section>

      {/* Call for Creatives */}
      <section id="call" className="mt-20">
        <h2 className="font-display text-2xl text-cream sm:text-3xl">
          Call for Creatives{" "}
          <span className="ml-2 inline-block rounded-full bg-red-700 px-3 py-1 align-middle font-sans text-xs font-medium text-white">
            Deadline: {CALL_DEADLINE}
          </span>
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Afriqa Creative Showcase invites Nigerian and African creatives to present their work, connect
          with industry professionals and explore new opportunities.
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {calls.map((c) => (
            <CardView key={c.name} c={c} />
          ))}
        </div>
      </section>

      <div className="mt-12 text-center">
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
