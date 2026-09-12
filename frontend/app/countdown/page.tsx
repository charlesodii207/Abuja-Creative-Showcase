import type { Metadata } from "next";
import CountdownClock from "./CountdownClock";

export const metadata: Metadata = {
  title: "Countdown to ACS 2026",
  description:
    "Countdown to Abuja Creative Showcase 2026 — December 4-5 at the Old Parade Ground, Abuja. Film, music, fashion, tech, and opportunity.",
  alternates: {
    canonical: "/countdown",
  },
};

export default function CountdownPage() {
  return <CountdownClock />;
}