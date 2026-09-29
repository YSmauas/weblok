/**
 * קריאה ל-Gemini - משותפת לשרת (נתיבי /api/ai/*) ולדפדפן (הזרקה לפרויקט,
 * ומשתמשים ששמרו את המפתח בדפדפן בלבד). בלי SDK ובלי תלות ב-Node.
 *
 * המפתח נשלח בכותרת x-goog-api-key ולא ב-query string, כדי שלא יופיע
 * בלוגים של שרתים/פרוקסי בדרך.
 */
/**
 * רשימת מודלים לפי סדר עדיפות. גוגל הגבילה את משפחת 2.5 למי ששימש בה בעבר,
 * ומפתחות חדשים מקבלים "model is no longer available" (404) - לכן ברירת המחדל
 * היא 3.5, ו-2.5 נשארת רק כגיבוי לחשבונות ישנים. כשמודל לא זמין עוברים לבא בתור.
 */
export const GEMINI_MODELS = ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-2.5-flash"] as const;
export const GEMINI_MODEL = GEMINI_MODELS[0];

const MODEL_UNAVAILABLE = /no longer available|not found for API version|is not supported for generateContent/i;

export type GeminiErrorCode =
  | "invalid_key"
  | "rate_limited"
  | "blocked"
  | "truncated"
  | "empty"
  | "network"
  | "failed";

export class GeminiError extends Error {
  constructor(public code: GeminiErrorCode, message?: string) {
    super(message ?? code);
    this.name = "GeminiError";
  }
}

export async function callGemini({
  apiKey,
  prompt,
  json = false,
  temperature,
  signal,
}: {
  apiKey: string;
  prompt: string;
  /** מבקש מהמודל להחזיר JSON תקין בלבד (responseMimeType) */
  json?: boolean;
  temperature?: number;
  signal?: AbortSignal;
}): Promise<string> {
  const generationConfig: Record<string, unknown> = {};
  if (json) generationConfig.responseMimeType = "application/json";
  if (temperature !== undefined) generationConfig.temperature = temperature;

  let res: Response | null = null;
  for (const model of GEMINI_MODELS) {
    let attempt: Response;
    try {
      attempt = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey.trim() },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig }),
        signal,
      });
    } catch (e) {
      if ((e as Error)?.name === "AbortError") throw e;
      throw new GeminiError("network");
    }
    if (attempt.ok) {
      res = attempt;
      break;
    }
    const body = await attempt.text().catch(() => "");
    // מודל לא זמין לחשבון/הוסר - מנסים את הבא ברשימה
    if (attempt.status === 404 || MODEL_UNAVAILABLE.test(body)) continue;
    if (attempt.status === 429) throw new GeminiError("rate_limited");
    if (attempt.status === 401 || attempt.status === 403 || /API_KEY_INVALID|API key not valid/i.test(body)) {
      throw new GeminiError("invalid_key");
    }
    throw new GeminiError("failed", `HTTP ${attempt.status}`);
  }
  if (!res) throw new GeminiError("failed", "model_unavailable");

  const data = await res.json().catch(() => null);
  if (data?.promptFeedback?.blockReason) throw new GeminiError("blocked");
  const candidate = data?.candidates?.[0];
  const text: string = (candidate?.content?.parts ?? [])
    .map((p: { text?: string }) => p?.text ?? "")
    .join("")
    .trim();

  if (candidate?.finishReason === "SAFETY") throw new GeminiError("blocked");
  if (!text) {
    throw new GeminiError(candidate?.finishReason === "MAX_TOKENS" ? "truncated" : "empty");
  }
  if (candidate?.finishReason === "MAX_TOKENS" && json) throw new GeminiError("truncated");
  return text;
}

/** מחלץ JSON מתשובת מודל, גם אם נעטפה ב-```json או כללה טקסט מסביב. */
export function extractJson<T = unknown>(raw: string): T {
  const cleaned = raw.replace(/```(?:json)?/gi, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1)) as T;
    throw new GeminiError("failed", "invalid_json");
  }
}
