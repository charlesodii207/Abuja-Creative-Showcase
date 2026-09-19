import Link from "next/link";

export default function InvestorRegisterPage() {
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
              Creative Finance & Deal Room
            </p>

            <h1 className="mt-4 font-display text-4xl leading-[1.05] text-[#F5EFE6] sm:text-5xl">
              Investor
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[#B8B3AA]/75 sm:text-lg">
              Discover creative projects, meet emerging talent, and explore
              opportunities across Africa&apos;s creative economy.
            </p>

            <div className="mx-auto mt-8 max-w-2xl rounded-[1.5rem] border border-white/10 bg-[#11152F]/60 px-6 py-7 text-left">
              <p className="text-sm leading-relaxed text-[#B8B3AA]/70">
                The Investor track connects investors, funders, brands,
                institutions, and other capital partners with creative
                businesses and projects participating at ACS.
              </p>

              <p className="mt-4 text-sm leading-relaxed text-[#B8B3AA]/70">
                You can use the Showcase to discover projects and founders
                across film, music, fashion, art, technology, publishing,
                media, and other creative sectors — and connect directly with
                the people building them.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[#E59200]/20 bg-[#151A3A] px-4 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B8B3AA]/45">
                    Connect With
                  </p>

                  <p className="mt-1 text-sm leading-relaxed text-[#E59200]">
                    Creators · Founders · Projects · Businesses
                  </p>
                </div>

                <div className="rounded-xl border border-[#00A5A8]/20 bg-[#151A3A] px-4 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B8B3AA]/45">
                    Explore
                  </p>

                  <p className="mt-1 text-sm leading-relaxed text-[#00A5A8]">
                    Investment · Partnerships · Deals · Opportunities
                  </p>
                </div>
              </div>

              <p className="mt-5 text-sm leading-relaxed text-[#B8B3AA]/70">
                Investor participation is designed to create meaningful
                connections between capital and creative opportunity, with
                access to relevant conversations, projects, and people across
                the Showcase.
              </p>

              <p className="mt-4 text-xs leading-relaxed text-[#B8B3AA]/55">
                You&apos;ll be asked about your organization, investment
                interests, areas of focus, and the kinds of creative
                opportunities you are interested in exploring.
              </p>
            </div>

            <div className="mx-auto mt-9 flex max-w-sm flex-col gap-4">
              <Link
                href="/register/investor/new"
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