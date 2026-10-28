import Image from "next/image";
import { useTranslations } from "next-intl";
import Reveal from "./Reveal";

const images = [
  {
    src: "/images/inside-afriqa-01.webp",
    id: 1,
    className: "md:col-span-2 md:row-span-2",
  },
  {
    src: "/images/inside-afriqa-02.webp",
    id: 2,
    className: "",
  },
  {
    src: "/images/inside-afriqa-03.webp",
    id: 3,
    className: "",
  },
  {
    src: "/images/inside-afriqa-04.webp",
    id: 4,
    className: "",
  },
  {
    src: "/images/inside-afriqa-05.webp",
    id: 5,
    className: "",
  },
];

export default function InsideAfriqa() {
  const t = useTranslations("Home.inside");
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
                  {t("eyebrow")}
                </span>
              </div>
            </Reveal>

            <Reveal delay={80}>
              <h2 className="max-w-xl font-display text-4xl leading-[1.02] text-[#F5EFE6] sm:text-5xl lg:text-6xl">
                {t("heading")}
              </h2>
            </Reveal>
          </div>

          <Reveal delay={140}>
            <p className="max-w-2xl text-base leading-relaxed text-[#B8B3AA]/75 sm:text-lg">
              {t("text")}
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
                  alt={t(`i${image.id}.alt`)}
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
                      {t(`i${image.id}.label`)}
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
              {t("closing")}
            </p>

            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-[#00A5A8]" />

              <span className="text-[10px] uppercase tracking-[0.28em] text-[#F5EFE6]/35">
                {t("footer")}
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
