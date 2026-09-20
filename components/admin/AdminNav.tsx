"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "סקירה ואנליטיקה" },
  { href: "/admin/users", label: "משתמשים" },
  { href: "/admin/contacts", label: "פניות מערכת" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1 md:sticky md:top-24 h-fit">
      {LINKS.map((link) => {
        const active =
          link.href === "/admin" ? pathname === link.href : pathname?.startsWith(link.href);
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
