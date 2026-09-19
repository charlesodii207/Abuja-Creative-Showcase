import {
  Film,
  Music2,
  Shirt,
  Palette,
  Cpu,
  Newspaper,
  Globe2,
  Drama,
} from "lucide-react";
import Reveal from "./Reveal";

const disciplines = [
  {
    name: "Film",
    description:
      "Stories, production, screen culture, and the people shaping African cinema.",
    icon: Film,
    accent: "#B80319",
  },
  {
    name: "Music",
    description:
      "Artists, producers, executives, and new sounds moving across borders.",
    icon: Music2,
    accent: "#E59200",
  },
  {
    name: "Fashion",
    description:
      "Designers, brands, stylists, and the creative business behind African fashion.",
    icon: Shirt,
    accent: "#00A5A8",
  },
  {
    name: "Art",
    description:
      "Visual artists, galleries, collectors, and new ways of seeing Africa.",
    icon: Palette,
    accent: "#B80319",
  },
  {
    name: "Media",
    description:
      "Publishers, journalists, platforms, and storytellers amplifying creative voices.",
    icon: Newspaper,
    accent: "#00A5A8",
  },
  {
    name: "Technology",
    description:
      "Digital creators, platforms, innovation, and technology enabling creative growth.",
    icon: Cpu,
    accent: "#E59200",
  },
  {
    name: "Dance & Performance",
    description:
      "Movement, live performance, stagecraft, and the artists bringing stories to life.",
    icon: Drama,
    accent: "#B80319",
  },
  {
    name: "Culture",
    description:
      "Ideas, identity, heritage, and the cultural forces connecting the ecosystem.",
    icon: Globe2,
    accent: "#E59200",
  },
];

export default function CreativeEcosystem() {
  return (
    <section
      id="ecosystem"
      className="relative overflow-hidden border-b border-white/10 bg-[#11152F]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 top-20 h-72 w-72 rounded-full border border-[#E59200]/10"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 bottom-20 h-52 w-52 rounded-full border border-[#00A5A8]/10"
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
                  Creative Ecosystem
                </span>
              </div>
            </Reveal>

            <Reveal delay={80}>
              <h2 className="max-w-xl font-display text-4xl leading-[1.02] text-[#F5EFE6] sm:text-5xl lg:text-6xl">
                Where creative worlds meet.
              </h2>
            </Reveal>
          </div>

          <Reveal delay={140}>
            <p className="max-w-2xl text-base leading-relaxed text-[#B8B3AA]/75 sm:text-lg">
              AFRIQA brings different parts of the creative economy into one
              connected space — creating room for collaboration, discovery,
              investment, and new opportunities.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid auto-rows-fr gap-px overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {disciplines.map((discipline, index) => {
            const Icon = discipline.icon;

            return (
              <Reveal key={discipline.name} delay={80 + index * 60}>
                <div className="group relative flex h-full min-h-[250px] flex-col bg-[#151A3A] p-7 transition-colors duration-300 hover:bg-[#191F43]">
                  <div
                    aria-hidden="true"
                    className="absolute left-0 top-0 h-px w-0 transition-all duration-500 group-hover:w-full"
                    style={{ backgroundColor: discipline.accent }}
                  />

                  <div className="flex items-start justify-between">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-full border"
                      style={{
                        borderColor: `${discipline.accent}40`,
                      }}
                    >
                      <Icon
                        className="h-5 w-5"
                        style={{ color: discipline.accent }}
                        strokeWidth={1.5}
                      />
                    </div>

                    <span className="text-[10px] font-semibold tracking-[0.2em] text-[#F5EFE6]/20">
                      0{index + 1}
                    </span>
                  </div>

                  <div className="mt-auto pt-10">
                    <h3 className="font-display text-2xl text-[#F5EFE6]">
                      {discipline.name}
                    </h3>

                    <p className="mt-3 text-sm leading-relaxed text-[#B8B3AA]/65">
                      {discipline.description}
                    </p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={560}>
          <div className="mt-12 flex flex-col gap-5 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl font-display text-xl leading-snug text-[#F5EFE6]/80 sm:text-2xl">
              Different disciplines. One connected creative economy.
            </p>

            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-[#E59200]" />
              <span className="text-[10px] uppercase tracking-[0.28em] text-[#F5EFE6]/35">
                Abuja · Africa
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}