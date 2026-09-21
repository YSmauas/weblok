"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/lib/i18n/locale-provider";

const LINKS = [
  { href: "/admin", label: "admin.overviewTitle" },
  { href: "/admin/users", label: "admin.usersTitle" },
  { href: "/admin/contacts", label: "admin.contactsTitle" },
];

export function AdminNav() {
  const pathname = usePathname();
  const { t } = useLocale();

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
            {t(link.label)}
          </Link>
        );
      })}
    </nav>
  );
}
