import { SiteChrome } from "@/components/layout/SiteChrome";
import { Hero } from "@/components/home/Hero";
import { JourneyScroll } from "@/components/home/JourneyScroll";
import { StatsSection } from "@/components/home/StatsSection";
import { ContactSection } from "@/components/home/ContactSection";

export default function HomePage() {
  return (
    <SiteChrome>
      <Hero />
      <JourneyScroll />
      <StatsSection />
      <ContactSection />
    </SiteChrome>
  );
}
