import type { FieldDef, BlockValues } from "../types";
import { DESIGN_FIELDS, buildDefaults } from "../_shared/util";

/**
 * "העוזר החכם" - הגדרות היוצר. מפתח ה-API לא מופיע כאן בכלל: המבקר באתר
 * מדביק מפתח משלו בתוך הווידג'ט, והוא נשמר רק בדפדפן שלו.
 * מזהי שדות ישנים (titleText, welcomeMsg, quickReplies, placeholder,
 * accentColor, fontSelect, widgetPosition) נשמרו, כדי שעיצובים שמורים ייטענו.
 * השדה הישן systemPrompt היה "serverOnly" - בכוונה לא משתמשים בו שוב (השדה
 * החדש הוא knowledge), כדי שהוראות שנכתבו פעם בתור "סודיות" לא ייחשפו בקוד.
 */

/** ספקים שאפשר לקרוא להם ישירות מהדפדפן (CORS) - ר' docs/assistant-providers.md */
export const PROVIDER_IDS = ["gemini", "anthropic", "openrouter", "groq", "mistral"] as const;
export type ProviderId = (typeof PROVIDER_IDS)[number];

/** ברירות מחדל של מודלים - אומתו מול התיעוד הרשמי ב-30.9.2026 (Gemini: lib/ai/models.ts) */
export const DEFAULT_MODELS: Record<Exclude<ProviderId, "gemini">, string> = {
  anthropic: "claude-sonnet-5-5",
  openrouter: "google/gemini-3.8-flash",
  groq: "llama-3.3-70b-versatile",
  mistral: "mistral-small-latest",
};

/** פרטי הספקים - קבועים שלנו (לא טקסט של היוצר). CORS אומת ב-30.9.2026. */
export const PROVIDER_INFO: Record<ProviderId, { name: string; keyUrl: string; keyHint: string }> = {
  gemini: { name: "Google Gemini", keyUrl: "https://aistudio.google.com/app/apikey", keyHint: "AIza…" },
  anthropic: { name: "Anthropic Claude", keyUrl: "https://platform.claude.com/settings/keys", keyHint: "sk-ant-…" },
  openrouter: { name: "OpenRouter", keyUrl: "https://openrouter.ai/settings/keys", keyHint: "sk-or-…" },
  groq: { name: "Groq", keyUrl: "https://console.groq.com/keys", keyHint: "gsk_…" },
  mistral: { name: "Mistral AI", keyUrl: "https://console.mistral.ai/api-keys", keyHint: "" },
};

/** צבע טקסט קריא על רקע הצבע המרכזי (שחור על צבע בהיר, לבן על כהה) */
export function onAccent(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.4 ? "#0b1220" : "#ffffff";
}

const uses = (p: ProviderId) => ({ field: "providerMode", equals: [p, "choice"] });
const PILL = { field: "launcherStyle", equals: ["pill"] };

/** גופן: ברירת מחדל גופן מערכת (בלי טעינה מ-Google); גופני Google רק בבחירה מפורשת */
const FONT_FIELD: FieldDef = {
  id: "fontSelect",
  aiDesignEditable: true,
  label: "גופן",
  type: "select",
  icon: "fa-font",
  default: "system",
  group: "עיצוב",
  hint: "\"גופן המערכת\" לא טוען שום דבר מבחוץ. גופן אחר נטען מ-Google Fonts (שרת של גוגל) באתר שלכם.",
  options: [
    { value: "system", label: "גופן המערכת (מומלץ, בלי טעינה חיצונית)" },
    { value: "Assistant", label: "Assistant (Google Fonts)" },
    { value: "Heebo", label: "Heebo (Google Fonts)" },
    { value: "Rubik", label: "Rubik (Google Fonts)" },
    { value: "Varela Round", label: "Varela Round (Google Fonts)" },
  ],
};

