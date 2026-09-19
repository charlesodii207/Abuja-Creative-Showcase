import Image from "next/image";
import Reveal from "./Reveal";

export default function ConvenersNote() {
  return (
    <section
      id="conveners-note"
      className="relative overflow-hidden border-b border-white/10 bg-[#11152F]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-16 h-64 w-64 rounded-full border border-[#E59200]/10"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 bottom-10 h-40 w-40 rounded-full border border-[#00A5A8]/10"
      />

      <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 md:py-28 lg:px-10">
        <div className="grid items-center gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div className="relative order-1 lg:order-2">
            <Reveal>
              <div className="mb-7 flex items-center gap-4">
                <div className="tricolor-rule">
                  <span />
                  <span />
                  <span />
                </div>

                <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#C5BFAF]/55">
                  A Note From The Convener
                </span>
              </div>
            </Reveal>

            {/* Mobile-only portrait */}
            <div className="mb-12 lg:hidden">
              <Reveal>
                <div className="relative mx-auto w-full max-w-sm">
                  <div
                    aria-hidden="true"
                    className="absolute -bottom-4 -left-4 h-full w-full rounded-[2.5rem] border border-[#E59200]/25"
                  />

                  <div
                    aria-hidden="true"
                    className="absolute -right-4 -top-4 z-20 h-12 w-12 rounded-full border border-[#00A5A8]/40 bg-[#11152F]"
                  >
                    <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00A5A8]" />
                  </div>

                  <div className="relative overflow-hidden rounded-[2.5rem] rounded-bl-[5rem] rounded-tr-[1rem] border border-white/10 bg-[#11152F] shadow-[0_25px_80px_rgba(0,0,0,0.25)]">
                    <Image
                      src="/images/convener.webp"
                      alt="Paulgold Olalekan Joseph, Convener of AFRIQA Creative Showcase"
                      width={1000}
                      height={1200}
                      className="h-[420px] w-full object-cover object-top sm:h-[500px]"
                      sizes="(max-width: 1024px) 100vw, 35vw"
                      quality={75}
                    />

                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-3 rounded-[2rem] rounded-bl-[4.5rem] rounded-tr-[0.75rem] border border-white/10"
                    />
                  </div>

                  <div className="absolute bottom-5 left-5 right-5 z-30 rounded-2xl border border-[#E59200]/20 bg-[#151A3A]/95 px-5 py-4 backdrop-blur-md">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#F5EFE6]">
                      Paulgold Olalekan Joseph
                    </p>

                    <p className="mt-1 text-[9px] uppercase tracking-[0.25em] text-[#C5BFAF]/55">
                      Convener · AFRIQA Creative Showcase
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>

            <Reveal delay={80}>
              <div className="mb-7 text-[#E59200]/70">
                <span className="font-display text-6xl leading-none">“</span>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <blockquote className="max-w-2xl font-display text-3xl leading-[1.15] text-[#F5EFE6] sm:text-4xl lg:text-5xl">
                Africa has never lacked creativity. What we need are stronger
                spaces where that creativity can connect, collaborate, and
                become opportunity.
              </blockquote>
            </Reveal>

            <Reveal delay={220}>
              <div className="mt-8 max-w-2xl space-y-5 text-base leading-relaxed text-[#B8B3AA]/75 sm:text-[17px]">
                <p>
                  AFRIQA Creative Showcase was created from a simple belief:
                  our creative industries become stronger when talent, ideas,
                  capital, and opportunity meet in the same space.
                </p>

                <p>
                  This showcase is more than a gathering. It is an invitation
                  to discover new voices, build meaningful connections, open
                  doors, and create the partnerships that move African
                  creativity forward.
                </p>

                <p>
                  Abuja gives us the meeting point. The creatives bring the
                  energy. Together, we create the ecosystem.
                </p>
              </div>
            </Reveal>

            <Reveal delay={320}>
              <div className="mt-10 flex items-end gap-5">
                <div>
                  <div className="h-px w-16 bg-[#E59200]/60" />

                  <p className="mt-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#F5EFE6]">
                    Paulgold Olalekan Joseph
                  </p>

                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[#C5BFAF]/50">
                    Convener · AFRIQA Creative Showcase
                  </p>
                </div>

                <div className="mb-1 h-2 w-2 rounded-full bg-[#00A5A8]" />
              </div>
            </Reveal>
          </div>

          {/* Desktop portrait */}
          <div className="order-2 hidden lg:order-1 lg:block">
            <Reveal>
              <div className="relative mx-auto w-full max-w-sm">
                <div
                  aria-hidden="true"
                  className="absolute -bottom-4 -left-4 h-full w-full rounded-[2.5rem] border border-[#E59200]/25"
                />

                <div
                  aria-hidden="true"
                  className="absolute -right-4 -top-4 z-20 h-12 w-12 rounded-full border border-[#00A5A8]/40 bg-[#11152F]"
                >
                  <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00A5A8]" />
                </div>

                <div className="relative overflow-hidden rounded-[2.5rem] rounded-bl-[5rem] rounded-tr-[1rem] border border-white/10 bg-[#11152F] shadow-[0_25px_80px_rgba(0,0,0,0.25)]">
                  <Image
                    src="/images/convener.webp"
                    alt="Paulgold Olalekan Joseph, Convener of AFRIQA Creative Showcase"
                    width={1000}
                    height={1200}
                    className="h-[420px] w-full object-cover object-top sm:h-[500px]"
                    sizes="(max-width: 1024px) 100vw, 35vw"
                    quality={75}
                  />

                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-3 rounded-[2rem] rounded-bl-[4.5rem] rounded-tr-[0.75rem] border border-white/10"
                  />
                </div>

                <div className="absolute bottom-5 left-5 right-5 z-30 rounded-2xl border border-[#E59200]/20 bg-[#151A3A]/95 px-5 py-4 backdrop-blur-md">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#F5EFE6]">
                    Paulgold Olalekan Joseph
                  </p>

                  <p className="mt-1 text-[9px] uppercase tracking-[0.25em] text-[#C5BFAF]/55">
                    Convener · AFRIQA Creative Showcase
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}