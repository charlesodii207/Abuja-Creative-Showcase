import Link from "next/link";
import { about } from "@/lib/content";
import Reveal from "./Reveal";

export default function AboutSection() {
  return (
    <section id="about" className="border-b border-white/10 bg-ink-raised">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-[1fr_1.4fr] md:py-28">
        <div>
          <Reveal>
            <div className="tricolor-rule mb-6">
              <span />
              <span />
              <span />
            </div>
          </Reveal>

          <Reveal delay={80}>
            <h2 className="font-display text-3xl text-cream sm:text-4xl">
              {about.heading}
            </h2>
          </Reveal>
        </div>

        <div className="space-y-5 text-lg leading-relaxed text-muted">
          {about.body.map((paragraph, index) => (
            <Reveal key={paragraph.slice(0, 20)} delay={140 + index * 100}>
              <p>{paragraph}</p>
            </Reveal>
          ))}

          <Reveal delay={380}>
            <Link
              href="/about"
              className="inline-block text-sm text-teal underline underline-offset-4 transition-colors duration-300 hover:text-cream"
            >
              See more about the event
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}