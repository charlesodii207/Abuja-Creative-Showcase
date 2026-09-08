"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { event } from "@/lib/content";

const SLIDES = [
  { text: "Two Days. One Ecosystem.", color: "text-red", hex: "#B80319" },
  { text: "Film × Music × Fashion × Tech", color: "text-gold", hex: "#E59200" },
  { text: "Creativity. Connection. Capital.", color: "text-teal", hex: "#00A5A8" },
];

const SLIDE_DURATION = 3200; // ms

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = () => setReduced(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

function ProgressSegment({
  colorClass,
  state,
  duration,
}: {
  colorClass: string;
  state: "done" | "active" | "pending";
  duration: number;
}) {
  const [filled, setFilled] = useState(state === "done");

  useEffect(() => {
    if (state === "active") {
      setFilled(false);
      const raf1 = requestAnimationFrame(() => {
        const raf2 = requestAnimationFrame(() => setFilled(true));
        return () => cancelAnimationFrame(raf2);
      });
      return () => cancelAnimationFrame(raf1);
    }
    setFilled(state === "done");
  }, [state]);

  return (
    <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/15">
      <div
        className={`h-full rounded-full ${colorClass} motion-reduce:transition-none`}
        style={{
          width: filled ? "100%" : "0%",
          transitionProperty: "width",
          transitionTimingFunction: "linear",
          transitionDuration: state === "active" ? `${duration}ms` : "0ms",
        }}
      />
    </div>
  );
}

export default function Hero() {
  const [active, setActive] = useState(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % SLIDES.length);
    }, SLIDE_DURATION);
    return () => clearInterval(interval);
  }, [reducedMotion]);

  const activeHex = SLIDES[active].hex;

  return (
    <section className="relative overflow-hidden border-b border-white/10">
      <div className="pointer-events-none absolute -right-20 -top-14 h-56 w-56 opacity-25 blur-2xl md:-right-10 md:top-10 md:h-[420px] md:w-[420px] md:opacity-90 md:blur-[2px]">
        <div
          className="absolute h-64 w-64 rounded-full bg-red/80 motion-safe:animate-drift-a"
          style={{ top: 0, left: 40 }}
        />

        <div
          className="absolute h-64 w-64 rounded-full bg-gold/80 mix-blend-screen motion-safe:animate-drift-b"
          style={{ top: 90, left: 160 }}
        />

        <div
          className="absolute h-64 w-64 rounded-full bg-teal/80 mix-blend-screen motion-safe:animate-drift-c"
          style={{ top: 170, left: 30 }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-16 md:pb-32 md:pt-24">
        <p className="mb-6 text-sm text-muted">
          Organized by{" "}
          <a
            href="https://www.afrigos-academy.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cream underline underline-offset-4 hover:text-gold"
          >
            {event.organizer}
          </a>
        </p>

        <h1 className="max-w-3xl font-display text-5xl leading-[1.05] text-cream sm:text-6xl md:text-7xl">
          {event.name}
        </h1>

        <p className="mt-6 max-w-xl font-display text-2xl italic text-gold sm:text-3xl">
          {event.tagline}
        </p>

        <div className="mt-4 tricolor-rule">
          <span />
          <span />
          <span />
        </div>

        {/* Slideshow — replaces the static Dates / Location row */}
        <div className="mt-10 min-h-[68px] max-w-xl">
          <div className="relative h-9 sm:h-10">
            {SLIDES.map((slide, i) => (
              <p
                key={slide.text}
                aria-hidden={i !== active}
                className={`absolute inset-0 font-display text-2xl font-semibold sm:text-[1.7rem] ${
                  slide.color
                } transition-all duration-500 ease-out motion-reduce:transition-none ${
                  i === active
                    ? "translate-y-0 opacity-100"
                    : "pointer-events-none translate-y-3 opacity-0"
                }`}
              >
                {slide.text}
              </p>
            ))}
          </div>

          <div className="mt-4 flex w-64 gap-1.5" role="presentation">
            {SLIDES.map((slide, i) => (
              <ProgressSegment
                key={slide.text}
                colorClass={
                  slide.color === "text-red"
                    ? "bg-red"
                    : slide.color === "text-gold"
                    ? "bg-gold"
                    : "bg-teal"
                }
                state={i < active ? "done" : i === active ? "active" : "pending"}
                duration={SLIDE_DURATION}
              />
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/register"
            className="rounded-full bg-red px-7 py-3.5 text-sm font-medium text-cream transition-transform hover:scale-105"
          >
            Register your interest
          </Link>

          <a
            href="#programme"
            className="rounded-full border px-7 py-3.5 text-sm font-medium text-cream transition-colors duration-700"
            style={{ borderColor: reducedMotion ? "rgba(255,255,255,0.2)" : activeHex }}
          >
            See the programme
          </a>
        </div>
      </div>
    </section>
  );
}
