"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "סקירה כללית" },
  { href: "/dashboard/profile", label: "פרופיל ומפתחות API" },
  { href: "/dashboard/saved", label: "עיצובים שמורים" },
  { href: "/dashboard/projects", label: "פרויקטים קטנים" },
  { href: "/dashboard/contact", label: "יצירת קשר" },
];

export function DashboardNav() {
  const pathname = usePathname();

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
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
