/**
 * הגדרה מרכזית אחת לשמות מודלי ה-AI. כל קוד שפונה למודל (השרת, הדפדפן,
 * כלי ההזרקה והבלוקים המיוצאים) קורא מכאן, כדי ששינוי הבא של גוגל יתוקן
 * במקום אחד.
 *
 * אומת מול https://ai.google.dev/gemini-api/docs/models (ספטמבר 2026):
 * - gemini-3.8-flash: מודל ה-Flash היציב העדכני.
 * - gemini-flash-latest: alias שגוגל מעדכנת לגרסה האחרונה (גיבוי אם 3.8 יוסר).
 * - gemini-3.5-flash / gemini-3.5-flash-lite: יציבים, דור קודם.
 * - gemini-2.5-flash: זמין רק לחשבונות ששימשו בו בעבר (מפתחות חדשים מקבלים 404).
 *
 * אפשר לעקוף בלי שינוי קוד: NEXT_PUBLIC_GEMINI_MODELS="model-a,model-b" (ב-Vercel).
 * המשתנה ציבורי בכוונה, כי גם הדפדפן פונה ל-Gemini ישירות, ואין בו שום סוד.
 */
const DEFAULT_GEMINI_MODELS = [
  "gemini-3.8-flash",
  "gemini-flash-latest",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-2.5-flash",
];

const MODEL_ID = /^[a-z0-9][a-z0-9.-]{1,60}$/;

function fromEnv(): string[] {
  const raw = process.env.NEXT_PUBLIC_GEMINI_MODELS ?? "";
  return raw
    .split(",")
    .map((m) => m.trim())
    .filter((m) => MODEL_ID.test(m));
}

/** רשימת המודלים לפי סדר עדיפות. כשמודל לא זמין עוברים לבא בתור. */
export const GEMINI_MODELS: readonly string[] = (() => {
  const env = fromEnv();
  return env.length ? env : DEFAULT_GEMINI_MODELS;
})();

/** המודל הראשי - לקוד שמיוצא לאתרי לקוחות (שם אין fallback בזמן ריצה מעבר לרשימה). */
export const GEMINI_MODEL = GEMINI_MODELS[0];

export const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
