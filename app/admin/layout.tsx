import type { Metadata } from "next";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { AdminNav } from "@/components/admin/AdminNav";

export const metadata: Metadata = {
  title: "ניהול",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SiteChrome>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 grid md:grid-cols-[210px_1fr] gap-6 md:gap-10">
        <AdminNav />
        <div className="min-w-0">{children}</div>
      </div>
    </SiteChrome>
  );
}
