import { SiteChrome } from "@/components/layout/SiteChrome";
import { Hero } from "@/components/home/Hero";
import { JourneyScroll } from "@/components/home/JourneyScroll";
import { StatsSection } from "@/components/home/StatsSection";
import { ContactSection } from "@/components/home/ContactSection";
import { blocksRegistry } from "@/lib/blocks-registry";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = createClient();
  // public_stats() היא פונקציה ציבורית שמחזירה רק מספרים מצטברים (בלי מידע
  // אישי) - זמינה גם למי שלא מחובר, לכן אפשר לקרוא לה ישירות מדף הבית.
  const { data } = await supabase.rpc("public_stats");
  const stats = data as { registered_users: number; logins_this_month: number } | null;

  return (
    <SiteChrome>
      <Hero />
      <JourneyScroll />
      <StatsSection
        registeredUsers={stats?.registered_users ?? null}
        loginsThisMonth={stats?.logins_this_month ?? null}
        blocksInLibrary={blocksRegistry.length}
      />
      <ContactSection />
    </SiteChrome>
  );
}
