import type { Metadata } from "next";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { Hero } from "@/components/home/Hero";
import { JourneyScroll } from "@/components/home/JourneyScroll";
import { StatsSection } from "@/components/home/StatsSection";
import { ToolsShowcase } from "@/components/home/ToolsShowcase";
import { ContactSection } from "@/components/home/ContactSection";
import { blocksRegistry } from "@/lib/blocks-registry";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { url: "/" },
};

export default async function HomePage() {
  const supabase = await createClient();
  // public_stats() היא פונקציה ציבורית שמחזירה רק מספרים מצטברים (בלי מידע
  // אישי) - זמינה גם למי שלא מחובר, לכן אפשר לקרוא לה ישירות מדף הבית.
  // public_stats_totals() (migrations 0005+0006) - סה"כ ביקורים (כל גולש, לא רק רשומים) וכניסות.
  // לפני ההרצה פשוט מחזיר שגיאה/שדה חסר ומוצג "—".
  const [{ data }, { data: totalsData }] = await Promise.all([
    supabase.rpc("public_stats"),
    supabase.rpc("public_stats_totals"),
  ]);
  const stats = data as { registered_users: number; logins_this_month: number } | null;
  const totals = totalsData as { total_visits?: number | null; visits_30d?: number | null } | null;

  return (
    <SiteChrome>
      <Hero />
      <JourneyScroll />
      <ToolsShowcase />
      <StatsSection
        totalVisits={totals?.total_visits ?? null}
        visitsThisMonth={totals?.visits_30d ?? null}
        registeredUsers={stats?.registered_users ?? null}
        blocksInLibrary={blocksRegistry.length}
      />
      <ContactSection />
    </SiteChrome>
  );
}
