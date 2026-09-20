"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-provider";
import { PuzzleBackground } from "../ui/PuzzleBackground";

export function Hero() {
  const { t } = useLocale();

  return (
    <section className="relative overflow-hidden">
      <PuzzleBackground />
      <div className="relative max-w-3xl mx-auto px-6 pt-24 pb-32 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold leading-[1.15] tracking-tight">
          {t("hero.title1")}
          <br />
          <span className="text-accent">{t("hero.title2")}</span>
        </h1>
        <p className="mt-5 text-ink-secondary text-lg leading-relaxed max-w-xl mx-auto">
          {t("hero.subtitle")}
        </p>
        <div className="mt-9 flex items-center justify-center gap-4">
          <Link
            href="/blocks"
            className="bg-accent text-base-bg font-semibold rounded-full px-7 py-3 hover:bg-accent-hover transition-colors"
          >
            {t("hero.ctaStart")}
          </Link>
          <Link
            href="/auth/login"
            className="border border-base-border rounded-full px-7 py-3 hover:border-accent transition-colors"
          >
            {t("hero.ctaLogin")}
          </Link>
        </div>
      </div>
    </section>
  );
}
