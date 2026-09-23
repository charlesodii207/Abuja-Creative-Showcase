import Link from "next/link";

function Price({ label, amount }: { label: string; amount: string }) {
  return (
    <span className="whitespace-nowrap">
      {label}{" "}
      <span className="line-through decoration-2 decoration-[#E59200]/70">
        ₦
      </span>
      {amount}
    </span>
  );
}

export default function AttendeeRegisterPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#11152F]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-20 h-64 w-64 rounded-full border border-[#E59200]/10"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 bottom-20 h-44 w-44 rounded-full border border-[#00A5A8]/10"
      />

      <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6 py-20 sm:px-8 md:py-28">
        <div className="relative w-full text-center">
          <div
            aria-hidden="true"
            className="absolute -inset-5 rounded-[2rem] border border-white/[0.06] sm:-inset-8"
          />

          <div className="relative rounded-[2rem] border border-white/10 bg-[#151A3A] px-6 py-12 shadow-[0_30px_80px_rgba(0,0,0,0.18)] sm:px-10 sm:py-14">
            <div className="tricolor-rule mx-auto mb-7">
              <span />
              <span />
              <span />
            </div>

            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#00A5A8]">
              Join the Showcase
            </p>

            <h1 className="mt-4 font-display text-4xl leading-[1.05] text-[#F5EFE6] sm:text-5xl">
              Attendee Registration
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[#B8B3AA]/75 sm:text-lg">
              Come experience the Showcase — screenings, performances, the
              creative market, and more.
            </p>

            <div className="mt-5 inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-full border border-[#E59200]/20 bg-[#11152F]/60 px-4 py-2">
              <span className="h-2 w-2 shrink-0 rounded-full bg-[#E59200]" />
              <p className="text-sm font-medium text-[#F5EFE6]/80">
                <Price label="General" amount="5,000" />
                {" · "}
                <Price label="VIP" amount="10,000" />
                {" · "}
                <Price label="Masterclass" amount="25,000" />
              </p>
            </div>

            <div className="mx-auto mt-10 flex max-w-sm flex-col gap-4">
              <Link
                href="/register/attendee/new"
                className="rounded-full bg-[#B80319] px-7 py-3.5 text-sm font-medium text-[#F5EFE6] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(184,3,25,0.2)]"
              >
                New Registration
              </Link>

              <Link
                href="/register/attendee/finish"
                className="rounded-full border border-white/15 bg-[#11152F]/40 px-7 py-3.5 text-sm font-medium text-[#F5EFE6]/80 transition-all duration-300 hover:border-[#00A5A8]/40 hover:text-[#F5EFE6]"
              >
                Check Status, Pay, or Upgrade
              </Link>
            </div>

            <div className="mt-10 flex items-center justify-center gap-3">
              <span className="h-px w-10 bg-white/10" />
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#F5EFE6]/30">
                Abuja · 04–05 December 2026
              </span>
              <span className="h-px w-10 bg-white/10" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
