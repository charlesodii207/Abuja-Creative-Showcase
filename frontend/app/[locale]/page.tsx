import CountdownBanner from "@/app/components/CountdownBanner";
import Hero from "@/app/components/Hero";
import TrailerSection from "@/app/components/TrailerSection";
import AboutSection from "@/app/components/AboutSection";
import ConvenersNote from "@/app/components/ConvenersNote";
import CreativeEcosystem from "@/app/components/CreativeEcosystem";
import ParticipationSection from "@/app/components/ParticipationSection";
import ProgrammeSection from "@/app/components/ProgrammeSection";
import HotelBookingSection from "@/app/components/HotelBookingSection";
import SponsorsSection from "@/app/components/SponsorsSection";
import InsideAfriqa from "@/app/components/InsideAfriqa";
import FAQSection from "@/app/components/FAQSection";
import ContactSection from "@/app/components/ContactSection";
import FollowSection from "@/app/components/FollowSection";

const eventJsonLd = {
  "@context": "https://schema.org",
  "@type": "Event",
  name: "Afriqa Creative Showcase 2026",
  description:
    "A two-day multidisciplinary creative industry platform in Abuja connecting film, music, fashion, art, and technology talent with markets, capital, and opportunity.",
  startDate: "2026-12-04",
  endDate: "2026-12-05",
  eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  eventStatus: "https://schema.org/EventScheduled",
  image: ["https://africacreativeshowcase.com/images/acspreview.jpeg"],
  location: {
    "@type": "Place",
    name: "Old Parade Ground",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Abuja",
      addressRegion: "FCT",
      addressCountry: "NG",
    },
  },
  organizer: {
    "@type": "Organization",
    name: "AFRIGOS Film & Media Academy",
    url: "https://africacreativeshowcase.com",
  },
  url: "https://africacreativeshowcase.com",
};

export default function Home() {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
      />

      <CountdownBanner />
      <Hero />
      <TrailerSection />
      <AboutSection />
      <ConvenersNote />
      <CreativeEcosystem />
      <ParticipationSection />
      <ProgrammeSection />
      <HotelBookingSection />
      <SponsorsSection />
      <InsideAfriqa />
      <FAQSection />
      <ContactSection />
      <FollowSection />
    </main>
  );
}