import { SiteChrome } from "@/components/layout/SiteChrome";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { T } from "@/components/ui/T";
import { getSession } from "@/lib/auth/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <SiteChrome>
      <div className="max-w-5xl mx-auto px-6 py-10 grid md:grid-cols-[210px_1fr] gap-10">
        <DashboardNav />
        <div className="min-w-0">
          {session?.status === "warned" && (
            <div className="mb-6 rounded-card border border-accent/40 bg-accent-soft px-4 py-3 text-sm text-ink-primary">
              <T k="warned.banner" />
            </div>
          )}
          {children}
        </div>
      </div>
    </SiteChrome>
  );
}