export const fields: FieldDef[] = [
  // ---------- ספק AI ----------
  {
    id: "providerMode",
    label: "ספק ה-AI",
    type: "select",
    icon: "fa-plug",
    default: "gemini",
    group: "ספק AI ומפתח",
    options: [
      { value: "gemini", label: "Google Gemini" },
      { value: "anthropic", label: "Anthropic Claude" },
      { value: "openrouter", label: "OpenRouter (מאות מודלים)" },
      { value: "groq", label: "Groq" },
      { value: "mistral", label: "Mistral AI" },
      { value: "choice", label: "המבקר בוחר ספק" },
    ],
    hint: "המבקר באתר מדביק מפתח API משלו בתוך העוזר. המפתח נשמר רק בדפדפן שלו ונשלח ישירות לספק - לא אליכם, לא אלינו ולא לקוד שמיוצא. בתצוגה החיה בעורך עובדות רק קריאות ל-Gemini (מדיניות אבטחה של האתר); שאר הספקים עובדים באתר האמיתי. OpenAI לא נתמך - ה-API שלו לא מאפשר קריאה ישירה מדפדפן.",
  },
  {
    id: "geminiModel",
    label: "מודל Gemini",
    type: "text",
    icon: "fa-microchip",
    default: "",
    group: "ספק AI ומפתח",
    dependsOn: uses("gemini"),
    hint: "ריק = רשימת המודלים המרכזית של WEblok, עם מעבר אוטומטי למודל הבא אם אחד לא זמין. אפשר לכתוב מזהה מדויק (למשל gemini-3.5-flash) - הוא ינוסה ראשון.",
  },
  {
    id: "anthropicModel",
    label: "מודל Claude",
    type: "text",
    icon: "fa-microchip",
    default: DEFAULT_MODELS.anthropic,
    group: "ספק AI ומפתח",
    dependsOn: uses("anthropic"),
    hint: "מזהה מודל של Anthropic, למשל claude-sonnet-5-5 או claude-opus-5-5. אצל Claude הגדרת \"יצירתיות\" לא נשלחת (מודלים חדשים לא מקבלים אותה).",
  },
  {
    id: "openrouterModel",
    label: "מודל OpenRouter",
    type: "text",
    icon: "fa-microchip",
    default: DEFAULT_MODELS.openrouter,
    group: "ספק AI ומפתח",
    dependsOn: uses("openrouter"),
    hint: "מזהה מהרשימה ב-openrouter.ai/models, למשל google/gemini-3.8-flash, anthropic/claude-sonnet-5.5 או openrouter/auto.",
  },
  {
    id: "groqModel",
    label: "מודל Groq",
    type: "text",
    icon: "fa-microchip",
    default: DEFAULT_MODELS.groq,
    group: "ספק AI ומפתח",
    dependsOn: uses("groq"),
    hint: "למשל llama-3.3-70b-versatile, llama-3.1-8b-instant או openai/gpt-oss-120b (רשימה: console.groq.com/docs/models).",
  },
  {
    id: "mistralModel",
    label: "מודל Mistral",
    type: "text",
    icon: "fa-microchip",
    default: DEFAULT_MODELS.mistral,
    group: "ספק AI ומפתח",
    dependsOn: uses("mistral"),
    hint: "למשל mistral-small-latest או mistral-medium-latest.",
  },

  // ---------- תוכן ----------
  {
    id: "widgetLang",
    label: "שפת הווידג'ט",
    type: "select",
    icon: "fa-language",
    default: "he",
    group: "תוכן",
    hint: "שפת הכפתורים, ההודעות והשגיאות בתוך העוזר, והשפה שבה המודל מתבקש לענות.",
    options: [
      { value: "he", label: "עברית" },
      { value: "en", label: "English" },
      { value: "es", label: "Español" },
    ],
  },
  {
    id: "titleText",
    label: "שם העוזר",
    type: "text",
    icon: "fa-heading",
    default: "העוזר החכם",
    group: "תוכן",
    aiAssist: true,
  },
  {
    id: "welcomeMsg",
    label: "הודעת פתיחה",
    type: "text",
    icon: "fa-comment-medical",
    default: "שלום! אני העוזר של האתר. איך אפשר לעזור?",
    group: "תוכן",
    aiAssist: true,
  },
  {
    id: "knowledge",
    label: "מה העוזר יודע (הוראות ומידע על העסק)",
    type: "textarea",
    icon: "fa-robot",
    default:
      "אתה עוזר וירטואלי אדיב של העסק. ענה בקצרה ולעניין.\nשעות פעילות: א'-ה' 9:00-18:00.\nאם אינך יודע תשובה - אמור זאת והצע להשאיר פרטים בטופס יצירת הקשר באתר.",
    group: "תוכן",
    aiAssist: true,
    hint: "נשלח למודל כהוראות מערכת. הטקסט הזה מופיע בקוד שמוטמע באתר וכל אחד יכול לקרוא אותו - אל תכתבו כאן סיסמאות, מפתחות או מידע פנימי.",
  },
  {
    id: "quickReplies",
    label: "הצעות מהירות (כפתורים)",
    type: "text",
    icon: "fa-bolt",
    default: "מה שעות הפעילות?, כמה זה עולה?, איך יוצרים קשר?",
    group: "תוכן",
    hint: "מופרדות בפסיק, עד 6. מוצגות מתחת להודעת הפתיחה. ריק = בלי.",
  },
  {
    id: "placeholder",
    label: "טקסט בשדה ההקלדה",
    type: "text",
    icon: "fa-i-cursor",
    default: "",
    group: "תוכן",
    hint: "ריק = טקסט ברירת מחדל בשפת הווידג'ט.",
  },

  // ---------- התנהגות ----------
  {
    id: "maxLength",
    label: "אורך תשובה מרבי",
    type: "select",
    icon: "fa-ruler-horizontal",
    default: "medium",
    group: "התנהגות",
    aiDesignEditable: true,
    options: [
      { value: "short", label: "קצר (עד כ-80 מילים)" },
      { value: "medium", label: "בינוני (עד כ-200 מילים)" },
      { value: "long", label: "ארוך (עד כ-500 מילים)" },
    ],
  },
  {
    id: "temperature",
    label: "סגנון התשובות",
    type: "select",
    icon: "fa-temperature-half",
    default: "0.5",
    group: "התנהגות",
    aiDesignEditable: true,
    hint: "משפיע על Gemini, OpenRouter, Groq ו-Mistral. אצל Claude לא נשלח.",
    options: [
      { value: "0.2", label: "מדויק ועקבי" },
      { value: "0.5", label: "מאוזן" },
      { value: "0.9", label: "יצירתי" },
    ],
  },
  {
    id: "chatMemory",
    label: "שמירת השיחה",
    type: "select",
    icon: "fa-clock-rotate-left",
    default: "memory",
    group: "התנהגות",
    options: [
      { value: "memory", label: "רק בעמוד הנוכחי (נמחקת במעבר עמוד)" },
      { value: "session", label: "עד סגירת הלשונית (sessionStorage)" },
    ],
  },

  // ---------- תצוגה ----------
  {
    id: "widgetPosition",
    label: "מיקום",
    type: "select",
    icon: "fa-location-dot",
    default: "end",
    group: "תצוגה",
    aiDesignEditable: true,
    options: [
      { value: "end", label: "פינה תחתונה בסוף השורה (שמאל בעברית)" },
      { value: "start", label: "פינה תחתונה בתחילת השורה (ימין בעברית)" },
    ],
  },
  {
    id: "launcherStyle",
    label: "כפתור הפתיחה",
    type: "select",
    icon: "fa-comment-dots",
    default: "bubble",
    group: "תצוגה",
    aiDesignEditable: true,
    options: [
      { value: "bubble", label: "בועה עגולה" },
      { value: "pill", label: "כפתור עם טקסט" },
    ],
  },
  {
    id: "launcherLabel",
    label: "טקסט הכפתור",
    type: "text",
    icon: "fa-tag",
    default: "יש שאלה?",
    group: "תצוגה",
    dependsOn: PILL,
    aiAssist: true,
  },
  {
    id: "launcherPulse",
    label: "הבהוב עדין לכפתור",
    type: "select",
    icon: "fa-wave-square",
    default: "no",
    group: "תצוגה",
    aiDesignEditable: true,
    hint: "כבוי אוטומטית אצל מבקרים שביקשו להפחית תנועה (prefers-reduced-motion).",
    options: [
      { value: "no", label: "בלי" },
      { value: "yes", label: "הבהוב עדין עד הפתיחה הראשונה" },
    ],
  },
  ...DESIGN_FIELDS.map((f) => (f.id === "fontSelect" ? FONT_FIELD : f)),
];

export function defaultValues(): BlockValues {
  return buildDefaults(fields);
}
