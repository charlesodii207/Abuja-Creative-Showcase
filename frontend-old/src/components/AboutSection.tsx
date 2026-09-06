import { about } from "@/lib/content";

export default function AboutSection() {
  return (
    <section id="about" className="border-b border-white/10 bg-ink-raised">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-[1fr_1.4fr] md:py-28">
        <div>
          <div className="tricolor-rule mb-6">
            <span /><span /><span />
          </div>
          <h2 className="font-display text-3xl text-cream sm:text-4xl">
            {about.heading}
          </h2>
        </div>

        <div className="space-y-5 text-lg leading-relaxed text-muted">
          {about.body.map((paragraph) => (
            <p key={paragraph.slice(0, 20)}>{paragraph}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
