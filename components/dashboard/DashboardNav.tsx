"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/lib/i18n/locale-provider";

const LINKS = [
  { href: "/dashboard", label: "dash.nav.overview" },
  { href: "/dashboard/profile", label: "dash.l.profile.title" },
  { href: "/dashboard/saved", label: "saved.title" },
  { href: "/dashboard/projects", label: "projects.title" },
  { href: "/dashboard/contact", label: "dcontact.title" },
];

export function DashboardNav() {
  const pathname = usePathname();
  const { t } = useLocale();

  return (
    <nav className="space-y-1 md:sticky md:top-24 h-fit">
      {LINKS.map((link) => {
        const active =
          link.href === "/dashboard"
            ? pathname === link.href
            : pathname?.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`block px-3 py-2.5 rounded-lg text-sm transition-colors ${
              active
                ? "bg-accent/15 text-accent font-semibold"
                : "text-ink-secondary hover:text-ink-primary hover:bg-base-panel2"
            }`}
          >
            {t(link.label)}
          </Link>
        );
      })}
    </nav>
  );
}
