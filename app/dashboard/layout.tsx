import { SiteChrome } from "@/components/layout/SiteChrome";
import { DashboardNav } from "@/components/dashboard/DashboardNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SiteChrome>
      <div className="max-w-5xl mx-auto px-6 py-10 grid md:grid-cols-[210px_1fr] gap-10">
        <DashboardNav />
        <div className="min-w-0">{children}</div>
      </div>
    </SiteChrome>
  );
}
