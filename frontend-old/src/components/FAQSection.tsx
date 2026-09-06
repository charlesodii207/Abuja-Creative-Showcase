import { useState } from "react";
import { faqs } from "@/lib/content";

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="border-b border-white/10 bg-ink-raised">
      <div className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="tricolor-rule mb-6">
          <span /><span /><span />
        </div>
        <h2 className="font-display text-3xl text-cream sm:text-4xl">
          Questions people ask
        </h2>

        <div className="mt-10 divide-y divide-white/10 border-t border-white/10">
          {faqs.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={item.q}>
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-medium text-cream">{item.q}</span>
                  <span
                    className="shrink-0 text-xl text-gold transition-transform"
                    style={{ transform: isOpen ? "rotate(45deg)" : "none" }}
                  >
                    +
                  </span>
                </button>
                {isOpen && (
                  <p className="pb-5 pr-10 text-muted">{item.a}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
