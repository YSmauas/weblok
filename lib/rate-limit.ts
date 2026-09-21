import { createHmac } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

/** מזהה גולש לצורך הגבלה: hash של ה-IP (לא שומרים IP גולמי). */
export function clientKey(request: Request): string {
  const ip =
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  return createHmac("sha256", process.env.KEYS_ENCRYPTION_SECRET ?? "weblok").update(ip).digest("hex").slice(0, 32);
}

/**
 * true = מותר להמשיך, false = חרג מהמכסה.
 * מכסה של `max` בקשות לכל `windowSeconds` שניות, לכל מפתח (bucket:מזהה).
 * אם מנגנון ההגבלה עצמו נכשל (למשל DB לא זמין) - ממשיכים ורושמים ללוג, כדי
 * שתקלה בו לא תשבית את האתר.
 */
export async function rateLimit(key: string, max: number, windowSeconds: number): Promise<boolean> {
  try {
    const { data, error } = await createAdminClient().rpc("check_rate_limit", {
      p_key: key,
      p_max: max,
      p_window_seconds: windowSeconds,
    });
    if (error) throw error;
    return data === true;
  } catch (e) {
    console.error("rate limit check failed", e);
    return true;
  }
}
