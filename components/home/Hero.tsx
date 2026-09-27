"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useSession } from "@/lib/auth/use-session";
import { PuzzleBackground } from "../ui/PuzzleBackground";

export function Hero() {
  const { t } = useLocale();
  const { loggedIn } = useSession();

  return (
    <section className="relative overflow-hidden">
      <PuzzleBackground />
      <div className="relative max-w-3xl mx-auto px-6 pt-20 sm:pt-24 pb-28 sm:pb-32 text-center">
        <Link href="/tools/inject" className="chip hover:border-accent transition-colors">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" aria-hidden />
          {t("hero.badge")}
        </Link>
        <h1 className="mt-6 text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight">
          {t("hero.title1")}
          <br />
          <span className="bg-gradient-to-l from-accent to-ink-primary bg-clip-text text-transparent">
            {t("hero.title2")}
          </span>
        </h1>
        <p className="mt-6 text-ink-secondary text-lg leading-relaxed max-w-xl mx-auto">{t("hero.subtitle")}</p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link href="/blocks" className="btn-primary px-7 py-3 text-base shadow-[0_8px_30px_-8px_var(--accent)]">
            {t("hero.ctaStart")}
          </Link>
          <Link href="/tools/inject" className="btn-outline px-7 py-3 text-base">
            💉 {t("hero.ctaInject")}
          </Link>
        </div>
        {!loggedIn && (
          <p className="mt-5 text-sm text-ink-muted">
            {t("hero.haveAccount")}{" "}
            <Link href="/auth/login" className="text-accent hover:underline">
              {t("hero.ctaLogin")}
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
