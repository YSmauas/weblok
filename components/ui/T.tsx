"use client";

import { useLocale } from "@/lib/i18n/locale-provider";

/** טקסט מתורגם לשימוש בתוך Server Components (שאין להם גישה ל-useLocale). */
export function T({ k }: { k: string }) {
  const { t } = useLocale();
  return <>{t(k)}</>;
}
