import { Card } from "@/components/ui/Card";
import { T } from "@/components/ui/T";
import { DailyChart } from "@/components/admin/DailyChart";
import { createClient } from "@/lib/supabase/server";

interface Analytics {
  visits_today: number;
  avg_session_seconds: number;
  top_blocks: { slug: string; views: number }[];
}

/** admin_analytics_v2() - migration 0005 */
interface AnalyticsV2 {
  total_logins: number;
  logins_30d: number;
  active_users_30d: number;
  new_users_30d: number;
  total_visits: number;
  visits_7d: number;
  page_views_7d: number;
  daily: { day: string; visits: number; logins: number }[];
  top_pages: { path: string; views: number; visitors: number }[];
  avg_page_seconds: number;
  saved_designs: number;
  projects: number;
}

const mmss = (sec: number) => {
  const total = Math.round(sec);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

const num = (n: number | null | undefined) => (typeof n === "number" ? n.toLocaleString() : "—");

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  // ספירות אמיתיות. RLS ופונקציות ה-DB בודקות בעצמן שהקורא הוא admin/owner.
  const [users, open, analytics, analyticsV2] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.rpc("admin_analytics"),
    supabase.rpc("admin_analytics_v2"),
  ]);

  const a = (analytics.data ?? null) as Analytics | null;
  const b = (analyticsV2.error ? null : analyticsV2.data) as AnalyticsV2 | null;
  const top = a?.top_blocks ?? [];
  const maxViews = Math.max(1, ...top.map((x) => x.views));
  const daily = b?.daily ?? [];
  const maxPage = Math.max(1, ...(b?.top_pages ?? []).map((p) => p.views));

  const GROUPS: { title: string; stats: { k: string; value: string }[] }[] = [
    {
      title: "admin.groupUsers",
      stats: [
        { k: "admin.statUsers", value: num(users.count) },
        { k: "admin.statNewUsers", value: num(b?.new_users_30d) },
        { k: "admin.statActiveUsers", value: num(b?.active_users_30d) },
        { k: "admin.statOpen", value: num(open.count) },
      ],
    },
    {
      title: "admin.groupLogins",
      stats: [
        { k: "admin.statTotalLogins", value: num(b?.total_logins) },
        { k: "admin.statLogins30", value: num(b?.logins_30d) },
        { k: "admin.statSaved", value: num(b?.saved_designs) },
        { k: "admin.statProjects", value: num(b?.projects) },
      ],
    },
    {
      title: "admin.groupTraffic",
      stats: [
        { k: "admin.statVisits", value: a ? num(a.visits_today) : "—" },
        { k: "admin.statVisits7", value: num(b?.visits_7d) },
        { k: "admin.statTotalVisits", value: num(b?.total_visits) },
        { k: "admin.statAvg", value: a ? mmss(a.avg_session_seconds) : "—" },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold"><T k="admin.overviewTitle" /></h1>
        <p className="text-ink-secondary mt-1"><T k="admin.overviewSubtitle" /></p>
      </div>

      {!b && (
        <p role="status" className="rounded-card border border-accent/40 bg-accent-soft px-4 py-3 text-sm">
          <T k="admin.migrationNeeded" />
        </p>
      )}

      {GROUPS.map((g) => (
        <section key={g.title}>
          <h2 className="text-xs font-semibold text-ink-muted mb-3"><T k={g.title} /></h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {g.stats.map((s) => (
              <Card key={s.k} className="!p-4">
                <p className="text-2xl font-extrabold text-accent tabular-nums">{s.value}</p>
                <p className="text-xs text-ink-secondary mt-1"><T k={s.k} /></p>
              </Card>
            ))}
          </div>
        </section>
      ))}

      {daily.length > 0 && (
        <Card title={<T k="admin.dailyTitle" />} description={<T k="admin.dailyDesc" />}>
          <div className="grid lg:grid-cols-2 gap-8">
            <DailyChart titleKey="admin.visits" data={daily.map((d) => ({ day: d.day, value: Number(d.visits) || 0 }))} />
            <DailyChart
              titleKey="admin.logins"
              tone="muted"
              data={daily.map((d) => ({ day: d.day, value: Number(d.logins) || 0 }))}
            />
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card title={<T k="admin.topPagesTitle" />} description={<T k="admin.topPagesDesc" />}>
          {!b || b.top_pages.length === 0 ? (
            <p className="text-sm text-ink-muted"><T k="admin.noData" /></p>
          ) : (
            <div className="space-y-3">
              {b.top_pages.map((p) => (
                <div key={p.path}>
                  <div className="flex justify-between gap-3 text-sm mb-1">
                    <span dir="ltr" className="truncate font-mono text-xs">{p.path}</span>
                    <span className="text-ink-muted shrink-0 text-xs">
                      {p.views} <T k="admin.views" /> · {p.visitors} <T k="admin.visitors" />
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-base-bg overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: `${(p.views / maxPage) * 100}%` }} />
                  </div>
                </div>
              ))}
              <p className="text-xs text-ink-muted pt-1">
                <T k="admin.avgPage" />: {mmss(b.avg_page_seconds)}
              </p>
            </div>
          )}
        </Card>

        <Card title={<T k="admin.popularTitle" />} description={<T k="admin.popularDesc" />}>
          {top.length === 0 ? (
            <p className="text-sm text-ink-muted"><T k="admin.noData" /></p>
          ) : (
            <div className="space-y-3">
              {top.map((x) => (
                <div key={x.slug}>
                  <div className="flex justify-between text-sm mb-1">
                    <span dir="ltr">{x.slug}</span>
                    <span className="text-ink-muted">{x.views} <T k="admin.views" /></span>
                  </div>
                  <div className="h-2 rounded-full bg-base-bg overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: `${(x.views / maxViews) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
