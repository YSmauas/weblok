import { SiteChrome } from "@/components/layout/SiteChrome";
import { Hero } from "@/components/home/Hero";
import { JourneyScroll } from "@/components/home/JourneyScroll";
import { StatsSection } from "@/components/home/StatsSection";
import { ToolsShowcase } from "@/components/home/ToolsShowcase";
import { ContactSection } from "@/components/home/ContactSection";
import { blocksRegistry } from "@/lib/blocks-registry";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  // public_stats() היא פונקציה ציבורית שמחזירה רק מספרים מצטברים (בלי מידע
  // אישי) - זמינה גם למי שלא מחובר, לכן אפשר לקרוא לה ישירות מדף הבית.
  // public_stats_totals() (migration 0005) - סה"כ כניסות. לפני ההרצה פשוט מחזיר שגיאה ומוצג "—".
  const [{ data }, { data: totalsData }] = await Promise.all([
    supabase.rpc("public_stats"),
    supabase.rpc("public_stats_totals"),
  ]);
  const stats = data as { registered_users: number; logins_this_month: number } | null;
  const totals = totalsData as { total_logins: number | null } | null;

  return (
    <SiteChrome>
      <Hero />
      <JourneyScroll />
      <ToolsShowcase />
      <StatsSection
        registeredUsers={stats?.registered_users ?? null}
        loginsThisMonth={stats?.logins_this_month ?? null}
        totalLogins={totals?.total_logins ?? null}
        blocksInLibrary={blocksRegistry.length}
      />
      <ContactSection />
    </SiteChrome>
  );
}
