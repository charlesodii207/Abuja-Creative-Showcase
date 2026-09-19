"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { event } from "@/lib/content";

const SLIDES = [
  {
    image: "/images/hero-01.webp",
    text: "Two Days. One Ecosystem.",
    color: "text-red",
    hex: "#B80319",
  },
  {
    image: "/images/hero-02.webp",
    text: "Film × Music × Fashion × Tech",
    color: "text-gold",
    hex: "#E59200",
  },
  {
    image: "/images/hero-03.webp",
    text: "Creativity. Connection. Capital.",
    color: "text-teal",
    hex: "#00A5A8",
  },
  {
    image: "/images/hero-04.webp",
    text: "Where African Creativity Meets Opportunity.",
    color: "text-red",
    hex: "#B80319",
  },
  {
    image: "/images/hero-05.webp",
    text: "Abuja. Africa. The Future.",
    color: "text-gold",
    hex: "#E59200",
  },
  {
    image: "/images/hero-06.webp",
    text: "Ideas. Talent. Opportunity.",
    color: "text-teal",
    hex: "#00A5A8",
  },
] as const;

const SLIDE_DURATION = 5200;

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
  resetKey,
}: {
  colorClass: string;
  state: "done" | "active" | "pending";
  duration: number;
  resetKey: string;
}) {
  const [filled, setFilled] = useState(state === "done");

  useEffect(() => {
    if (state === "active") {
      setFilled(false);

      const raf1 = requestAnimationFrame(() => {
        const raf2 = requestAnimationFrame(() => {
          setFilled(true);
        });

        return () => cancelAnimationFrame(raf2);
      });

      return () => cancelAnimationFrame(raf1);
    }

    setFilled(state === "done");
  }, [state, resetKey]);

  return (
    <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/20">
      <div
        className={`h-full rounded-full ${colorClass} motion-reduce:transition-none`}
        style={{
          width: filled ? "100%" : "0%",
          transitionProperty: "width",
          transitionTimingFunction: "linear",
          transitionDuration:
            state === "active" ? `${duration}ms` : "300ms",
        }}
      />
    </div>
  );
}

