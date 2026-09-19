import type { Metadata } from "next";
import SponsorshipPageClient from "./SponsorshipPageClient";

export const metadata: Metadata = {
  title: "Sponsorship & Partnership Packages",
  description:
    "Partner with Afriqa Creative Showcase 2026 through strategic sponsorship and partnership opportunities connecting brands with Africa's creative ecosystem.",
  alternates: {
    canonical: "/sponsorship",
  },
};

export default function SponsorshipPage() {
  return <SponsorshipPageClient />;
}