"use client";

import { useLocale } from "@/lib/i18n/locale-provider";
import { CountUp } from "@/components/ui/CountUp";
import { Reveal } from "@/components/ui/Reveal";

export function StatsSection({
  totalVisits,
  visitsThisMonth,
  registeredUsers,
  blocksInLibrary,
}: {
  totalVisits: number | null;
  visitsThisMonth: number | null;
  registeredUsers: number | null;
  blocksInLibrary: number;
}) {
  const { t } = useLocale();

  const STATS = [
    { label: t("stats.totalVisits"), value: totalVisits },
    { label: t("stats.visits30d"), value: visitsThisMonth },
    { label: t("stats.registeredUsers"), value: registeredUsers },
    { label: t("stats.blocksInLibrary"), value: blocksInLibrary },
  ];

  return (
    <section className="border-y border-base-border bg-base-panel/40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {STATS.map((s, i) => (
          <Reveal key={s.label} delay={i * 90}>
            <p className="text-3xl md:text-4xl font-extrabold text-accent tabular-nums">
              <CountUp value={s.value} />
            </p>
            <p className="mt-2 text-xs sm:text-sm text-ink-secondary">{s.label}</p>
          </Reveal>
        ))}
      </div>
      <p className="text-center text-xs text-ink-muted pb-8">{t("stats.note")}</p>
    </section>
  );
}
