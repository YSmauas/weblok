import { Card } from "@/components/ui/Card";
import { T } from "@/components/ui/T";
import { createClient } from "@/lib/supabase/server";

interface Analytics {
  visits_today: number;
  avg_session_seconds: number;
  top_blocks: { slug: string; views: number }[];
}

const mmss = (sec: number) =>
  `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, "0")}`;

export default async function AdminOverviewPage() {
  const supabase = createClient();
  // ספירות אמיתיות. RLS ופונקציית ה-DB בודקות בעצמן שהקורא הוא admin/owner.
  const [users, open, analytics] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.rpc("admin_analytics"),
  ]);

  const a = (analytics.data ?? null) as Analytics | null;
  const top = a?.top_blocks ?? [];
  const maxViews = Math.max(1, ...top.map((b) => b.views));

  const STATS = [
    { k: "admin.statUsers", value: String(users.count ?? "—") },
    { k: "admin.statVisits", value: a ? String(a.visits_today) : "—" },
    { k: "admin.statAvg", value: a ? mmss(a.avg_session_seconds) : "—" },
    { k: "admin.statOpen", value: String(open.count ?? "—") },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold"><T k="admin.overviewTitle" /></h1>
        <p className="text-ink-secondary mt-1"><T k="admin.overviewSubtitle" /></p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <Card key={s.k}>
            <p className="text-2xl font-extrabold text-accent">{s.value}</p>
            <p className="text-xs text-ink-secondary mt-1"><T k={s.k} /></p>
          </Card>
        ))}
      </div>

      <Card title={<T k="admin.popularTitle" />} description={<T k="admin.popularDesc" />}>
        {top.length === 0 ? (
          <p className="text-sm text-ink-muted"><T k="admin.noData" /></p>
        ) : (
          <div className="space-y-3">
            {top.map((b) => (
              <div key={b.slug}>
                <div className="flex justify-between text-sm mb-1">
                  <span dir="ltr">{b.slug}</span>
                  <span className="text-ink-muted">{b.views} <T k="admin.views" /></span>
                </div>
                <div className="h-2 rounded-full bg-base-bg overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: `${(b.views / maxViews) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
