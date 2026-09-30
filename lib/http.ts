/**
 * קריאת גוף JSON בנתיבי API, עם שתי הגנות שחסרו:
 * 1. מגבלת גודל - גם לפי Content-Length וגם בפועל (כותרת אפשר לזייף/להשמיט),
 *    כדי שבקשה ענקית לא תתפוס זיכרון/זמן בפונקציה.
 * 2. Same-origin - אם הדפדפן שלח Origin והוא לא הדומיין שלנו, דוחים. זו שכבה
 *    נוספת מעל SameSite=Lax של עוגיות ה-session (הגנת CSRF), לא במקומה.
 * מחזיר null על כל כשל (גדול מדי / JSON לא תקין / origin זר).
 */
export async function readJson<T = Record<string, unknown>>(request: Request, maxBytes = 16 * 1024): Promise<T | null> {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) return null;
    } catch {
      return null;
    }
  }

  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > maxBytes) return null;
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).length > maxBytes) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}
