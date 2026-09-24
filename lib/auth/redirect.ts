/**
 * מונע open-redirect: מאפשר רק נתיבים פנימיים ("/x").
 * דפדפנים מסננים tab/newline ומתרגמים "\" ל-"/", כך ש-"/\t/evil.com" הופך ל-"//evil.com" -
 * לכן חוסמים תווי בקרה ו-"\" לגמרי, ומוודאים שהכתובת נשארת על אותו origin.
 */
export function safeNext(value: string | null | undefined, fallback = "/dashboard"): string {
  if (!value || !value.startsWith("/") || /[\u0000-\u001f\u007f\\]/.test(value)) {
    return fallback;
  }
  try {
    const url = new URL(value, "http://internal.invalid");
    if (url.origin !== "http://internal.invalid") return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
