import Link from "next/link";
import Reveal from "./Reveal";

export default function SponsorsSection() {
  return (
    <section
      id="sponsors"
      className="relative overflow-hidden border-b border-white/10 bg-[#11152F]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-16 h-56 w-56 rounded-full border border-[#E59200]/10"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 bottom-16 h-40 w-40 rounded-full border border-[#00A5A8]/10"
      />

      <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 md:py-28 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <Reveal>
              <div className="mb-6 flex items-center gap-4">
                <div className="tricolor-rule">
                  <span />
                  <span />
                  <span />
                </div>

                <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#F5EFE6]/45">
                  Partnerships
                </span>
              </div>
            </Reveal>

            <Reveal delay={80}>
              <h2 className="max-w-xl font-display text-4xl leading-[1.02] text-[#F5EFE6] sm:text-5xl lg:text-6xl">
                Partners & sponsors
              </h2>
            </Reveal>
          </div>

          <Reveal delay={140} distance={24}>
            <p className="max-w-2xl text-base leading-relaxed text-[#B8B3AA]/75 sm:text-lg">
              ACS is built as a partnership platform across government, private
              sector, and development organizations. From naming rights to
              sector sponsorships, we offer tiers designed for organizations of
              every scale — with benefits spanning brand visibility,
              activations, and thought-leadership opportunities across the
              two-day Showcase.
            </p>
          </Reveal>
        </div>

        <Reveal delay={240} distance={20}>
          <div className="mt-14 flex flex-col gap-8 rounded-[2rem] border border-white/10 bg-[#151A3A] p-7 sm:p-9 lg:flex-row lg:items-center lg:justify-between lg:p-10">
            <div className="max-w-xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#00A5A8]">
                Build with ACS
              </p>

              <p className="mt-3 font-display text-2xl leading-snug text-[#F5EFE6] sm:text-3xl">
                Put your organization inside Africa’s growing creative
                ecosystem.
              </p>
            </div>

            <Link
              href="/sponsorship"
              className="inline-flex shrink-0 items-center justify-center gap-3 rounded-full bg-[#E59200] px-7 py-4 text-sm font-medium text-[#11152F] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(229,146,0,0.18)]"
            >
              View Partnership Packages
              <span className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>
        </Reveal>

        <Reveal delay={360}>
          <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-7 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[#B8B3AA]/55">
              Partnership opportunities are available across multiple sectors.
            </p>

            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-[#B80319]" />

              <span className="text-[10px] uppercase tracking-[0.28em] text-[#F5EFE6]/30">
                Government · Private Sector · Development
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}