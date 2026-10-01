import Link from "next/link";
import Reveal from "./Reveal";

export default function HotelBookingSection() {
  return (
    <section
      id="accommodation"
      className="overflow-hidden border-b border-white/10 bg-[#11152F]"
    >
      <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 md:py-28 lg:px-10">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          {/* Copy */}
          <div>
            <div className="mb-6 flex items-center gap-3">
              <div className="tricolor-rule">
                <span />
                <span />
                <span />
              </div>

              <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#F5EFE6]/45">
                Accommodation
              </span>
            </div>

            <Reveal delay={80}>
              <h2 className="max-w-xl font-display text-4xl leading-[1.05] text-[#F5EFE6] sm:text-5xl lg:text-6xl">
                Need a place to stay in Abuja?
              </h2>
            </Reveal>

            <Reveal delay={160}>
              <p className="mt-8 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg">
                Tell us your dates and budget, and our team will match you with
                a hotel that suits you.
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div className="mt-9">
                <Link
                  href="/accommodation"
                  className="group inline-flex items-center gap-3 rounded-full bg-[#E59200] px-8 py-4 text-sm font-semibold text-[#0D1128] transition-colors duration-300 hover:bg-[#F5EFE6]"
                >
                  <span>Book a hotel</span>

                  <span className="transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </div>
            </Reveal>
          </div>

          {/* Steps card */}
          <Reveal delay={120}>
            <div className="relative px-3 pb-3 sm:px-5 sm:pb-5">
              <div className="absolute inset-3 rounded-[2.5rem] border border-[#E59200]/30 sm:inset-5" />

              <div className="absolute -bottom-1 -left-1 h-24 w-24 rounded-full border border-[#00A5A8]/30 bg-[#00A5A8]/10 blur-[1px] sm:h-28 sm:w-28" />

              <div className="absolute -right-1 -top-3 z-20 flex h-14 w-14 items-center justify-center rounded-full border border-[#E59200]/40 bg-[#11152F] shadow-[0_0_30px_rgba(229,146,0,0.12)] sm:-right-3 sm:-top-5 sm:h-16 sm:w-16">
                <span className="h-2.5 w-2.5 rounded-full bg-[#E59200]" />
              </div>

              <div className="relative rounded-[2.5rem] rounded-br-[5rem] rounded-tl-[1rem] border border-white/10 bg-[#0D1128] p-8 shadow-[0_25px_80px_rgba(0,0,0,0.22)] sm:p-10">
                <p className="mb-8 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#F5EFE6]/45">
                  How it works
                </p>

                <ul className="space-y-7">
                  {[
                    {
                      title: "Share your details",
                      text: "Your dates, guests, and contact information.",
                    },
                    {
                      title: "Set your budget",
                      text: "Pick a price range and preferred area.",
                    },
                    {
                      title: "Get your options",
                      text: "We confirm availability and reply by email.",
                    },
                  ].map((item, i) => (
                    <li key={item.title} className="flex items-start gap-5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E59200]/40 text-sm font-semibold text-[#E59200]">
                        {i + 1}
                      </span>

                      <div>
                        <h3 className="font-display text-xl text-[#F5EFE6]">
                          {item.title}
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed text-white/65">
                          {item.text}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}