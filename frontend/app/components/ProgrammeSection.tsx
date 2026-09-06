import { programme } from "@/lib/content";

export default function ProgrammeSection() {
  return (
    <section id="programme" className="border-b border-white/10">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="tricolor-rule mb-6">
          <span /><span /><span />
        </div>
        <h2 className="font-display text-3xl text-cream sm:text-4xl">
          Two days, two moods
        </h2>
        <p className="mt-3 max-w-xl text-muted">
          Day One is about discovery and connection. Day Two turns that into
          pitches, deals, and a closing celebration.
        </p>

        <div className="mt-14 grid gap-x-10 gap-y-16 md:grid-cols-2">
          {programme.map((day) => (
            <div key={day.day}>
              <p className="text-sm text-teal">{day.day}</p>
              <h3 className="mt-1 font-display text-2xl text-cream">
                {day.title}
              </h3>

              <ol className="mt-8 space-y-6 border-l border-white/10 pl-6">
                {day.sessions.map((session) => (
                  <li key={session.label} className="relative">
                    <span className="absolute -left-[27px] top-1.5 h-2 w-2 rounded-full bg-gold" />
                    <p className="text-xs text-teal">{session.time}</p>
                    <p className="mt-1 font-medium text-cream">
                      {session.label}
                    </p>
                    <p className="mt-1 text-sm text-muted">{session.detail}</p>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}