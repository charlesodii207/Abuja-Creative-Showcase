import Link from "next/link";

export default function AttendeeRegisterPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-20 text-center md:py-28">
      <div className="tricolor-rule mx-auto mb-6">
        <span /><span /><span />
      </div>
      <h1 className="font-display text-3xl text-cream sm:text-4xl">
        Attendee Registration
      </h1>
      <p className="mt-3 text-muted">
        Come experience the Showcase — screenings, performances, the creative market, and more.
        General and VIP tickets start from ₦5,000.
      </p>

      <div className="mt-12 flex flex-col gap-4 sm:mx-auto sm:max-w-sm">
        <Link
          href="/register/attendee/new"
          className="rounded-full bg-red px-7 py-3.5 text-sm font-medium text-cream transition-transform hover:scale-105"
        >
          New Registration
        </Link>
        <Link
          href="/register/attendee/finish"
          className="rounded-full border border-white/20 px-7 py-3.5 text-sm font-medium text-cream transition-colors hover:border-white/40"
        >
          Already Registered? Proceed to Payment
        </Link>
      </div>
    </main>
  );
}
