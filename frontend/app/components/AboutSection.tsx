import Image from "next/image";
import Link from "next/link";
import { about } from "@/lib/content";
import Reveal from "./Reveal";

export default function AboutSection() {
  return (
    <section
      id="about"
      className="overflow-hidden border-b border-white/10 bg-[#11152F]"
    >
      <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 md:py-28 lg:px-10">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          {/* Mobile heading / Desktop content */}
          <div className="order-1 lg:order-2">
            {/* About AFRIQA — intentionally loads immediately */}
            <div className="mb-6 flex items-center gap-3">
              <div className="tricolor-rule">
                <span />
                <span />
                <span />
              </div>

              <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#F5EFE6]/45">
                About AFRIQA
              </span>
            </div>

            {/* Mobile portrait */}
            <div className="mb-12 lg:hidden">
              <Reveal>
                <div className="relative px-3 pb-3 sm:px-5 sm:pb-5">
                  <div className="absolute inset-3 rounded-[2.5rem] border border-[#E59200]/30 sm:inset-5" />

                  <div className="absolute -bottom-1 -left-1 h-24 w-24 rounded-full border border-[#00A5A8]/30 bg-[#00A5A8]/10 blur-[1px] sm:h-28 sm:w-28" />

                  <div className="absolute -right-1 -top-3 z-20 flex h-14 w-14 items-center justify-center rounded-full border border-[#E59200]/40 bg-[#11152F] shadow-[0_0_30px_rgba(229,146,0,0.12)] sm:-right-3 sm:-top-5 sm:h-16 sm:w-16">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#E59200]" />
                  </div>

                  <div className="group relative overflow-hidden rounded-[2.5rem] rounded-br-[5rem] rounded-tl-[1rem] border border-white/10 bg-[#11152F] shadow-[0_25px_80px_rgba(0,0,0,0.22)]">
                    <div className="absolute inset-0 z-10 bg-gradient-to-tr from-[#11152F]/25 via-transparent to-[#E59200]/10" />

                    <Image
                      src="/images/about.webp"
                      alt="Creative professionals connecting at AFRIQA Creative Showcase"
                      width={1536}
                      height={1024}
                      className="h-[360px] w-full object-cover sm:h-[460px]"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      quality={75}
                    />

                    <div className="absolute bottom-5 left-5 z-20 flex items-center gap-3 rounded-full border border-white/15 bg-[#11152F]/80 px-4 py-2 backdrop-blur-md">
                      <span className="h-2 w-2 rounded-full bg-[#E59200]" />

                      <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#F5EFE6]/80">
                        One ecosystem
                      </span>
                    </div>

                    <div className="pointer-events-none absolute inset-3 z-20 rounded-[2rem] rounded-br-[4.5rem] border border-white/10" />
                  </div>
                </div>
              </Reveal>
            </div>

            <Reveal delay={80}>
              <h2 className="max-w-xl font-display text-4xl leading-[1.05] text-[#F5EFE6] sm:text-5xl lg:text-6xl">
                {about.heading}
              </h2>
            </Reveal>

            <div className="mt-8 max-w-xl space-y-5 text-base leading-relaxed text-white/65 sm:text-lg">
              {about.body.map((paragraph, index) => (
                <Reveal
                  key={paragraph.slice(0, 20)}
                  delay={160 + index * 100}
                >
                  <p>{paragraph}</p>
                </Reveal>
              ))}
            </div>

            <Reveal delay={400}>
              <div className="mt-9">
                <Link
                  href="/about"
                  className="group inline-flex items-center gap-3 text-sm font-medium text-[#00A5A8] transition-colors duration-300 hover:text-[#F5EFE6]"
                >
                  <span>See more about the event</span>

                  <span className="transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </div>
            </Reveal>
          </div>

          {/* Desktop portrait */}
          <div className="order-2 hidden lg:order-1 lg:block">
            <Reveal>
              <div className="relative px-3 pb-3 sm:px-5 sm:pb-5">
                <div className="absolute inset-3 rounded-[2.5rem] border border-[#E59200]/30 sm:inset-5" />

                <div className="absolute -bottom-1 -left-1 h-24 w-24 rounded-full border border-[#00A5A8]/30 bg-[#00A5A8]/10 blur-[1px] sm:h-28 sm:w-28" />

                <div className="absolute -right-1 -top-3 z-20 flex h-14 w-14 items-center justify-center rounded-full border border-[#E59200]/40 bg-[#11152F] shadow-[0_0_30px_rgba(229,146,0,0.12)] sm:-right-3 sm:-top-5 sm:h-16 sm:w-16">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#E59200]" />
                </div>

                <div className="group relative overflow-hidden rounded-[2.5rem] rounded-br-[5rem] rounded-tl-[1rem] border border-white/10 bg-[#11152F] shadow-[0_25px_80px_rgba(0,0,0,0.22)]">
                  <div className="absolute inset-0 z-10 bg-gradient-to-tr from-[#11152F]/25 via-transparent to-[#E59200]/10" />

                  <Image
                    src="/images/about.webp"
                    alt="Creative professionals connecting at AFRIQA Creative Showcase"
                    width={1536}
                    height={1024}
                    className="h-[360px] w-full object-cover sm:h-[460px] lg:h-[560px]"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    quality={75}
                  />

                  <div className="absolute bottom-5 left-5 z-20 flex items-center gap-3 rounded-full border border-white/15 bg-[#11152F]/80 px-4 py-2 backdrop-blur-md">
                    <span className="h-2 w-2 rounded-full bg-[#E59200]" />

                    <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#F5EFE6]/80">
                      One ecosystem
                    </span>
                  </div>

                  <div className="pointer-events-none absolute inset-3 z-20 rounded-[2rem] rounded-br-[4.5rem] border border-white/10" />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}