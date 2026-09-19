import Link from "next/link";

export default function PressRegisterPage() {
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

      <div className="mx-auto max-w-3xl px-6 py-20 sm:px-8 md:py-28">
        <div className="relative">
          <div
            aria-hidden="true"
            className="absolute -inset-5 rounded-[2rem] border border-white/[0.06] sm:-inset-8"
          />

          <div className="relative rounded-[2rem] border border-white/10 bg-[#151A3A] px-6 py-12 text-center shadow-[0_30px_80px_rgba(0,0,0,0.18)] sm:px-10 sm:py-14">
            <div className="tricolor-rule mx-auto mb-7">
              <span />
              <span />
              <span />
            </div>

            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#00A5A8]">
              Media & Press Centre
            </p>

            <h1 className="mt-4 font-display text-4xl leading-[1.05] text-[#F5EFE6] sm:text-5xl">
              Press
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[#B8B3AA]/75 sm:text-lg">
              Cover the Showcase — interviews, behind-the-scenes access, and
              press briefings.
            </p>

            <div className="mx-auto mt-8 max-w-2xl rounded-[1.5rem] border border-white/10 bg-[#11152F]/60 px-6 py-7 text-left">
              <p className="text-sm leading-relaxed text-[#B8B3AA]/70">
                ACS runs a dedicated Media & Press Centre for interviews, press
                conferences, content creation, and accreditation throughout the
                two days.
              </p>

              <p className="mt-4 text-sm leading-relaxed text-[#B8B3AA]/70">
                Press accreditation gives you access to cover screenings,
                performances, panels, the Creative Market, and the Pitching &
                Deal Room, along with opportunities to interview speakers,
                exhibitors, and organizers.
              </p>

              <p className="mt-4 text-sm leading-relaxed text-[#B8B3AA]/70">
                To be considered, you&apos;ll need to provide your outlet name
                and some proof of your editorial role — a byline, a link to
                your publication, or a portfolio of past coverage works well.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[#00A5A8]/20 bg-[#151A3A] px-4 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B8B3AA]/45">
                    Access
                  </p>
                  <p className="mt-1 font-display text-xl text-[#00A5A8]">
                    Two Days
                  </p>
                </div>

                <div className="rounded-xl border border-[#B80319]/20 bg-[#151A3A] px-4 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B8B3AA]/45">
                    Accreditation
                  </p>
                  <p className="mt-1 font-display text-xl text-[#B80319]">
                    Reviewed
                  </p>
                </div>
              </div>

              <p className="mt-5 text-xs leading-relaxed text-[#B8B3AA]/55">
                Accreditation is reviewed individually because space in the
                Press Centre is limited. Independent journalists and content
                creators are welcome to apply alongside outlet staff, provided
                they can show a genuine editorial track record.
              </p>
            </div>

            <div className="mx-auto mt-9 flex max-w-sm flex-col gap-4">
              <Link
                href="/register/press/new"
                className="rounded-full bg-[#B80319] px-7 py-3.5 text-sm font-medium text-[#F5EFE6] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(184,3,25,0.2)]"
              >
                New Registration
              </Link>

              <Link
                href="/register/lookup"
                className="rounded-full border border-white/15 bg-[#11152F]/40 px-7 py-3.5 text-sm font-medium text-[#F5EFE6]/80 transition-all duration-300 hover:border-[#00A5A8]/40 hover:text-[#F5EFE6]"
              >
                Already Registered? Check Status
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