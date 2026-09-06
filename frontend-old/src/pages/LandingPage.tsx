import Header from "@/components/Header";
import Hero from "@/components/Hero";
import AboutSection from "@/components/AboutSection";
import ProgrammeSection from "@/components/ProgrammeSection";
import TeaserSection from "@/components/TeaserSection";
import SponsorsSection from "@/components/SponsorsSection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";

export default function LandingPage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <AboutSection />
        <ProgrammeSection />
        <TeaserSection />
        <SponsorsSection />
        <FAQSection />
      </main>
      <Footer />
    </>
  );
}
