"use client";

import { useEffect, useRef, useState } from "react";
import Reveal from "./Reveal";

const TRAILER_VIDEO_ID = "tntxfedFMpw";

// Optional: to use your own thumbnail instead of YouTube's, put the image in
// frontend/public/images/ and set the path here, e.g. "/images/trailer-thumb.webp".
// Leave as "" to use the thumbnail set on YouTube.
const CUSTOM_THUMBNAIL = "";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT && window.YT.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<void>((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };

    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
  });

  return apiPromise;
}

export default function TrailerSection() {
  const [playing, setPlaying] = useState(false);
  const [thumbSrc, setThumbSrc] = useState(
    CUSTOM_THUMBNAIL ||
      `https://img.youtube.com/vi/${TRAILER_VIDEO_ID}/maxresdefault.jpg`
  );

  const playerHostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any>(null);

  // Preload the YouTube API in the background so the click feels instant
  useEffect(() => {
    loadYouTubeApi();
    return () => {
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
  }, []);

  const handleThumbError = () => {
    // maxresdefault doesn't exist for every video, so fall back to hqdefault
    const fallback = `https://img.youtube.com/vi/${TRAILER_VIDEO_ID}/hqdefault.jpg`;
    if (thumbSrc !== fallback) setThumbSrc(fallback);
  };

  const handlePlay = async () => {
    if (playing) return;
    setPlaying(true);

    await loadYouTubeApi();

    const host = playerHostRef.current;
    if (!host || !window.YT) return;

    // Create a plain div outside React's control for the player to replace
    const target = document.createElement("div");
    host.appendChild(target);

    playerRef.current = new window.YT.Player(target, {
      videoId: TRAILER_VIDEO_ID,
      width: "100%",
      height: "100%",
      playerVars: {
        autoplay: 1,
        rel: 0,
        playsinline: 1,
        modestbranding: 1,
      },
      events: {
        onReady: (event: any) => {
          const iframe = event.target.getIframe();
          iframe.className = "absolute inset-0 h-full w-full border-0";
          iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
          event.target.playVideo();
        },
      },
    });
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
              <div className="relative aspect-video w-full bg-black">
                {/* YouTube player gets injected here after the click */}
                <div ref={playerHostRef} className="absolute inset-0" />

                {!playing && (
                  <button
                    type="button"
                    onClick={handlePlay}
                    aria-label="Play the AFRIQA Creative Showcase trailer"
                    className="group absolute inset-0 z-10 h-full w-full cursor-pointer"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumbSrc}
                      alt="AFRIQA Creative Showcase 2026 trailer thumbnail"
                      onError={handleThumbError}
                      className="h-full w-full object-cover"
                    />

                    {/* Soft shade so the button stands out on bright thumbnails */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />

                    {/* YouTube-style play button: red, glows on hover */}
                    <span className="absolute left-1/2 top-1/2 block h-12 w-[68px] -translate-x-1/2 -translate-y-1/2 transition-transform duration-300 group-hover:scale-110 sm:h-14 sm:w-[82px]">
                      {/* Red glow beam, hidden until hover */}
                      <span className="pointer-events-none absolute inset-0 rounded-2xl bg-[#FF0000] opacity-0 blur-xl transition-opacity duration-300 group-hover:animate-pulse group-hover:opacity-80" />

                      <svg
                        viewBox="0 0 68 48"
                        aria-hidden="true"
                        className="relative h-full w-full transition-[filter] duration-300 group-hover:drop-shadow-[0_0_14px_rgba(255,0,0,0.9)]"
                      >
                        <path
                          d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55C3.97 2.33 2.27 4.81 1.48 7.74.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z"
                          fill="#FF0000"
                        />
                        <path d="M45 24 27 14v20" fill="#fff" />
                      </svg>
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