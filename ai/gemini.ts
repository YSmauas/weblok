/**
 * קריאה ל-Gemini - משותפת לשרת (נתיבי /api/ai/*) ולדפדפן (הזרקה לפרויקט,
 * ומשתמשים ששמרו את המפתח בדפדפן בלבד). בלי SDK ובלי תלות ב-Node.
 *
 * המפתח נשלח בכותרת x-goog-api-key ולא ב-query string, כדי שלא יופיע
 * בלוגים של שרתים/פרוקסי בדרך.
 */
import { GEMINI_ENDPOINT, GEMINI_MODELS } from "./models";

export { GEMINI_MODEL, GEMINI_MODELS } from "./models";

const MODEL_UNAVAILABLE = /no longer available|not found for API version|is not supported for generateContent|models\/[^ ]+ is not found/i;

export type GeminiErrorCode =
  | "invalid_key"
  | "rate_limited"
  | "quota"
  | "model_unavailable"
  | "region"
  | "api_disabled"
  | "denied"
  | "overloaded"
  | "blocked"
  | "truncated"
  | "empty"
  | "network"
  | "failed";

/** פרטים טכניים לא רגישים על הכשל (קוד HTTP, סטטוס Google, מודל) - לאבחון בלבד */
export interface GeminiErrorDetail {
  status?: number;
  apiStatus?: string;
  model?: string;
}

export class GeminiError extends Error {
  constructor(public code: GeminiErrorCode, message?: string, public detail?: GeminiErrorDetail) {
    super(message ?? code);
    this.name = "GeminiError";
  }
}

/** "HTTP 403 · PERMISSION_DENIED · gemini-3.8-flash" - בלי טקסט חופשי מהתשובה (עלול לכלול פרטי חשבון) */
export function formatGeminiDetail(d?: GeminiErrorDetail): string {
  if (!d) return "";
  return [d.status ? `HTTP ${d.status}` : "", d.apiStatus ?? "", d.model ?? ""].filter(Boolean).join(" · ");
}

const apiStatusOf = (body: string) => /"status"\s*:\s*"([A-Z_]{3,40})"/.exec(body)?.[1];

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
  let res: Response | null = null;
  let lastError: GeminiError | null = null;
  for (const model of GEMINI_MODELS) {
    const generationConfig: Record<string, unknown> = {};
    if (json) generationConfig.responseMimeType = "application/json";
    // בדור 3 ההנחיה של גוגל היא להשאיר temperature ברירת מחדל (ערך נמוך עלול לגרום ללולאות/ירידה באיכות)
    if (temperature !== undefined && model.startsWith("gemini-2")) generationConfig.temperature = temperature;
    let attempt: Response;
    try {
      attempt = await fetch(`${GEMINI_ENDPOINT}/${model}:generateContent`, {
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
    const detail: GeminiErrorDetail = { status: attempt.status, apiStatus: apiStatusOf(body), model };
    // מודל לא זמין לחשבון/הוסר - מנסים את הבא ברשימה
    if (attempt.status === 404 || MODEL_UNAVAILABLE.test(body)) {
      lastError = new GeminiError("model_unavailable", `HTTP ${attempt.status}`, detail);
      continue;
    }
    const code = classifyHttpError(attempt.status, body);
    // המכסה/הגבלת הקצב נספרות לכל מודל בנפרד, ועומס (503) לרוב פוקד מודל אחד - מודל אחר עשוי לעבוד
    if (code === "rate_limited" || code === "quota" || code === "overloaded") {
      lastError = new GeminiError(code, `HTTP ${attempt.status}`, detail);
      continue;
    }
    throw new GeminiError(code, `HTTP ${attempt.status}`, detail);
  }
  if (!res) throw lastError ?? new GeminiError("model_unavailable");

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

/**
 * ממפה תשובת שגיאה של Gemini לקוד ברור. גוף התשובה נבדק רק מול תבניות
 * ידועות ולא מוצג למשתמש ולא נכתב ללוג (עלול לכלול פרטי חשבון).
 */
export function classifyHttpError(status: number, body: string): GeminiErrorCode {
  if (/API_KEY_INVALID|API key not valid|API_KEY_EXPIRED|expired/i.test(body)) return "invalid_key";
  if (/location is not supported|FAILED_PRECONDITION/i.test(body)) return "region";
  if (/SERVICE_DISABLED|has not been used in project|is disabled/i.test(body)) return "api_disabled";
  // 403 "Your project has been denied access": הפרויקט חסום ב-Google, לא שהמפתח שגוי
  if (/project has been denied access|denied access/i.test(body)) return "denied";
  // 429: מכסה יומית (בדרך כלל Free tier) שונה מהגבלת קצב לדקה - הראשונה לא תיפתר בעוד רגע
  if (status === 429) return /per ?day|PerDay|free_tier/i.test(body) ? "quota" : "rate_limited";
  if (status === 401 || status === 403) return "invalid_key";
  if (status === 400 && /SAFETY|blocked/i.test(body)) return "blocked";
  // 5xx = בעיה זמנית בצד Google (למשל 503 UNAVAILABLE כשהמודל עמוס)
  if (status === 500 || status === 502 || status === 503 || status === 504) return "overloaded";
  return "failed";
}

export type KeyCheckResult =
  /** המפתח תקין ויש לו גישה לפחות למודל אחד מהרשימה */
  | { status: "valid" }
  /** המפתח תקין, אבל אין לו גישה לאף מודל שהמערכת משתמשת בו */
  | { status: "no_model" }
  /** הגוגל דחתה את המפתח - לא לשמור */
  | { status: "invalid"; code: "invalid_key" | "region" | "api_disabled" }
  /** לא הצלחנו לאמת (רשת, הגבלת קצב, מכסה) - המפתח עשוי להיות תקין */
  | { status: "unverified"; code: GeminiErrorCode };

/**
 * בדיקת מפתח לפני שמירה: GET על רשימת המודלים. זו קריאה קלה שלא צורכת
 * מכסת יצירה ולא עולה כסף. התשובה מכילה גם את המודלים שהמפתח רשאי להשתמש
 * בהם, ולכן אפשר לזהות מפתח תקין שאין לו גישה למודלים שלנו (בדיוק מה שקרה
 * ב-gemini-2.5-flash). המפתח נשלח בכותרת, לא ב-URL, ולא נכתב ללוג.
 */
export async function validateGeminiKey(apiKey: string, timeoutMs = 8000): Promise<KeyCheckResult> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${GEMINI_ENDPOINT}?pageSize=1000`, {
      headers: { "x-goog-api-key": apiKey.trim() },
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const code = classifyHttpError(res.status, await res.text().catch(() => ""));
      if (code === "invalid_key" || code === "region" || code === "api_disabled") return { status: "invalid", code };
      return { status: "unverified", code };
    }
    const data = await res.json().catch(() => null);
    const models: { name?: unknown; supportedGenerationMethods?: unknown }[] = Array.isArray(data?.models)
      ? data.models
      : [];
    if (!models.length) return { status: "unverified", code: "failed" };
    const usable = new Set(
      models
        .filter((m) => !Array.isArray(m.supportedGenerationMethods) || m.supportedGenerationMethods.includes("generateContent"))
        .map((m) => String(m.name ?? "").replace(/^models\//, ""))
    );
    return GEMINI_MODELS.some((m) => usable.has(m)) ? { status: "valid" } : { status: "no_model" };
  } catch {
    return { status: "unverified", code: "network" };
  } finally {
    clearTimeout(timer);
  }
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
