import { Link } from "react-router-dom";
import { event } from "@/lib/content";

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-white/10">
      {/* Convergence device: three brand-colour discs overlapping, echoing
          the "Film × Music × Fashion × Technology × Finance" cross-pollination
          idea from the concept note. Deliberately off-canvas, not centered. */}
      <div className="pointer-events-none absolute -right-24 -top-16 h-[420px] w-[420px] opacity-90 md:-right-10 md:top-10">
        <div className="absolute h-64 w-64 rounded-full bg-red/80 blur-[2px]" style={{ top: 0, left: 40 }} />
        <div className="absolute h-64 w-64 rounded-full bg-gold/80 mix-blend-screen blur-[2px]" style={{ top: 90, left: 160 }} />
        <div className="absolute h-64 w-64 rounded-full bg-teal/80 mix-blend-screen blur-[2px]" style={{ top: 170, left: 30 }} />
      </div>

      <div className="mx-auto max-w-6xl px-6 pb-24 pt-16 md:pb-32 md:pt-24">
        <p className="mb-6 text-sm text-muted">
          Organized by <span className="text-cream">{event.organizer}</span>
        </p>

        <h1 className="max-w-3xl font-display text-5xl leading-[1.05] text-cream sm:text-6xl md:text-7xl">
          {event.name}
        </h1>

        <p className="mt-6 max-w-xl font-display text-2xl italic text-gold sm:text-3xl">
          {event.tagline}
        </p>

        <div className="mt-4 tricolor-rule">
          <span /><span /><span />
        </div>

        <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-3 text-sm">
          <div>
            <dt className="text-muted">Dates</dt>
            <dd className="mt-1 text-cream">{event.dates}</dd>
          </div>
          <div>
            <dt className="text-muted">Location</dt>
            <dd className="mt-1 text-cream">{event.venue}</dd>
          </div>
        </dl>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            to="/register"
            className="rounded-full bg-red px-7 py-3.5 text-sm font-medium text-cream transition-transform hover:scale-105"
          >
            Register your interest
          </Link>
          <a
            href="#programme"
            className="rounded-full border border-white/20 px-7 py-3.5 text-sm font-medium text-cream transition-colors hover:border-white/40"
          >
            See the programme
          </a>
        </div>
      </div>
    </section>
  );
}
