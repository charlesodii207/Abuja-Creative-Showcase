"use client";

import { useState } from "react";
import { faqs } from "@/lib/content";
import Reveal from "./Reveal";

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="border-b border-white/10 bg-ink-raised"
    >
      <div className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        {/* Section intro */}
        <Reveal>
          <div className="tricolor-rule mb-6">
            <span />
            <span />
            <span />
          </div>
        </Reveal>

        <Reveal delay={80}>
          <h2 className="font-display text-3xl text-cream sm:text-4xl">
            Questions people ask
          </h2>
        </Reveal>

        <div className="mt-10 border-t border-white/10">
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
                    <span className="font-medium text-cream transition-colors duration-300 group-hover:text-teal">
                      {item.q}
                    </span>

                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 text-lg text-gold transition-all duration-300 group-hover:border-gold/40"
                      style={{
                        transform: isOpen
                          ? "rotate(45deg)"
                          : "rotate(0deg)",
                      }}
                    >
                      +
                    </span>
                  </button>

                  {/* Animated answer */}
                  <div
                    className="grid transition-[grid-template-rows,opacity] duration-500 ease-out"
                    style={{
                      gridTemplateRows: isOpen ? "1fr" : "0fr",
                      opacity: isOpen ? 1 : 0,
                    }}
                  >
                    <div className="overflow-hidden">
                      <p className="max-w-2xl pb-6 pr-10 leading-relaxed text-muted">
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
    </section>
  );
}