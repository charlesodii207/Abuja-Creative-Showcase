import Link from "next/link";

export default function PitcherRegisterPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-20 text-center md:py-28">
      <div className="tricolor-rule mx-auto mb-6">
        <span /><span /><span />
      </div>
      <h1 className="font-display text-3xl text-cream sm:text-4xl">
        Pitching Participant
      </h1>
      <p className="mt-3 text-muted">
        Pitch your project directly to investors, commissioners, brands, and distributors in the Deal Room.
      </p>

      <p className="mx-auto mt-6 max-w-xl text-left text-sm leading-relaxed text-muted">
        The Pitching & Deal Room is one of ACS&apos;s flagship components — a curated session where
        selected creative projects pitch directly to funders, commissioners, distributors, and
        brands. Categories span film, TV series, documentaries, music projects, creative technology,
        fashion brands, publishing, animation, gaming, digital platforms, and social-impact creative
        work. A successful pitch can lead to funding, commissioning, distribution, sponsorship,
        mentorship, or a production deal — real commercial outcomes, not just exposure. You&apos;ll be
        asked for your project name, category, a pitch summary, and a work sample or portfolio
        link. Because this room is small and curated by design, a clear, well-developed project with
        genuine commercial or creative potential has the best chance of being selected.
      </p>

      <div className="mt-10 flex flex-col gap-4 sm:mx-auto sm:max-w-sm">
        <Link
          href="/register/pitcher/new"
          className="rounded-full bg-red px-7 py-3.5 text-sm font-medium text-cream transition-transform hover:scale-105"
        >
          New Registration
        </Link>
        <Link
          href="/register/lookup"
          className="rounded-full border border-white/20 px-7 py-3.5 text-sm font-medium text-cream transition-colors hover:border-white/40"
        >
          Already Registered? Check Status
        </Link>
      </div>
    </main>
  );
}