import Reveal from "./Reveal";

const programme = [
  {
    day: "DAY ONE",
    title: "Discover & Connect",
    time: "09:00am - 07:00pm",
    sessions: [
      "Opening Ceremony & Market Opening",
      "Creative Industry Conversations",
      "Creative Finance Forum",
      "Film & Creative Showcase",
      "All-Day Film Screening",
      "Music Performances",
      "Evening Reception & Performances",
    ],
  },
  {
    day: "DAY TWO",
    title: "Create, Pitch & Transact",
    time: "08:00am - 07:00pm",
    sessions: [
      "Masterclasses & Workshops",
      "Pitch & Deal Room",
      "Knowledge Programme + Market",
      "Fashion & Art Showcase",
      "Creative Finance Forum",
      "Market",
      "ACS Live Concert & Awards",
    ],
  },
];

export default function ProgrammeSection() {
  return (
    <section
      id="programme"
      className="relative overflow-hidden border-b border-white/10 bg-[#11152F]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-24 h-64 w-64 rounded-full border border-[#E59200]/10"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 bottom-24 h-44 w-44 rounded-full border border-[#00A5A8]/10"
      />

      <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 md:py-28 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div>
            <Reveal>
              <div className="mb-6 flex items-center gap-4">
                <div className="tricolor-rule">
                  <span />
                  <span />
                  <span />
                </div>

                <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#F5EFE6]/45">
                  Programme
                </span>
              </div>
            </Reveal>

            <Reveal delay={80}>
              <h2 className="max-w-xl font-display text-4xl leading-[1.02] text-[#F5EFE6] sm:text-5xl lg:text-6xl">
                Two days. One creative ecosystem.
              </h2>
            </Reveal>
          </div>

          <Reveal delay={140}>
            <p className="max-w-2xl text-base leading-relaxed text-[#B8B3AA]/75 sm:text-lg">
              Discover, connect, create, pitch, transact, and celebrate across
              two days of programming at ACS.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-px overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 md:grid-cols-2">
          {programme.map((day, dayIndex) => (
            <Reveal
              key={day.day}
              delay={240 + dayIndex * 120}
              distance={36}
            >
              <div className="group relative h-full bg-[#151A3A] p-7 sm:p-9 lg:p-10">
                <div
                  aria-hidden="true"
                  className={`absolute left-0 top-0 h-1 w-full ${
                    dayIndex === 0 ? "bg-[#E59200]" : "bg-[#B80319]"
                  }`}
                />

                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p
                      className={`text-[10px] font-semibold uppercase tracking-[0.25em] ${
                        dayIndex === 0
                          ? "text-[#E59200]"
                          : "text-[#B80319]"
                      }`}
                    >
                      {day.day}
                    </p>

                    <h3 className="mt-2 font-display text-3xl leading-tight text-[#F5EFE6] sm:text-4xl">
                      {day.title}
                    </h3>

                    <p className="mt-4 text-sm font-medium tracking-wide text-[#00A5A8]">
                      {day.time}
                    </p>
                  </div>

                  <span className="text-5xl font-display leading-none text-[#F5EFE6]/[0.05]">
                    0{dayIndex + 1}
                  </span>
                </div>

                <div className="mt-7 h-px w-16 bg-white/15" />

                <ol className="mt-9 space-y-7 border-l border-white/10 pl-7">
                  {day.sessions.map((session, sessionIndex) => (
                    <Reveal
                      key={session}
                      delay={320 + dayIndex * 120 + sessionIndex * 70}
                      distance={20}
                    >
                      <li className="group/session relative">
                        <span
                          className={`absolute -left-[31px] top-1.5 h-2.5 w-2.5 rounded-full transition-transform duration-300 group-hover/session:scale-150 ${
                            dayIndex === 0
                              ? "bg-[#E59200]"
                              : "bg-[#B80319]"
                          }`}
                        />

                        <p className="font-medium leading-relaxed text-[#F5EFE6] transition-transform duration-300 group-hover/session:translate-x-1">
                          {session}
                        </p>
                      </li>
                    </Reveal>
                  ))}
                </ol>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={560}>
          <div className="mt-12 flex flex-col gap-5 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl font-display text-xl leading-snug text-[#F5EFE6]/80 sm:text-2xl">
              From discovery and connection to pitches, deals, and celebration.
            </p>

            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-[#00A5A8]" />

              <span className="text-[10px] uppercase tracking-[0.28em] text-[#F5EFE6]/35">
                04–05 December · Abuja
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}