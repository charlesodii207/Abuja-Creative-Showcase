import Link from "next/link";

export default function ExhibitorRegisterPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-20 text-center md:py-28">
      <div className="tricolor-rule mx-auto mb-6">
        <span /><span /><span />
      </div>
      <h1 className="font-display text-3xl text-cream sm:text-4xl">
        Exhibitor
      </h1>
      <p className="mt-3 text-muted">
        Showcase your creative business, sell products, and connect with buyers and brands at the Creative Market.
      </p>

      <p className="mx-auto mt-6 max-w-xl text-left text-sm leading-relaxed text-muted">
        The Creative Market transforms ACS from a showcase into a working marketplace. As an
        Exhibitor, you get a dedicated space where visitors, brands, and industry buyers can
        discover your work — whether that&apos;s fashion, film, art, tech, publishing, or any other
        creative product or service. Exhibitor spaces aren&apos;t capped to a fixed number; applications
        are reviewed and accepted as they come in, so applying early genuinely improves your chances.
        You&apos;ll be asked about your company, what you plan to bring, a short work sample or
        portfolio link, and your main goal at the market — whether that&apos;s selling, showcasing, or
        networking. Booths come in two sizes — small (₦250,000) and big (₦500,000) — and you can
        optionally include an auction of your own items as part of your space.
      </p>

      <div className="mt-10 flex flex-col gap-4 sm:mx-auto sm:max-w-sm">
        <Link
          href="/register/exhibitor/new"
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
