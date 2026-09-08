"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { event } from "@/lib/content";

const SLIDES = [
  { text: "Two Days. One Ecosystem.", color: "text-red", hex: "#B80319" },
  {
    text: "Film × Music × Fashion × Tech",
    color: "text-gold",
    hex: "#E59200",
  },
  {
    text: "Creativity. Connection. Capital.",
    color: "text-teal",
    hex: "#00A5A8",
  },
];

const SLIDE_DURATION = 3200;

// Add your hero image here.
// File location:
// /public/images/hero-showcase.jpg
const HERO_IMAGE = "/images/hero-showcase.jpg";

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
          transitionDuration:
            state === "active" ? `${duration}ms` : "0ms",
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
    <section className="relative min-h-[calc(100vh-104px)] border-b border-white/10">
      {/* =====================================================
          BACKGROUND ATMOSPHERE
      ====================================================== */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Very subtle ambient lighting */}
        <div className="absolute -right-40 -top-40 h-[650px] w-[650px] rounded-full bg-red/5 blur-[150px]" />

        <div className="absolute -bottom-40 right-0 h-[500px] w-[500px] rounded-full bg-teal/5 blur-[150px]" />

        {/* =================================================
            HERO IMAGE

            Put your image at:
            /public/images/hero-showcase.jpg

            It sits on the RIGHT side and fades naturally
            into the dark background.
        ================================================== */}

        {HERO_IMAGE && (
          <div className="absolute inset-x-0 top-0 h-[calc(100vh-104px)] lg:inset-y-0 lg:left-auto lg:right-0 lg:h-full lg:w-[58%]">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-[0.18] lg:opacity-[0.32] motion-safe:animate-image-drift"
              style={{
                backgroundImage: `url(${HERO_IMAGE})`,
              }}
            />

            {/* Left fade */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#110d0d] via-[#110d0d]/60 to-transparent" />

            {/* Bottom fade */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#110d0d] via-transparent to-[#110d0d]/20" />

            {/* Slight cinematic wash */}
            <div className="absolute inset-0 bg-black/15" />
          </div>
        )}

        {/* =================================================
            FLOATING DETAILS
        ================================================== */}

        <span className="hero-particle particle-1">✦</span>
        <span className="hero-particle particle-2">+</span>
        <span className="hero-particle particle-3">○</span>
        <span className="hero-particle particle-4">✧</span>
        <span className="hero-particle particle-5">·</span>
        <span className="hero-particle particle-6">+</span>
        <span className="hero-particle particle-7">✦</span>
      </div>

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-10 md:pb-28 md:pt-16">
        {/* Organizer */}
        <p className="mb-6 text-sm text-muted motion-safe:animate-fade-up">
          Organized by{" "}
          <a
            href="https://www.afrigos-academy.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cream underline underline-offset-4 transition-colors hover:text-gold"
          >
            {event.organizer}
          </a>
        </p>

        {/* Main heading */}
        <h1 className="max-w-3xl font-display text-5xl leading-[1.05] text-cream motion-safe:animate-fade-up sm:text-6xl md:text-7xl">
          {event.name}
        </h1>

        {/* Tagline */}
        <p className="mt-6 max-w-xl font-display text-2xl italic text-gold motion-safe:animate-fade-up sm:text-3xl">
          {event.tagline}
        </p>

        {/* Tricolor rule */}
        <div className="mt-4 tricolor-rule motion-safe:animate-fade-up">
          <span />
          <span />
          <span />
        </div>

        {/* Event identity */}
        <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs uppercase tracking-[0.2em] text-muted motion-safe:animate-fade-up">
          <span>Abuja, Nigeria</span>

          <span className="h-1 w-1 rounded-full bg-gold" />

          <span>Creative Industries</span>

          <span className="h-1 w-1 rounded-full bg-teal" />

          <span>2026</span>
        </div>

        {/* =================================================
            SLIDESHOW
        ================================================== */}

        <div className="mt-4 min-h-[52px] max-w-xl">
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
                state={
                  i < active
                    ? "done"
                    : i === active
                    ? "active"
                    : "pending"
                }
                duration={SLIDE_DURATION}
              />
            ))}
          </div>
        </div>

        {/* =================================================
            CTA
        ================================================== */}

        <div className="mt-5 flex flex-wrap gap-4 motion-safe:animate-fade-up">
          <Link
            href="/register"
            className="group rounded-full bg-red px-7 py-3.5 text-sm font-medium text-cream shadow-[0_10px_35px_rgba(184,3,25,0.18)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:shadow-[0_15px_45px_rgba(184,3,25,0.28)]"
          >
            Register your interest
            <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>

          <a
            href="#programme"
            className="group rounded-full border px-7 py-3.5 text-sm font-medium text-cream transition-all duration-500 hover:-translate-y-1 hover:bg-white/5"
            style={{
              borderColor: reducedMotion
                ? "rgba(255,255,255,0.2)"
                : activeHex,
            }}
          >
            See the programme
            <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-y-1">
              ↓
            </span>
          </a>
        </div>

        {/* Live ecosystem indicator */}
        <div className="mt-10 hidden items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-muted md:flex">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal opacity-50" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-teal" />
          </span>

          <span>Connecting Abuja's creative ecosystem</span>
        </div>
      </div>

      {/* =====================================================
          MOVING CREATIVE INDUSTRIES TICKER
      ====================================================== */}

      <div className="absolute bottom-0 left-0 z-20 w-full overflow-hidden border-t border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="hero-marquee flex w-max items-center py-3">
          {[...Array(2)].map((_, group) => (
            <div
              key={group}
              className="flex items-center whitespace-nowrap"
            >
              <span className="mx-5 text-xs uppercase tracking-[0.25em] text-muted">
                Film
              </span>

              <span className="text-gold">✦</span>

              <span className="mx-5 text-xs uppercase tracking-[0.25em] text-muted">
                Music
              </span>

              <span className="text-red">✦</span>

              <span className="mx-5 text-xs uppercase tracking-[0.25em] text-muted">
                Fashion
              </span>

              <span className="text-teal">✦</span>

              <span className="mx-5 text-xs uppercase tracking-[0.25em] text-muted">
                Art
              </span>

              <span className="text-gold">✦</span>

              <span className="mx-5 text-xs uppercase tracking-[0.25em] text-muted">
                Technology
              </span>

              <span className="text-red">✦</span>

              <span className="mx-5 text-xs uppercase tracking-[0.25em] text-muted">
                Media
              </span>

              <span className="text-teal">✦</span>

              <span className="mx-5 text-xs uppercase tracking-[0.25em] text-muted">
                Culture
              </span>

              <span className="text-gold">✦</span>
            </div>
          ))}
        </div>
      </div>

      {/* =====================================================
          ANIMATIONS
      ====================================================== */}

      <style jsx>{`
        @keyframes imageDrift {
          0%,
          100% {
            transform: scale(1);
          }

          50% {
            transform: scale(1.035);
          }
        }

        @keyframes particleFloat {
          0%,
          100% {
            transform: translate3d(0, 0, 0) rotate(0deg);
            opacity: 0.2;
          }

          50% {
            transform: translate3d(0, -18px, 0) rotate(8deg);
            opacity: 0.7;
          }
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes marquee {
          from {
            transform: translateX(0);
          }

          to {
            transform: translateX(-50%);
          }
        }

        :global(.animate-image-drift) {
          animation: imageDrift 14s ease-in-out infinite;
        }

        :global(.animate-fade-up) {
          animation: fadeUp 0.8s ease-out both;
        }

        .hero-particle {
          position: absolute;
          z-index: 2;
          pointer-events: none;
          font-family: serif;
          font-size: 18px;
          color: rgba(255, 255, 255, 0.5);
          animation: particleFloat 5s ease-in-out infinite;
        }

        .particle-1 {
          right: 38%;
          top: 19%;
        }

        .particle-2 {
          right: 12%;
          top: 28%;
          color: rgba(229, 146, 0, 0.7);
          animation-delay: 1.2s;
        }

        .particle-3 {
          right: 31%;
          top: 46%;
          font-size: 12px;
          color: rgba(0, 165, 168, 0.7);
          animation-delay: 2s;
        }

        .particle-4 {
          right: 8%;
          top: 62%;
          animation-delay: 0.8s;
        }

        .particle-5 {
          right: 43%;
          top: 68%;
          color: rgba(184, 3, 25, 0.8);
          animation-delay: 2.5s;
        }

        .particle-6 {
          right: 25%;
          top: 14%;
          font-size: 11px;
          animation-delay: 1.7s;
        }

        .particle-7 {
          right: 18%;
          top: 78%;
          color: rgba(0, 165, 168, 0.7);
          animation-delay: 3s;
        }

        .hero-marquee {
          animation: marquee 28s linear infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          :global(.animate-image-drift),
          :global(.animate-fade-up),
          .hero-particle,
          .hero-marquee {
            animation: none !important;
          }
        }

        @media (max-width: 767px) {
          .hero-particle {
            display: none;
          }
        }
      `}</style>
    </section>
  );
}
