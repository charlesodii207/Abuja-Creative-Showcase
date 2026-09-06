import Hero from "./components/Hero";
import AboutSection from "./components/AboutSection";
import ParticipationSection from "./components/ParticipationSection";
import ProgrammeSection from "./components/ProgrammeSection";
import SponsorsSection from "./components/SponsorsSection";
import FAQSection from "./components/FAQSection";
import ContactSection from "./components/ContactSection";
import FollowSection from "./components/FollowSection";

export default function Home() {
  return (
    <main>
      <Hero />
      <AboutSection />
      <ParticipationSection />
      <ProgrammeSection />
      <SponsorsSection />
      <FAQSection />
      <ContactSection />
      <FollowSection />
    </main>
  );
}