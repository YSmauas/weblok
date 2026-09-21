/** מונע open-redirect: מאפשר רק נתיבים פנימיים ("/x"), לא "//evil.com" או כתובת מלאה. */
export function safeNext(value: string | null | undefined, fallback = "/dashboard"): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }
  return value;
}
