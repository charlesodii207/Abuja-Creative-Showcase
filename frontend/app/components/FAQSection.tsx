"use client";

import { useState } from "react";
import { faqs } from "@/lib/content";
import Reveal from "./Reveal";

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="relative overflow-hidden border-b border-white/10 bg-[#11152F]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-20 h-56 w-56 rounded-full border border-[#E59200]/10"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 bottom-16 h-40 w-40 rounded-full border border-[#00A5A8]/10"
      />

      <div className="mx-auto max-w-4xl px-6 py-20 sm:px-8 md:py-28 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
          <div>
            <Reveal>
              <div className="mb-6 flex items-center gap-4">
                <div className="tricolor-rule">
                  <span />
                  <span />
                  <span />
                </div>

                <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#F5EFE6]/45">
                  FAQ
                </span>
              </div>
            </Reveal>

            <Reveal delay={80}>
              <h2 className="max-w-sm font-display text-4xl leading-[1.02] text-[#F5EFE6] sm:text-5xl">
                Questions people ask.
              </h2>
            </Reveal>

            <Reveal delay={140}>
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-[#B8B3AA]/65 sm:text-base">
                Everything you need to know before joining the Showcase.
              </p>
            </Reveal>
          </div>

          <div className="border-t border-white/10">
            {faqs.map((item, index) => {
              const isOpen = openIndex === index;

              return (
                <Reveal key={item.q} delay={140 + index * 70}>
                  <div className="border-b border-white/10">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenIndex(isOpen ? null : index)
                      }
                      className="group flex w-full items-center justify-between gap-6 py-6 text-left"
                      aria-expanded={isOpen}
                    >
                      <span className="font-medium leading-relaxed text-[#F5EFE6]/85 transition-colors duration-300 group-hover:text-[#00A5A8]">
                        {item.q}
                      </span>

                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-lg transition-all duration-300 ${
                          isOpen
                            ? "border-[#E59200]/40 bg-[#E59200]/10 text-[#E59200]"
                            : "border-white/10 text-[#E59200] group-hover:border-[#E59200]/40"
                        }`}
                        style={{
                          transform: isOpen
                            ? "rotate(45deg)"
                            : "rotate(0deg)",
                        }}
                      >
                        +
                      </span>
                    </button>

                    <div
                      className="grid transition-[grid-template-rows,opacity] duration-500 ease-out"
                      style={{
                        gridTemplateRows: isOpen ? "1fr" : "0fr",
                        opacity: isOpen ? 1 : 0,
                      }}
                    >
                      <div className="overflow-hidden">
                        <p className="max-w-2xl pb-6 pr-10 text-sm leading-relaxed text-[#B8B3AA]/70 sm:text-base">
                          {item.a}
                        </p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}