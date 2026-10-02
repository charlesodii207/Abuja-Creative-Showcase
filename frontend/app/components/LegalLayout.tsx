import Link from "next/link";
import { legal, type LegalSection } from "@/lib/legal";

type LegalLayoutProps = {
  eyebrow: string;
  title: string;
  intro: string;
  keyPointsTitle?: string;
  keyPoints?: string[];
  sections: LegalSection[];
  other: { href: string; label: string; text: string };
};

function Contents({ sections }: { sections: LegalSection[] }) {
  return (
    <ol className="space-y-1">
      {sections.map((section, index) => (
        <li key={section.id}>
          <a
            href={`#${section.id}`}
            className="flex gap-3 rounded-lg px-3 py-2 text-sm leading-snug text-white/60 transition-colors duration-200 hover:bg-white/5 hover:text-[#F5EFE6]"
          >
            <span className="w-6 shrink-0 text-white/35">{index + 1}.</span>
            <span>{section.title}</span>
          </a>
        </li>
      ))}
    </ol>
  );
}

export default function LegalLayout({
  eyebrow,
  title,
  intro,
  keyPointsTitle,
  keyPoints,
  sections,
  other,
}: LegalLayoutProps) {
  return (
    <main className="min-h-screen bg-[#11152F]">
      <div className="mx-auto max-w-7xl px-6 pb-20 pt-10 sm:px-8 md:pb-28 md:pt-14 lg:px-10">
        <Link
          href="/"
          className="group mb-10 inline-flex items-center gap-3 text-sm font-medium text-[#00A5A8] transition-colors duration-300 hover:text-[#F5EFE6]"
        >
          <span className="transition-transform duration-300 group-hover:-translate-x-1">
            ←
          </span>
          <span>Back to home</span>
        </Link>

        <header className="max-w-3xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="tricolor-rule">
              <span />
              <span />
              <span />
            </div>

            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#F5EFE6]/45">
              {eyebrow}
            </span>
          </div>

          <h1 className="font-display text-4xl leading-[1.05] text-[#F5EFE6] sm:text-5xl lg:text-6xl">
            {title}
          </h1>

          <p className="mt-6 text-base leading-relaxed text-white/65 sm:text-lg">
            {intro}
          </p>

          <p className="mt-6 text-sm text-white/45">
            Version {legal.legalVersion}. Effective {legal.effectiveDate}. Last
            updated {legal.lastUpdated}.
          </p>
        </header>

        {keyPoints && keyPoints.length > 0 && (
          <div className="mt-12 max-w-3xl rounded-2xl border border-[#E59200]/30 bg-[#E59200]/[0.06] p-6 sm:p-8">
            <h2 className="font-display text-2xl text-[#F5EFE6]">
              {keyPointsTitle ?? "The key points"}
            </h2>

            <ul className="mt-5 space-y-3">
              {keyPoints.map((point) => (
                <li
                  key={point}
                  className="flex gap-3 text-sm leading-relaxed text-[#F5EFE6]/80 sm:text-base"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#E59200]" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>

            <p className="mt-5 text-xs leading-relaxed text-white/45">
              This summary is for convenience only. The full text below is what
              applies.
            </p>
          </div>
        )}

        <div className="mt-14 grid gap-10 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-16">
          {/* Contents: collapsible on mobile, sticky on desktop */}
          <div>
            <details className="rounded-2xl border border-white/10 bg-[#0D1128] lg:hidden">
              <summary className="cursor-pointer list-none px-5 py-4 text-sm font-medium text-[#F5EFE6]">
                Contents
              </summary>
              <div className="border-t border-white/10 p-2">
                <Contents sections={sections} />
              </div>
            </details>

            <aside className="sticky top-24 hidden max-h-[calc(100vh-8rem)] overflow-y-auto rounded-2xl border border-white/10 bg-[#0D1128] p-3 lg:block">
              <p className="px-3 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#F5EFE6]/45">
                Contents
              </p>
              <Contents sections={sections} />
            </aside>
          </div>

          {/* Sections */}
          <article className="max-w-3xl">
            {sections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                className={`scroll-mt-24 ${
                  index === 0 ? "" : "mt-12 border-t border-white/10 pt-12"
                }`}
              >
                <h2 className="font-display text-2xl leading-tight text-[#F5EFE6] sm:text-3xl">
                  <span className="mr-3 text-white/35">{index + 1}.</span>
                  {section.title}
                </h2>

                <div className="mt-6 space-y-5">
                  {section.blocks.map((block, blockIndex) => {
                    if (block.type === "p") {
                      return (
                        <p
                          key={blockIndex}
                          className="text-base leading-relaxed text-white/65"
                        >
                          {block.text}
                        </p>
                      );
                    }

                    if (block.type === "ul") {
                      return (
                        <ul key={blockIndex} className="space-y-2.5">
                          {block.items.map((item) => (
                            <li
                              key={item}
                              className="flex gap-3 text-base leading-relaxed text-white/65"
                            >
                              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#E59200]" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      );
                    }

                    return (
                      <p
                        key={blockIndex}
                        className="border-l-2 border-[#E59200] bg-[#E59200]/[0.08] px-5 py-4 text-base leading-relaxed text-[#F5EFE6]/85"
                      >
                        {block.text}
                      </p>
                    );
                  })}
                </div>
              </section>
            ))}

            <div className="mt-16 rounded-2xl border border-white/10 bg-[#0D1128] p-6 sm:p-8">
              <p className="text-base leading-relaxed text-white/65">
                {other.text}
              </p>
              <Link
                href={other.href}
                className="group mt-4 inline-flex items-center gap-3 text-sm font-medium text-[#00A5A8] transition-colors duration-300 hover:text-[#F5EFE6]"
              >
                <span>{other.label}</span>
                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </div>
          </article>
        </div>
      </div>
    </main>
  );
}
