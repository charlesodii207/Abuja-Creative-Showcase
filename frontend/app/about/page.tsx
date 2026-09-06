import { aboutExtended } from "@/lib/content";

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20 md:py-28">
      <div className="tricolor-rule mb-6">
        <span /><span /><span />
      </div>
      <h1 className="font-display text-3xl text-cream sm:text-4xl">
        About Abuja Creative Showcase
      </h1>

      <div className="mt-10 space-y-6 text-lg leading-relaxed text-muted">
        {aboutExtended.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>
    </main>
  );
}