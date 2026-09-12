import type { Metadata } from "next";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.abujacreativeshowcase.com"),

  title: {
    default: "Abuja Creative Showcase 2026 | Creative Events in Abuja",
    template: "%s | Abuja Creative Showcase",
  },

  description:
    "Abuja Creative Showcase 2026 is a two-day creative industry event at the Old Parade Ground, Abuja, Nigeria — connecting film, music, fashion, art, technology, talent, investors, and opportunities.",

  keywords: [
    "Abuja Creative Showcase",
    "Abuja Creative Showcase 2026",
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

  openGraph: {
    type: "website",
    url: "https://www.abujacreativeshowcase.com/",
    siteName: "Abuja Creative Showcase",
    title: "Abuja Creative Showcase 2026 | Creative Events in Abuja",
    description:
      "Two days of film, music, fashion, art, technology, networking, pitching, investment, and creative opportunities — live at the Old Parade Ground, Abuja, Nigeria.",
    locale: "en_NG",
    images: [
      {
        url: "/images/acspreview.jpeg",
        width: 1200,
        height: 630,
        alt: "Abuja Creative Showcase 2026",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Abuja Creative Showcase 2026",
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
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}