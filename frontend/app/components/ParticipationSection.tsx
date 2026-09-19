import Link from "next/link";
import {
  Ticket,
  Store,
  Newspaper,
  Presentation,
  Handshake,
} from "lucide-react";
import { participationCategories } from "@/lib/content";
import Reveal from "./Reveal";

const categoryIcons = {
  attendee: Ticket,
  exhibitor: Store,
  press: Newspaper,
  pitcher: Presentation,
  investor: Handshake,
} as const;

export default function ParticipationSection() {
  return (
    <section
      id="participate"
      className="border-b border-white/10 bg-[#11152F]"
    >
      <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 md:py-28 lg:px-10">
        <Reveal>
          <div className="tricolor-rule mb-6">
            <span />
            <span />
            <span />
          </div>
        </Reveal>

        <Reveal delay={80}>
          <h2 className="max-w-3xl font-display text-4xl leading-[1.05] text-[#F5EFE6] sm:text-5xl lg:text-6xl">
            Choose How You Join ACS
          </h2>
        </Reveal>

        <Reveal delay={140}>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#B8B3AA]/75 sm:text-lg">
            Five ways to be part of the Showcase — pick the one that fits you.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {participationCategories.map((category, index) => {
            const Icon =
              categoryIcons[
                category.slug as keyof typeof categoryIcons
              ];

            return (
              <Reveal key={category.name} delay={80 + index * 90}>
                <div className="group flex h-full flex-col rounded-[1.75rem] border border-white/10 bg-[#151A3A] px-6 py-8 transition-all duration-300 hover:-translate-y-1 hover:border-[#00A5A8]/35 hover:shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
                  <div className="flex items-start justify-between">
                    {Icon && (
                      <Icon
                        className="h-8 w-8 text-[#00A5A8] transition-transform duration-300 group-hover:scale-110"
                        strokeWidth={1.5}
                      />
                    )}

                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#F5EFE6]/20">
                      0{index + 1}
                    </span>
                  </div>

                  <p className="mt-6 font-display text-xl text-[#F5EFE6]">
                    {category.name}
                  </p>

                  <p className="mt-3 flex-1 text-sm leading-relaxed text-[#B8B3AA]/70">
                    {category.blurb}
                  </p>

                  {category.note && (
                    <p className="mt-4 text-xs font-medium uppercase tracking-[0.12em] text-[#00A5A8]/75">
                      {category.note}
                    </p>
                  )}

                  <Link
                    href={`/register/${category.slug}`}
                    className="mt-7 inline-flex items-center justify-center rounded-full bg-[#00A5A8] px-5 py-3 text-sm font-medium text-[#11152F] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_25px_rgba(0,165,168,0.18)]"
                  >
                    Continue
                  </Link>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={220}>
          <div className="mt-10 text-center">
            <Link
              href="/register/lookup"
              className="text-sm text-[#B8B3AA]/60 underline underline-offset-4 transition-colors duration-300 hover:text-[#F5EFE6]"
            >
              Already registered? Check your status
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}