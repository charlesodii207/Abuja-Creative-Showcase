"use client";

import { useState } from "react";
import Reveal from "./Reveal";

const TRAILER_VIDEO_ID = "tntxfedFMpw";

// Optional: to use your own thumbnail instead of YouTube's, put the image in
// frontend/public/images/ and set the path here, e.g. "/images/trailer-thumb.webp".
// Leave as "" to use the thumbnail set on YouTube.
const CUSTOM_THUMBNAIL = "";

export default function TrailerSection() {
  const [playing, setPlaying] = useState(false);
  const [thumbSrc, setThumbSrc] = useState(
    CUSTOM_THUMBNAIL ||
      `https://img.youtube.com/vi/${TRAILER_VIDEO_ID}/maxresdefault.jpg`
  );

  const handleThumbError = () => {
    // maxresdefault doesn't exist for every video, so fall back to hqdefault
    const fallback = `https://img.youtube.com/vi/${TRAILER_VIDEO_ID}/hqdefault.jpg`;
    if (thumbSrc !== fallback) setThumbSrc(fallback);
  };

  return (
    <section
      id="trailer"
      className="overflow-hidden border-b border-white/10 bg-[#0D1128]"
    >
      <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 md:py-28 lg:px-10">
        {/* Eyebrow */}
        <div className="mb-6 flex items-center gap-3">
          <div className="tricolor-rule">
            <span />
            <span />
            <span />
          </div>

          <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#F5EFE6]/45">
            Event Trailer
          </span>
        </div>

        <Reveal delay={80}>
          <h2 className="max-w-2xl font-display text-4xl leading-[1.05] text-[#F5EFE6] sm:text-5xl lg:text-6xl">
            Watch the trailer
          </h2>
        </Reveal>

        <Reveal delay={160}>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg">
            Get a first look at two days of film, music, fashion, art, and
            technology coming together in Abuja.
          </p>
        </Reveal>

        <Reveal delay={240}>
          <div className="relative mx-auto mt-12 max-w-5xl px-3 pb-3 sm:px-5 sm:pb-5">
            {/* Decorative frame */}
            <div className="absolute inset-3 rounded-[2.5rem] border border-[#E59200]/30 sm:inset-5" />

            <div className="absolute -bottom-1 -left-1 h-24 w-24 rounded-full border border-[#00A5A8]/30 bg-[#00A5A8]/10 blur-[1px] sm:h-28 sm:w-28" />

            <div className="absolute -right-1 -top-3 z-20 flex h-14 w-14 items-center justify-center rounded-full border border-[#E59200]/40 bg-[#0D1128] shadow-[0_0_30px_rgba(229,146,0,0.12)] sm:-right-3 sm:-top-5 sm:h-16 sm:w-16">
              <span className="h-2.5 w-2.5 rounded-full bg-[#E59200]" />
            </div>

            {/* Video / thumbnail */}
            <div className="relative overflow-hidden rounded-[2.5rem] rounded-br-[5rem] rounded-tl-[1rem] border border-white/10 bg-[#11152F] shadow-[0_25px_80px_rgba(0,0,0,0.22)]">
              <div className="relative aspect-video w-full">
                {playing ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${TRAILER_VIDEO_ID}?rel=0&autoplay=1`}
                    title="AFRIQA Creative Showcase 2026 - Event Trailer"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full border-0"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setPlaying(true)}
                    aria-label="Play the AFRIQA Creative Showcase trailer"
                    className="group absolute inset-0 h-full w-full cursor-pointer"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumbSrc}
                      alt="AFRIQA Creative Showcase 2026 trailer thumbnail"
                      onError={handleThumbError}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />

                    <div className="absolute inset-0 bg-gradient-to-tr from-[#11152F]/50 via-transparent to-[#E59200]/10" />

                    {/* Play button */}
                    <span className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#E59200]/50 bg-[#11152F]/80 shadow-[0_0_40px_rgba(229,146,0,0.25)] backdrop-blur-md transition-all duration-300 group-hover:scale-110 group-hover:border-[#E59200] sm:h-24 sm:w-24">
                      <span className="ml-1 h-0 w-0 border-y-[11px] border-l-[18px] border-y-transparent border-l-[#E59200] sm:border-y-[13px] sm:border-l-[22px]" />
                    </span>

                    <span className="absolute bottom-5 left-5 flex items-center gap-3 rounded-full border border-white/15 bg-[#11152F]/80 px-4 py-2 backdrop-blur-md">
                      <span className="h-2 w-2 rounded-full bg-[#E59200]" />
                      <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#F5EFE6]/80">
                        Play trailer
                      </span>
                    </span>
                  </button>
                )}
              </div>

              <div className="pointer-events-none absolute inset-3 z-20 rounded-[2rem] rounded-br-[4.5rem] border border-white/10" />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}