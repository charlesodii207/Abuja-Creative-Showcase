import type { Metadata } from "next";
import { Suspense } from "react";
import Script from "next/script";
import "./globals.css";
import SiteChrome from "./components/SiteChrome";
import PageTracker from "./components/PageTracker";

export const metadata: Metadata = {
  metadataBase: new URL("https://africacreativeshowcase.com"),

  title: {
    default: "Afriqa Creative Showcase 2026 | Creative Events in Abuja",
    template: "%s | Afriqa Creative Showcase",
  },

  description:
    "Afriqa Creative Showcase 2026 is a two-day creative industry event at the Old Parade Ground, Abuja, Nigeria — connecting film, music, fashion, art, technology, talent, investors, and opportunities.",

  keywords: [
    "Afriqa Creative Showcase",
    "Afriqa Creative Showcase 2026",
    "creative events in Abuja",
    "Abuja creative events",
    "creative industry events Abuja",
    "creative industry Abuja",
    "Abuja events 2026",
    "creative opportunities Abuja",
    "creative industry Nigeria",
    "film events Abuja",
    "music events Abuja",
    "fashion events Abuja",
    "creative technology Abuja",
    "Old Parade Ground Abuja",
    "events at Old Parade Ground Abuja",
  ],

  authors: [
    {
      name: "AFRIGOS Film & Media Academy",
    },
  ],

  creator: "AFRIGOS Film & Media Academy",

  alternates: {
    canonical: "/",
  },

  verification: {
    google: "BQBpC9A6IKW3hpbB0HgoUBuSywB_q4yscboZT6qp8Do",
  },

  openGraph: {
    type: "website",
    url: "https://africacreativeshowcase.com/",
    siteName: "Afriqa Creative Showcase",
    title: "Afriqa Creative Showcase 2026 | Creative Events in Abuja",
    description:
      "Two days of film, music, fashion, art, technology, networking, pitching, investment, and creative opportunities — live at the Old Parade Ground, Abuja, Nigeria.",
    locale: "en_NG",
    images: [
      {
        url: "/images/acspreview.jpeg",
        width: 1200,
        height: 630,
        alt: "Afriqa Creative Showcase 2026",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Afriqa Creative Showcase 2026",
    description:
      "Where Creativity Meets Opportunity. Film × Music × Fashion × Tech. Old Parade Ground, Abuja, Nigeria.",
    images: ["/images/acspreview.jpeg"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <SiteChrome>{children}</SiteChrome>

        {/*
          First-party traffic tracking — records each page view (with IP
          and social source) to our own API, shown at /admin/traffic.
          Wrapped in Suspense because it reads the URL's query string.
          It skips /admin pages on its own.
        */}
        <Suspense fallback={null}>
          <PageTracker />
        </Suspense>

        {/*
          Site analytics (Umami) — page views, visits per day, referrers,
          and location, viewed at cloud.umami.is. Only loads in production
          builds, so local development and testing don't pollute real
          traffic numbers. "afterInteractive" means it loads after the
          page is already usable, so it never blocks or slows the site
          down for visitors.
        */}
        {process.env.NODE_ENV === "production" && (
          <Script
            strategy="afterInteractive"
            src="https://cloud.umami.is/script.js"
            data-website-id="5ed657e8-e0ba-479b-8bac-060d061455f7"
          />
        )}
      </body>
    </html>
  );
}