export default function Hero() {
  const [active, setActive] = useState(0);
  const reducedMotion = useReducedMotion();

  const [readyIndices, setReadyIndices] = useState<Set<number>>(
    () => new Set([0])
  );

  const markReady = (index: number) => {
    setReadyIndices((prev) => {
      if (prev.has(index)) return prev;

      const next = new Set(prev);
      next.add(index);

      return next;
    });
  };

  useEffect(() => {
    const timers: number[] = [];

    SLIDES.forEach((_, index) => {
      if (index === 0) return;

      const delay = index === 1 ? 150 : 600 + index * 500;

      timers.push(
        window.setTimeout(() => {
          markReady(index);
        }, delay)
      );
    });

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % SLIDES.length);
    }, SLIDE_DURATION);

    return () => clearInterval(interval);
  }, [reducedMotion]);

  const activeSlide = SLIDES[active];
  const activeHex = activeSlide.hex;

  const activeBar = active % 3;
  const cycle = Math.floor(active / 3);

  return (
    <section className="relative min-h-[60vh] overflow-hidden border-b border-white/10 bg-[#11152F] md:min-h-[calc(100vh-104px)]">
      {/* =====================================================
          CINEMATIC SLIDESHOW BACKGROUND
      ====================================================== */}

      <div className="pointer-events-none absolute inset-0">
        {SLIDES.map((slide, index) => {
          const isActive = index === active;
          const isReady = readyIndices.has(index);

          return (
            <div
              key={slide.image}
              className={`absolute inset-0 transition-opacity duration-[1200ms] ease-in-out ${
                isActive ? "z-[1] opacity-100" : "z-0 opacity-0"
              }`}
            >
              <div className="absolute inset-[-5%]">
                <div
                  className={`absolute inset-0 ${
                    isActive && !reducedMotion
                      ? "hero-image-drift"
                      : ""
                  }`}
                >
                  {isReady && (
                    <Image
                      src={slide.image}
                      alt=""
                      aria-hidden="true"
                      fill
                      sizes="100vw"
                      quality={75}
                      priority={index === 0}
                      loading={index === 0 ? undefined : "lazy"}
                      className="object-cover object-center"
                    />
                  )}
                </div>
              </div>

              {/* Light overall navy tint */}
              <div className="absolute inset-0 bg-[#11152F]/10" />

              {/* Navy readability gradient — concentrated on content side */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#11152F]/85 via-[#11152F]/35 to-transparent" />

              {/* Subtle bottom fade */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#11152F]/65 via-[#11152F]/10 to-transparent" />

              {/* Very subtle cinematic depth */}
              <div className="absolute inset-0 bg-black/5" />
            </div>
          );
        })}

        {/* =================================================
            AMBIENT COLOR GLOW
        ================================================== */}

        <div
          className="absolute -right-32 -top-32 z-[2] h-[600px] w-[600px] rounded-full blur-[150px] transition-colors duration-1000"
          style={{
            backgroundColor: `${activeHex}12`,
          }}
        />

        <div className="absolute -bottom-40 right-0 z-[2] h-[500px] w-[500px] rounded-full bg-[#00A5A8]/[0.06] blur-[150px]" />

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

      <div className="relative z-10 mx-auto flex min-h-[60vh] max-w-7xl flex-col px-6 pb-24 pt-5 md:min-h-[calc(100vh-104px)] md:px-10 md:pb-32 md:pt-12 lg:px-12">
        {/* =================================================
            ORGANIZER
        ================================================== */}

        <div className="hero-intro hero-intro-1">
          <p className="mb-3 text-xs text-white/60 md:mb-5 md:text-sm">
            Organized by{" "}
            <a
              href="https://www.afrigos-academy.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#F5EFE6] underline decoration-white/30 underline-offset-4 transition-colors hover:text-[#E59200]"
            >
              {event.organizer}
            </a>
          </p>
        </div>

        {/* =================================================
            MAIN CONTENT
        ================================================== */}

        <div className="my-auto max-w-4xl py-5 md:py-12">
          <div className="hero-title-wrap">
            <h1 className="hero-title max-w-4xl font-display text-4xl leading-[0.95] tracking-[-0.025em] text-[#F5EFE6] drop-shadow-2xl sm:text-6xl md:text-7xl lg:text-8xl">
              {event.name}
            </h1>
          </div>

          {/* Tagline */}

          <div className="hero-intro hero-intro-3">
            <p className="mt-3 max-w-2xl font-display text-xl italic text-[#E59200] drop-shadow-lg sm:mt-6 sm:text-3xl md:text-4xl">
              {event.tagline}
            </p>
          </div>

          {/* Tricolor rule */}

          <div className="hero-rule mt-4 flex h-[3px] w-28 overflow-hidden rounded-full sm:mt-5 sm:w-32">
            <span className="flex-1 bg-[#B80319]" />
            <span className="flex-1 bg-[#E59200]" />
            <span className="flex-1 bg-[#00A5A8]" />
          </div>

          {/* Event information */}

          <div className="hero-intro hero-intro-5 mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] uppercase tracking-[0.16em] text-white/65 sm:mt-7 sm:gap-x-4 sm:gap-y-2 sm:text-xs sm:tracking-[0.2em]">
            <span>Abuja, Nigeria</span>

            <span className="h-1 w-1 rounded-full bg-[#E59200]" />

            <span>December 4–5, 2026</span>
          </div>

          {/* =================================================
              ANIMATED SLIDE MESSAGE
          ================================================== */}

          <div className="hero-slide-message mt-4 min-h-[82px] max-w-2xl sm:mt-7 sm:min-h-[120px]">
            <div className="relative h-[48px] overflow-hidden sm:h-[60px]">
              <p
                key={active}
                className={`absolute inset-0 font-display text-xl font-semibold leading-tight ${
                  activeSlide.color
                } ${reducedMotion ? "" : "animate-hero-text-in"} sm:text-3xl`}
              >
                {activeSlide.text}
              </p>
            </div>

            {/* =================================================
                3-BAR PROGRESS SYSTEM
            ================================================== */}

            <div className="mt-3 flex w-full max-w-[280px] gap-1.5 sm:mt-4 sm:max-w-[340px]">
              {[0, 1, 2].map((barIndex) => {
                const barColor =
                  barIndex === 0
                    ? "bg-[#B80319]"
                    : barIndex === 1
                      ? "bg-[#E59200]"
                      : "bg-[#00A5A8]";

                let state: "done" | "active" | "pending";

                if (barIndex < activeBar) {
                  state = "done";
                } else if (barIndex === activeBar) {
                  state = "active";
                } else {
                  state = "pending";
                }

                return (
                  <ProgressSegment
                    key={`${cycle}-${barIndex}`}
                    colorClass={barColor}
                    state={state}
                    duration={SLIDE_DURATION}
                    resetKey={`${cycle}-${barIndex}`}
                  />
                );
              })}
            </div>
          </div>

          {/* =================================================
              CTA
          ================================================== */}

          <div className="hero-cta mt-2 flex flex-wrap gap-3 sm:mt-4 sm:gap-4">
            <Link
              href="/register"
              className="group rounded-full bg-[#B80319] px-5 py-3 text-xs font-medium text-[#F5EFE6] shadow-[0_10px_35px_rgba(184,3,25,0.25)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:bg-[#d00620] hover:shadow-[0_15px_45px_rgba(184,3,25,0.4)] sm:px-7 sm:py-3.5 sm:text-sm"
            >
              Register

              <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>

            <a
              href="#programme"
              className="group rounded-full border bg-[#11152F]/10 px-5 py-3 text-xs font-medium text-[#F5EFE6] backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:bg-white/10 sm:px-7 sm:py-3.5 sm:text-sm"
              style={{
                borderColor: reducedMotion
                  ? "rgba(255,255,255,0.25)"
                  : activeHex,
              }}
            >
              See the programme

              <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-y-1">
                ↓
              </span>
            </a>
          </div>
        </div>

        {/* =================================================
            LIVE ECOSYSTEM INDICATOR
        ================================================== */}

        <div className="hero-ecosystem hidden items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-white/50 md:flex">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00A5A8] opacity-50" />

            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00A5A8]" />
          </span>

          <span>Connecting Abuja&apos;s creative ecosystem</span>
        </div>
      </div>

      {/* =====================================================
          IMAGE NAVIGATION INDICATORS
      ====================================================== */}

      <div className="absolute right-6 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-3 md:flex lg:right-10">
        {SLIDES.map((slide, index) => (
          <button
            key={slide.image}
            type="button"
            aria-label={`View slide ${index + 1}`}
            aria-current={index === active ? "true" : undefined}
            onClick={() => {
              markReady(index);
              setActive(index);
            }}
            className="group flex items-center gap-3"
          >
            <span
              className={`h-1 rounded-full transition-all duration-500 ${
                index === active ? "w-10" : "w-4"
              }`}
              style={{
                backgroundColor:
                  index === active
                    ? slide.hex
                    : "rgba(255,255,255,0.3)",
              }}
            />

            <span
              className={`text-[9px] tracking-[0.2em] transition-opacity duration-300 ${
                index === active
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-70"
              }`}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
          </button>
        ))}
      </div>

      {/* =====================================================
          MOVING CREATIVE INDUSTRIES TICKER
      ====================================================== */}

      <div className="absolute bottom-0 left-0 z-20 w-full overflow-hidden border-t border-white/10 bg-[#11152F]/45 backdrop-blur-md">
        <div className="hero-marquee flex w-max items-center py-2.5 sm:py-3">
          {[...Array(2)].map((_, group) => (
            <div
              key={group}
              className="flex items-center whitespace-nowrap"
            >
              <span className="mx-4 text-[10px] uppercase tracking-[0.2em] text-white/55 sm:mx-5 sm:text-xs sm:tracking-[0.25em]">
                Film
              </span>

              <span className="text-[#E59200]">✦</span>

              <span className="mx-4 text-[10px] uppercase tracking-[0.2em] text-white/55 sm:mx-5 sm:text-xs sm:tracking-[0.25em]">
                Music
              </span>

              <span className="text-[#B80319]">✦</span>

              <span className="mx-4 text-[10px] uppercase tracking-[0.2em] text-white/55 sm:mx-5 sm:text-xs sm:tracking-[0.25em]">
                Fashion
              </span>

              <span className="text-[#00A5A8]">✦</span>

              <span className="mx-4 text-[10px] uppercase tracking-[0.2em] text-white/55 sm:mx-5 sm:text-xs sm:tracking-[0.25em]">
                Art
              </span>

              <span className="text-[#E59200]">✦</span>

              <span className="mx-4 text-[10px] uppercase tracking-[0.2em] text-white/55 sm:mx-5 sm:text-xs sm:tracking-[0.25em]">
                Technology
              </span>

              <span className="text-[#B80319]">✦</span>

              <span className="mx-4 text-[10px] uppercase tracking-[0.2em] text-white/55 sm:mx-5 sm:text-xs sm:tracking-[0.25em]">
                Media
              </span>

              <span className="text-[#00A5A8]">✦</span>

              <span className="mx-4 text-[10px] uppercase tracking-[0.2em] text-white/55 sm:mx-5 sm:text-xs sm:tracking-[0.25em]">
                Culture
              </span>

              <span className="text-[#E59200]">✦</span>
            </div>
          ))}
        </div>
      </div>

      {/* =====================================================
          ANIMATIONS
      ====================================================== */}

      <style jsx>{`
        @keyframes heroImageDrift {
          0% {
            transform: scale(1.045) translate3d(0, 0, 0);
          }

          50% {
            transform: scale(1.075) translate3d(-0.45%, -0.3%, 0);
          }

          100% {
            transform: scale(1.055) translate3d(0.35%, 0.2%, 0);
          }
        }

        .hero-image-drift {
          animation: heroImageDrift ${SLIDE_DURATION}ms
            cubic-bezier(0.22, 1, 0.36, 1) 650ms both;
          will-change: transform;
        }

        /* ===================================================
           INITIAL HERO ENTRANCE
        =================================================== */

        @keyframes heroOrganizerIn {
          0% {
            opacity: 0;
            transform: translate3d(0, -22px, 0);
            filter: blur(7px);
          }

          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0);
            filter: blur(0);
          }
        }

        @keyframes heroTitleIn {
          0% {
            opacity: 0;
            transform: translate3d(-55px, 28px, 0) scale(0.97);
            filter: blur(14px);
            clip-path: inset(0 100% 0 0);
          }

          55% {
            opacity: 1;
            filter: blur(4px);
            clip-path: inset(0 25% 0 0);
          }

          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
            filter: blur(0);
            clip-path: inset(0 0 0 0);
          }
        }

        @keyframes heroTaglineIn {
          0% {
            opacity: 0;
            transform: translate3d(55px, 18px, 0);
            filter: blur(9px);
          }

          60% {
            opacity: 0.8;
            filter: blur(2px);
          }

          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0);
            filter: blur(0);
          }
        }

        @keyframes heroRuleIn {
          0% {
            opacity: 0;
            transform: scaleX(0);
            transform-origin: left center;
          }

          100% {
            opacity: 1;
            transform: scaleX(1);
            transform-origin: left center;
          }
        }

        @keyframes heroMetaIn {
          0% {
            opacity: 0;
            transform: translate3d(0, 24px, 0);
            letter-spacing: 0.35em;
            filter: blur(5px);
          }

          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0);
            letter-spacing: 0.2em;
            filter: blur(0);
          }
        }

        @keyframes heroSlideMessageIn {
          0% {
            opacity: 0;
            transform: translate3d(-20px, 20px, 0) scale(0.96);
            filter: blur(12px);
          }

          55% {
            opacity: 0.75;
            filter: blur(3px);
          }

          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
            filter: blur(0);
          }
        }

        @keyframes heroCtaIn {
          0% {
            opacity: 0;
            transform: translate3d(0, 30px, 0) scale(0.94);
            filter: blur(7px);
          }

          70% {
            opacity: 1;
            transform: translate3d(0, -2px, 0) scale(1.01);
            filter: blur(0);
          }

          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }

        @keyframes heroEcosystemIn {
          0% {
            opacity: 0;
            transform: translate3d(-18px, 0, 0);
          }

          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }

        /* ===================================================
           SLIDE TEXT
        =================================================== */

        @keyframes heroTextIn {
          0% {
            opacity: 0;
            transform: translateY(22px) scale(0.97);
            filter: blur(10px);
          }

          45% {
            opacity: 0.7;
            filter: blur(3px);
          }

          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        /* ===================================================
           PARTICLES
        =================================================== */

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

        /* ===================================================
           MARQUEE
        =================================================== */

        @keyframes marquee {
          from {
            transform: translateX(0);
          }

          to {
            transform: translateX(-50%);
          }
        }

        /* ===================================================
           INITIAL ANIMATION CLASSES
        =================================================== */

        :global(.hero-intro-1) {
          opacity: 0;
          animation: heroOrganizerIn 700ms
            cubic-bezier(0.22, 1, 0.36, 1)
            120ms forwards;
        }

        :global(.hero-title) {
          opacity: 0;
          animation: heroTitleIn 1200ms
            cubic-bezier(0.16, 1, 0.3, 1)
            300ms forwards;
          will-change: transform, opacity, filter, clip-path;
        }

        :global(.hero-intro-3) {
          opacity: 0;
          animation: heroTaglineIn 900ms
            cubic-bezier(0.22, 1, 0.36, 1)
            700ms forwards;
        }

        :global(.hero-rule) {
          opacity: 0;
          animation: heroRuleIn 650ms
            cubic-bezier(0.22, 1, 0.36, 1)
            1050ms forwards;
        }

        :global(.hero-intro-5) {
          opacity: 0;
          animation: heroMetaIn 800ms
            cubic-bezier(0.22, 1, 0.36, 1)
            1200ms forwards;
        }

        :global(.hero-slide-message) {
          opacity: 0;
          animation: heroSlideMessageIn 900ms
            cubic-bezier(0.22, 1, 0.36, 1)
            1400ms forwards;
        }

        :global(.hero-cta) {
          opacity: 0;
          animation: heroCtaIn 850ms
            cubic-bezier(0.22, 1, 0.36, 1)
            1650ms forwards;
        }

        :global(.hero-ecosystem) {
          opacity: 0;
          animation: heroEcosystemIn 700ms
            cubic-bezier(0.22, 1, 0.36, 1)
            2050ms forwards;
        }

        :global(.animate-hero-text-in) {
          animation: heroTextIn 900ms
            cubic-bezier(0.22, 1, 0.36, 1)
            both;
          will-change: transform, opacity, filter;
        }

        /* ===================================================
           FLOATING DETAILS
        =================================================== */

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

        /* ===================================================
           MARQUEE
        =================================================== */

        .hero-marquee {
          animation: marquee 28s linear infinite;
          will-change: transform;
        }

        /* ===================================================
           REDUCED MOTION
        =================================================== */

        @media (prefers-reduced-motion: reduce) {
          .hero-image-drift,
          :global(.hero-intro-1),
          :global(.hero-title),
          :global(.hero-intro-3),
          :global(.hero-rule),
          :global(.hero-intro-5),
          :global(.hero-slide-message),
          :global(.hero-cta),
          :global(.hero-ecosystem),
          :global(.animate-hero-text-in),
          .hero-particle,
          .hero-marquee {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
            filter: none !important;
            clip-path: none !important;
          }
        }

        /* ===================================================
           MOBILE
        =================================================== */

        @media (max-width: 767px) {
          .hero-particle {
            display: none;
          }

          .hero-image-drift {
            animation-duration: ${SLIDE_DURATION}ms;
          }
        }
      `}</style>
    </section>
  );
}