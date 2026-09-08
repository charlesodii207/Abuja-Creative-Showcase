import { programme } from "@/lib/content";
import Reveal from "./Reveal";

export default function ProgrammeSection() {
  return (
    <section id="programme" className="border-b border-white/10">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
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
            Two days, two moods
          </h2>
        </Reveal>

        <Reveal delay={160}>
          <p className="mt-3 max-w-xl text-muted">
            Day One is about discovery and connection. Day Two turns that into
            pitches, deals, and a closing celebration.
          </p>
        </Reveal>

        {/* Programme */}
        <div className="mt-14 grid gap-x-10 gap-y-16 md:grid-cols-2">
          {programme.map((day, dayIndex) => (
            <Reveal
              key={day.day}
              delay={240 + dayIndex * 120}
              distance={36}
            >
              <div>
                {/* Day heading */}
                <div className="relative">
                  <p className="text-sm text-teal">{day.day}</p>

                  <h3 className="mt-1 font-display text-2xl text-cream">
                    {day.title}
                  </h3>

                  {/* Small editorial accent */}
                  <div className="mt-4 h-px w-12 bg-gold/60" />
                </div>

                {/* Timeline */}
                <ol className="mt-8 space-y-6 border-l border-white/10 pl-6">
                  {day.sessions.map((session, sessionIndex) => (
                    <Reveal
                      key={session.label}
                      delay={320 + dayIndex * 120 + sessionIndex * 90}
                      distance={20}
                    >
                      <li className="group relative">
                        {/* Timeline dot */}
                        <span className="absolute -left-[27px] top-1.5 h-2 w-2 rounded-full bg-gold transition-transform duration-300 group-hover:scale-150" />

                        {/* Time */}
                        <p className="text-xs text-teal">
                          {session.time}
                        </p>

                        {/* Session */}
                        <p className="mt-1 font-medium text-cream transition-transform duration-300 group-hover:translate-x-1">
                          {session.label}
                        </p>

                        {/* Detail */}
                        <p className="mt-1 max-w-md text-sm leading-relaxed text-muted">
                          {session.detail}
                        </p>
                      </li>
                    </Reveal>
                  ))}
                </ol>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}