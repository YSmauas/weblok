/**
 * קריאה ל-Gemini - משותפת לשרת (נתיבי /api/ai/*) ולדפדפן (הזרקה לפרויקט,
 * ומשתמשים ששמרו את המפתח בדפדפן בלבד). בלי SDK ובלי תלות ב-Node.
 *
 * המפתח נשלח בכותרת x-goog-api-key ולא ב-query string, כדי שלא יופיע
 * בלוגים של שרתים/פרוקסי בדרך.
 */
export const GEMINI_MODEL = "gemini-2.5-flash";

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

  let res: Response;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey.trim() },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig }),
        signal,
      }
    );
  } catch (e) {
    if ((e as Error)?.name === "AbortError") throw e;
    throw new GeminiError("network");
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (res.status === 429) throw new GeminiError("rate_limited");
    if (res.status === 401 || res.status === 403 || /API_KEY_INVALID|API key not valid/i.test(body)) {
      throw new GeminiError("invalid_key");
    }
    throw new GeminiError("failed", `HTTP ${res.status}`);
  }

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
