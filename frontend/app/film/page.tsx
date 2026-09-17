import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Film Industry Events & Networking",
  description:
    "Afriqa Creative Showcase 2026 brings filmmakers together for screenings, industry networking, and direct access to distributors and funders — through the Screening Room and Creative Finance track.",
  keywords: [
    "film events Abuja",
    "filmmaking events Abuja",
    "film industry events Abuja",
    "film networking Abuja",
    "filmmakers networking Abuja",
    "film screening Abuja",
    "Nigerian film events",
    "film events Nigeria",
  ],
  alternates: {
    canonical: "/film",
  },
};

const filmPillars = [
  {
    title: "Screening Room",
    description:
      "A dedicated space showing short films, features, and documentaries from Nigerian and African filmmakers throughout the two days.",
  },
  {
    title: "Film Industry Networking",
    description:
      "Structured time built for filmmakers to connect directly with producers, distributors, and other creatives working across Nigeria's film industry.",
  },
  {
    title: "Funding & Distribution Access",
    description:
      "Filmmakers looking for production capital or distribution deals can connect with the Creative Finance Forum and Pitch & Deal Room running alongside the film programme.",
  },
];

const whoShouldAttend = [
  "Filmmakers with a short, feature, or documentary to screen or discuss",
  "Producers and directors looking for funding or distribution partners",
  "Actors, crew, and film students building industry connections",
  "Distributors and commissioners scouting Nigerian film talent",
];

export default function FilmPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-20 md:py-28">
      <div className="tricolor-rule mb-6">
        <span />
        <span />
        <span />
      </div>

      <h1 className="font-display text-3xl text-cream sm:text-4xl">
        Film at Afriqa Creative Showcase
      </h1>

      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
        ACS isn&apos;t a film festival — it&apos;s where film sits alongside
        music, fashion, and tech as part of a wider creative industry event.
        For filmmakers, that means screenings and networking without competing
        only against other films for attention, plus direct access to the
        finance and investment track happening in the same space.
      </p>

      <div className="mt-14 grid gap-6 sm:grid-cols-3">
        {filmPillars.map((pillar) => (
          <div
            key={pillar.title}
            className="flex flex-col rounded-2xl border border-white/10 bg-ink-raised px-6 py-8"
          >
            <p className="font-display text-lg text-cream">
              {pillar.title}
            </p>

            <p className="mt-3 text-sm leading-relaxed text-muted">
              {pillar.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-16">
        <h2 className="font-display text-2xl text-cream">
          Who this is for
        </h2>

        <ul className="mt-6 space-y-3">
          {whoShouldAttend.map((item) => (
            <li
              key={item}
              className="flex items-start gap-3 text-muted"
            >
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-16 rounded-2xl border border-teal/20 bg-ink-raised px-8 py-10 text-center">
        <p className="font-display text-xl text-cream">
          Want to screen your work or connect with the film industry at ACS?
        </p>

        <p className="mt-3 text-muted">
          Register to attend, or explore the finance track if you&apos;re
          seeking funding.
        </p>

        <div className="mt-6 flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href="/register"
            className="rounded-full bg-teal px-7 py-3.5 text-sm font-medium text-ink transition-transform hover:scale-105"
          >
            Register Now
          </Link>

          <Link
            href="/creative-finance"
            className="rounded-full bg-gold px-7 py-3.5 text-sm font-medium text-ink transition-transform hover:scale-105"
          >
            Explore Funding & Investment
          </Link>
        </div>
      </div>
    </main>
  );
}