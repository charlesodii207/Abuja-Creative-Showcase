import Image from "next/image";
import Reveal from "./Reveal";

const images = [
  {
    src: "/images/inside-afriqa-01.webp",
    alt: "Audience experiencing the AFRIQA creative showcase",
    label: "The Showcase",
    className: "md:col-span-2 md:row-span-2",
  },
  {
    src: "/images/inside-afriqa-02.webp",
    alt: "Live music performance at a creative showcase",
    label: "Live Performance",
    className: "",
  },
  {
    src: "/images/inside-afriqa-03.webp",
    alt: "Creative market with art and fashion exhibitors",
    label: "Creative Market",
    className: "",
  },
  {
    src: "/images/inside-afriqa-04.webp",
    alt: "Creatives networking and connecting at an industry event",
    label: "Connection",
    className: "",
  },
  {
    src: "/images/inside-afriqa-05.webp",
    alt: "Abuja skyline representing the home of AFRIQA Creative Showcase",
    label: "Abuja · Africa",
    className: "",
  },
];

export default function InsideAfriqa() {
  return (
    <section
      id="inside-afriqa"
      className="relative overflow-hidden border-b border-white/10 bg-[#11152F]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-28 top-24 h-64 w-64 rounded-full border border-[#E59200]/10"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 bottom-20 h-44 w-44 rounded-full border border-[#00A5A8]/10"
      />

      <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 md:py-28 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <Reveal>
              <div className="mb-6 flex items-center gap-4">
                <div className="tricolor-rule">
                  <span />
                  <span />
                  <span />
                </div>

                <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#F5EFE6]/45">
                  Inside AFRIQA
                </span>
              </div>
            </Reveal>

            <Reveal delay={80}>
              <h2 className="max-w-xl font-display text-4xl leading-[1.02] text-[#F5EFE6] sm:text-5xl lg:text-6xl">
                Where creativity comes alive.
              </h2>
            </Reveal>
          </div>

          <Reveal delay={140}>
            <p className="max-w-2xl text-base leading-relaxed text-[#B8B3AA]/75 sm:text-lg">
              A first look at the energy, people, ideas, and experiences that
              will come together at AFRIQA Creative Showcase.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid auto-rows-[180px] grid-cols-1 gap-3 sm:auto-rows-[220px] sm:grid-cols-2 lg:auto-rows-[240px] lg:grid-cols-4">
          {images.map((image, index) => (
            <Reveal
              key={image.src}
              delay={200 + index * 80}
              distance={24}
              className={image.className}
            >
              <div className="group relative h-full overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#151A3A]">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes={
                    index === 0
                      ? "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 50vw"
                      : "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  }
                  quality={75}
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#11152F]/85 via-transparent to-transparent opacity-90" />

                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        index % 3 === 0
                          ? "bg-[#B80319]"
                          : index % 3 === 1
                            ? "bg-[#E59200]"
                            : "bg-[#00A5A8]"
                      }`}
                    />

                    <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#F5EFE6]/75">
                      {image.label}
                    </span>
                  </div>
                </div>

                <div className="pointer-events-none absolute inset-3 rounded-[1.4rem] border border-white/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={620}>
          <div className="mt-12 flex flex-col gap-5 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl font-display text-xl leading-snug text-[#F5EFE6]/80 sm:text-2xl">
              Film. Music. Fashion. Art. Technology. Culture. One connected
              ecosystem.
            </p>

            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-[#00A5A8]" />

              <span className="text-[10px] uppercase tracking-[0.28em] text-[#F5EFE6]/35">
                Abuja · 04–05 December 2026
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}