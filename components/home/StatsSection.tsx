"use client";

import { useLocale } from "@/lib/i18n/locale-provider";

export function StatsSection() {
  const { t } = useLocale();

  const STATS = [
    { label: t("stats.registeredUsers"), value: "—" },
    { label: t("stats.loginsThisMonth"), value: "—" },
    { label: t("stats.blocksInLibrary"), value: "1" },
  ];

  return (
    <section className="border-y border-base-border bg-base-panel/40">
      <div className="max-w-4xl mx-auto px-6 py-16 grid grid-cols-3 gap-6 text-center">
        {STATS.map((s) => (
          <div key={s.label}>
            <p className="text-3xl md:text-4xl font-extrabold text-accent">{s.value}</p>
            <p className="mt-2 text-sm text-ink-secondary">{s.label}</p>
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-ink-muted pb-8">{t("stats.note")}</p>
    </section>
  );
}
