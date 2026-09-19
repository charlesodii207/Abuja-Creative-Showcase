import CountdownBanner from "./components/CountdownBanner";
import Hero from "./components/Hero";
import AboutSection from "./components/AboutSection";
import ConvenersNote from "./components/ConvenersNote";
import CreativeEcosystem from "./components/CreativeEcosystem";
import ParticipationSection from "./components/ParticipationSection";
import ProgrammeSection from "./components/ProgrammeSection";
import SponsorsSection from "./components/SponsorsSection";
import InsideAfriqa from "./components/InsideAfriqa";
import FAQSection from "./components/FAQSection";
import ContactSection from "./components/ContactSection";
import FollowSection from "./components/FollowSection";

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
      <AboutSection />
      <ConvenersNote />
      <CreativeEcosystem />
      <ParticipationSection />
      <ProgrammeSection />
      <SponsorsSection />
      <InsideAfriqa />
      <FAQSection />
      <ContactSection />
      <FollowSection />
    </main>
  );
}