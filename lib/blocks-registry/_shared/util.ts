import type { BlockValues, FieldDef } from "../types";
import { getTheme } from "../contact-form/themes";

/** עזרים משותפים לבלוקי הפריסה (header/footer/sidebar/popup) - סניטציה, קישורים, עיצוב. */

export const esc = (v: string) =>
  (v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** מחרוזת JS שבטוחה גם בתוך <script> */
export const jsStr = (v: string) =>
  JSON.stringify(v ?? "").replace(/</g, "\\u003c").replace(/\u2028|\u2029/g, "");

export const HEX = /^#[0-9a-fA-F]{6}$/;

export const clip = (v: string | undefined, max: number) => (v ?? "").trim().slice(0, max);

export function buildDefaults(fields: FieldDef[]): BlockValues {
  const values: BlockValues = {};
  fields.forEach((f) => (values[f.id] = f.default));
  return values;
}

/** ערך select חייב להיות אחת האפשרויות שבסכמה - אחרת ברירת המחדל. */
export function makePick(fields: FieldDef[]) {
  return (values: BlockValues, id: string): string => {
    const field = fields.find((f) => f.id === id);
    const v = values[id];
    if (field?.options?.some((o) => o.value === v)) return v;
    return field?.default ?? "";
  };
}

/* ---------- קישורים ---------- */

// http(s), נתיב יחסי (/x), עוגן, mailto, tel, או נתיב יחסי בלי נקודתיים. לעולם לא javascript:/data:
const LINK_OK =
  /^(https?:\/\/[^\s"'<>\\]+|\/(?!\/)[^\s"'<>\\]*|#[\w-]*|mailto:[^\s"'<>\\]+|tel:[+\d\-\s()]+|\w[\w./?=&%#~-]*)$/i;
const ASSET_OK = /^(https:\/\/[^\s"'<>\\]+|\/(?!\/)[^\s"'<>\\]*)$/i;

export function safeLink(v: string | undefined): string {
  const s = (v ?? "").trim();
  return LINK_OK.test(s) ? s : "";
}

export function safeAsset(v: string | undefined): string {
  const s = (v ?? "").trim();
  return ASSET_OK.test(s) ? s : "";
}

export interface LinkItem {
  label: string;
  url: string;
}

/** שורה לכל קישור: "טקסט | כתובת". שורה בלי "|" הופכת לקישור "#". קישור לא תקין נזרק. */
export function parseLinks(text: string | undefined, max = 8): LinkItem[] {
  const out: LinkItem[] = [];
  for (const raw of (text ?? "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const i = line.lastIndexOf("|");
    const label = (i === -1 ? line : line.slice(0, i)).trim().slice(0, 60);
    const url = i === -1 ? "#" : safeLink(line.slice(i + 1));
    if (!label || !url) continue;
    out.push({ label, url });
    if (out.length >= max) break;
  }
  return out;
}

/** hash קצר ויציב (djb2) - למפתחות אחסון של פופאפ */
export function hashKey(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/* ---------- אייקונים (SVG מוטמע, בלי CDN) ---------- */

const svg = (size: number, body: string, fill = false) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill ? "currentColor" : "none"}" stroke="${fill ? "none" : "currentColor"}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;

export const ICON = {
  menu: svg(20, '<path d="M4 6h16M4 12h16M4 18h16"/>'),
  close: svg(16, '<path d="m18 6-12 12M6 6l12 12"/>'),
  gift: svg(20, '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C9.5 3 12 8 12 8s2.5-5 4.5-5a2.5 2.5 0 0 1 0 5"/>'),
  cookie: svg(20, '<path d="M12 3a9 9 0 1 0 9 9 4 4 0 0 1-4.5-4A4 4 0 0 1 12 3z"/><circle cx="8.5" cy="10.5" r=".8" fill="currentColor"/><circle cx="12" cy="15" r=".8" fill="currentColor"/><circle cx="15.5" cy="13" r=".8" fill="currentColor"/>'),
  bell: svg(20, '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0"/>'),
  arrowUp: svg(18, '<path d="M12 19V5M5 12l7-7 7 7"/>'),
  check: svg(18, '<path d="M20 6 9 17l-5-5"/>'),
};

/** אייקון רשת חברתית לפי הדומיין (SVG מוטמע). ריק = לא מזוהה → מוצג טקסט. */
const SOCIAL: [RegExp, string][] = [
  [/(^|\.)instagram\.com$/, '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6" fill="currentColor"/>'],
  [/(^|\.)(facebook\.com|fb\.com)$/, '<path d="M15 3h-2.5A4.5 4.5 0 0 0 8 7.5V10H5.5v4H8v7h4v-7h3l1-4h-4V7.5a1 1 0 0 1 1-1H16z"/>'],
  [/(^|\.)(x\.com|twitter\.com)$/, '<path d="M4 4l16 16M20 4 4 20"/>'],
  [/(^|\.)linkedin\.com$/, '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7"/>'],
  [/(^|\.)(youtube\.com|youtu\.be)$/, '<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="m10 9.5 5 2.5-5 2.5z" fill="currentColor"/>'],
  [/(^|\.)tiktok\.com$/, '<path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5M14 3a5 5 0 0 0 5 5"/>'],
  [/(^|\.)github\.com$/, '<path d="M9 19c-4 1.5-4-2-6-2.5M15 21v-3.5a3 3 0 0 0-.8-2.3c2.8-.3 5.8-1.4 5.8-6.2a4.8 4.8 0 0 0-1.3-3.3 4.5 4.5 0 0 0-.1-3.3s-1.1-.3-3.5 1.3a12 12 0 0 0-6.2 0C6.5 2.1 5.4 2.4 5.4 2.4a4.5 4.5 0 0 0-.1 3.3A4.8 4.8 0 0 0 4 9c0 4.8 3 5.9 5.8 6.2a3 3 0 0 0-.8 2.3V21"/>'],
  [/(^|\.)(wa\.me|whatsapp\.com)$/, '<path d="M3.5 20.5 5 16a8.5 8.5 0 1 1 3 3z"/><path d="M9 9.5c.5 2 2.5 4 5 5l1.2-1.2 2 1-.6 1.7c-3.6.3-8.4-4.4-8-8l1.6-.6 1 2z"/>'],
  [/(^|\.)(t\.me|telegram\.org|telegram\.me)$/, '<path d="m21 4-18 7 6 2 2 6 3-4 5 4z"/><path d="m9 13 8-6"/>'],
];

export function socialIcon(url: string, size = 18): string {
  let host = "";
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
  const hit = SOCIAL.find(([re]) => re.test(host));
  return hit ? svg(size, hit[1]) : "";
}

/** מלכודת פוקוס קטנה לדיאלוגים (drawer/popup) - מוזרקת לתוך ה-IIFE של הבלוק. */
export const TRAP_JS = `function wbTrap(e, box) {
    if (e.key !== 'Tab') return;
    var f = box.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (document.activeElement === box) { e.preventDefault(); (e.shiftKey ? last : first).focus(); return; }
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }`;

/* ---------- גופנים ---------- */

/**
 * ברירת המחדל: גופן המערכת - בלי שום טעינה חיצונית. גופני Google הם בחירה
 * מפורשת בלבד, כי הם נטענים מה-CDN של Google באתר של הלקוח (חשיפת IP, GDPR).
 */
export const SYSTEM_FONT_STACK = `system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans Hebrew", Arial, sans-serif`;

export const FONT_OPTIONS = [
  { value: "system", label: "גופן המערכת (ללא טעינה חיצונית)" },
  { value: "Assistant", label: "Assistant (Google Fonts)" },
  { value: "Heebo", label: "Heebo (Google Fonts)" },
  { value: "Rubik", label: "Rubik (Google Fonts)" },
  { value: "Varela Round", label: "Varela Round (Google Fonts)" },
];

export const FONT_HINT =
  "גופן המערכת מוצג מיד ולא פונה לשום שרת. גופני Google נטענים מה-CDN של Google באתר שלכם - כלומר כתובת ה-IP של כל מבקר נחשפת ל-Google (רלוונטי ל-GDPR ולמדיניות הפרטיות).";

/** שם גופן נקי (אותיות ורווחים בלבד) - כדי שערך זדוני לא יוכל לשבור את ה-CSS. */
const cleanFont = (font: string | undefined) => (font ?? "").replace(/[^A-Za-z ]/g, "").trim();

/** font-family מלא: גופן Google (אם נבחר) ואחריו מחסנית המערכת כגיבוי. */
export function fontStack(font: string | undefined): string {
  const f = cleanFont(font);
  return !f || f === "system" ? SYSTEM_FONT_STACK : `'${f}', ${SYSTEM_FONT_STACK}`;
}

/** @import לגופן Google - מחרוזת ריקה לגופן המערכת. */
export function googleFontImport(font: string | undefined): string {
  const f = cleanFont(font);
  if (!f || f === "system") return "";
  return `@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(f).replace(/%20/g, "+")}:wght@400;600;700;800&display=swap');`;
}

/* ---------- אנימציות משותפות ---------- */

/** עקומות תנועה אחידות לכל הבלוקים */
export const EASE = {
  out: "cubic-bezier(.22,1,.36,1)",
  spring: "cubic-bezier(.34,1.56,.64,1)",
};

/**
 * keyframes משותפים, בשמות עם קידומת הבלוק (כדי לא להתנגש באתר המארח).
 * designCss כבר מנטרל כל אנימציה/מעבר תחת prefers-reduced-motion.
 */
export function animKeyframes(p: string): string {
  return `@keyframes ${p}-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.06); } }
@keyframes ${p}-halo { 0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--wb-accent) 55%, transparent); } 70% { box-shadow: 0 0 0 18px transparent; } 100% { box-shadow: 0 0 0 0 transparent; } }
@keyframes ${p}-spin { to { transform: rotate(360deg); } }
@keyframes ${p}-rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }`;
}

/* ---------- עיצוב משותף ---------- */

export const DESIGN_FIELDS: FieldDef[] = [
  {
    id: "themeSelect",
    aiDesignEditable: true,
    label: "סגנון עיצוב",
    type: "select",
    icon: "fa-palette",
    default: "glass",
    group: "עיצוב",
    options: [
      { value: "glass", label: "זכוכית מודרנית" },
      { value: "cyber", label: "סייברפאנק" },
      { value: "ios", label: "סגנון אפל" },
      { value: "material", label: "Google Material" },
      { value: "ocean", label: "אוקיינוס" },
      { value: "neon", label: "ניאון עתידני" },
      { value: "retro", label: "רטרו" },
    ],
  },
  {
    id: "defaultThemeMode",
    aiDesignEditable: true,
    label: "מצב תצוגה",
    type: "select",
    icon: "fa-circle-half-stroke",
    default: "dark",
    group: "עיצוב",
    options: [
      { value: "dark", label: "כהה" },
      { value: "light", label: "בהיר" },
    ],
  },
  {
    id: "accentColor",
    aiDesignEditable: true,
    label: "צבע מרכזי",
    type: "color",
    icon: "fa-eye-dropper",
    default: "#38bdf8",
    group: "עיצוב",
  },
  {
    id: "fontSelect",
    aiDesignEditable: true,
    label: "גופן",
    type: "select",
    icon: "fa-font",
    default: "system",
    group: "עיצוב",
    hint: FONT_HINT,
    options: FONT_OPTIONS,
  },
  {
    id: "dir",
    aiDesignEditable: true,
    label: "כיוון טקסט",
    type: "select",
    icon: "fa-language",
    default: "rtl",
    group: "עיצוב",
    options: [
      { value: "rtl", label: "מימין לשמאל (עברית)" },
      { value: "ltr", label: "משמאל לימין" },
    ],
  },
];

const pickDesign = makePick(DESIGN_FIELDS);

export interface Design {
  themeSelect: string;
  defaultThemeMode: string;
  accentColor: string;
  fontSelect: string;
  dir: string;
}

export function sanitizeDesign(values: BlockValues): Design {
  return {
    themeSelect: pickDesign(values, "themeSelect"),
    defaultThemeMode: pickDesign(values, "defaultThemeMode"),
    accentColor: HEX.test(values.accentColor ?? "") ? values.accentColor : "#38bdf8",
    fontSelect: pickDesign(values, "fontSelect"),
    dir: pickDesign(values, "dir"),
  };
}

export const fontImport = (d: Design) => googleFontImport(d.fontSelect);

/** משתני CSS על ה-selector של הבלוק + panelCss של הערכה (רדיוס/צל) לשימוש בכרטיסים. */
export function designCss(sel: string, d: Design): { css: string; panelCss: string } {
  const theme = getTheme(d.themeSelect, d.accentColor);
  const t = d.defaultThemeMode === "light" ? theme.light : theme.dark;
  const css = `${sel} { --wb-bg: ${t.bg}; --wb-panel: ${t.panel}; --wb-border: ${t.border}; --wb-text: ${t.text}; --wb-input: ${t.inputBg}; --wb-accent: ${d.accentColor}; font-family: ${fontStack(d.fontSelect)}; color: var(--wb-text); }
${sel}, ${sel} *, ${sel} *::before, ${sel} *::after { box-sizing: border-box; }
@media (prefers-reduced-motion: reduce) { ${sel}, ${sel} *, ${sel} *::before, ${sel} *::after { transition: none !important; animation: none !important; } }`;
  return { css, panelCss: t.panelCss };
}

/** לתצוגה המקדימה בעורך (React) - אותו חישוב ערכה כמו ב-generator. */
export function previewTheme(values: BlockValues) {
  const d = sanitizeDesign(values);
  const theme = getTheme(d.themeSelect, d.accentColor);
  const t = d.defaultThemeMode === "light" ? theme.light : theme.dark;
  return { t, accent: d.accentColor, font: fontStack(d.fontSelect), dir: d.dir === "ltr" ? ("ltr" as const) : ("rtl" as const) };
}
