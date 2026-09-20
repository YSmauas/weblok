"use client";

import Link from "next/link";
import { useTheme } from "@/lib/theme-provider";
import { useLocale } from "@/lib/i18n/locale-provider";
import { IconPuzzle, IconInfo, IconSun, IconMoon, IconMenu } from "../ui/Icons";
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

  return (
    <header className="sticky top-0 z-40 glass">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <IconPuzzle className="w-6 h-6 text-accent group-hover:rotate-12 transition-transform" />
          <span className="text-lg font-extrabold tracking-tight">WEblok</span>
        </Link>

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
