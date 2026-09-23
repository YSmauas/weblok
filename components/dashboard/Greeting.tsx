"use client";

import { useLocale } from "@/lib/i18n/locale-provider";

export function Greeting({ name }: { name: string }) {
  const { t } = useLocale();
  return <>{t("dash.greeting").replace("{name}", name)}</>;
}
