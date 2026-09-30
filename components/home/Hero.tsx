"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useSession } from "@/lib/auth/use-session";
import { PuzzleBackground } from "../ui/PuzzleBackground";
import { AppIcon } from "../ui/AppIcon";

export function Hero() {
  const { t } = useLocale();
  const { loggedIn } = useSession();

  return (
    <section className="relative overflow-hidden">
      <PuzzleBackground />
      <div className="relative max-w-3xl mx-auto px-6 pt-20 sm:pt-24 pb-28 sm:pb-32 text-center">
        <Link href="/structures" className="chip hover:border-accent transition-colors animate-rise">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" aria-hidden />
          {t("hero.badge")}
        </Link>
        <h1 className="mt-6 text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight animate-rise [animation-delay:120ms]">
          {t("hero.title1")}
          <br />
          <span className="bg-gradient-to-l from-accent via-ink-primary to-accent bg-clip-text text-transparent text-shimmer">
            {t("hero.title2")}
          </span>
        </h1>
        <p className="mt-6 text-ink-secondary text-lg leading-relaxed max-w-xl mx-auto animate-rise [animation-delay:260ms]">{t("hero.subtitle")}</p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3 animate-rise [animation-delay:400ms]">
          <Link href="/blocks" className="btn-primary px-7 py-3 text-base shadow-[0_8px_30px_-8px_var(--accent)] hover:-translate-y-0.5 transition-transform">
            {t("hero.ctaStart")}
          </Link>
          <Link href="/tools/inject" className="btn-outline px-7 py-3 text-base">
            <AppIcon name="inject" className="!text-current" /> {t("hero.ctaInject")}
          </Link>
        </div>
        {!loggedIn && (
          <p className="mt-5 text-sm text-ink-muted animate-rise [animation-delay:520ms]">
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
