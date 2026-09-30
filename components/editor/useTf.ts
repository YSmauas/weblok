"use client";

import { useLocale } from "@/lib/i18n/locale-provider";

/**
 * t() עם טקסט גיבוי: מפתחות חדשים יושבים ב-i18n-pending/ עד שממזגים אותם
 * (npm run i18n:merge) - עד אז מוצג הגיבוי (עברית) במקום שם המפתח הגולמי.
 */
export function useTf() {
  const { t, locale } = useLocale();
  const tf = (key: string, fallback: string) => {
    const v = t(key);
    return v === key ? fallback : v;
  };
  return { tf, t, locale };
}
