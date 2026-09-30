"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth/use-session";
import { useTheme } from "@/lib/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { IconLogo, IconInfo, IconSun, IconMoon, IconMenu } from "../ui/Icons";
import { LanguageSwitcher } from "../ui/LanguageSwitcher";

export function Header({
  onOpenAbout,
  onOpenSidebar,
}: {
  onOpenAbout: () => void;
  onOpenSidebar: () => void;
}) {
  const { theme, toggle } = useTheme();
  const { t } = useLocale();
  const pathname = usePathname() ?? "";
  const { loggedIn } = useSession();

  const NAV = [
    { href: "/blocks", label: t("sidebar.blocks") },
    { href: "/structures", label: t("sidebar.structures") },
    { href: "/tools/inject", label: t("sidebar.toolInject") },
    loggedIn
      ? { href: "/dashboard", label: t("sidebar.personalArea") }
      : { href: "/auth/login", label: t("header.login") },
  ];

  return (
    <header className="sticky top-0 z-40 glass pt-[env(safe-area-inset-top)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 group" aria-label="WEblok">
          <IconLogo className="w-7 h-7 text-accent transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6" />
          <span className="text-lg font-extrabold tracking-tight" dir="ltr">
            WE<span className="text-accent">blok</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm" aria-label={t("header.menu")}>
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`px-3 py-1.5 rounded-full transition-colors ${
                  active ? "bg-accent/15 text-accent font-semibold" : "text-ink-secondary hover:text-ink-primary hover:bg-base-panel2"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          <button
            onClick={onOpenAbout}
            aria-label={t("header.about")}
            className="p-2 rounded-full text-ink-secondary hover:text-ink-primary hover:bg-base-panel2 transition-colors"
          >
            <IconInfo className="w-5 h-5" />
          </button>

          <LanguageSwitcher />

          <button
            onClick={toggle}
            aria-label={t("header.theme")}
            className="p-2 rounded-full text-ink-secondary hover:text-ink-primary hover:bg-base-panel2 transition-colors"
          >
            {theme === "dark" ? (
              <IconSun className="w-5 h-5" />
            ) : (
              <IconMoon className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={onOpenSidebar}
            aria-label={t("header.menu")}
            className="p-2 rounded-full text-ink-secondary hover:text-ink-primary hover:bg-base-panel2 transition-colors"
          >
            <IconMenu className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
