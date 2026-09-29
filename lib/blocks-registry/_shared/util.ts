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

export const ICON = {
  menu: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
  close: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m18 6-12 12M6 6l12 12"/></svg>',
};

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
    default: "Heebo",
    group: "עיצוב",
    options: [
      { value: "Assistant", label: "Assistant" },
      { value: "Heebo", label: "Heebo" },
      { value: "Rubik", label: "Rubik" },
      { value: "Varela Round", label: "Varela Round" },
    ],
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

export const fontImport = (d: Design) =>
  `@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(d.fontSelect).replace(/%20/g, "+")}:wght@400;600;700;800&display=swap');`;

/** משתני CSS על ה-selector של הבלוק + panelCss של הערכה (רדיוס/צל) לשימוש בכרטיסים. */
export function designCss(sel: string, d: Design): { css: string; panelCss: string } {
  const theme = getTheme(d.themeSelect, d.accentColor);
  const t = d.defaultThemeMode === "light" ? theme.light : theme.dark;
  const css = `${sel} { --wb-bg: ${t.bg}; --wb-panel: ${t.panel}; --wb-border: ${t.border}; --wb-text: ${t.text}; --wb-input: ${t.inputBg}; --wb-accent: ${d.accentColor}; font-family: '${d.fontSelect}', sans-serif; color: var(--wb-text); }
${sel}, ${sel} *, ${sel} *::before, ${sel} *::after { box-sizing: border-box; }
@media (prefers-reduced-motion: reduce) { ${sel} * { transition: none !important; animation: none !important; } }`;
  return { css, panelCss: t.panelCss };
}

/** לתצוגה המקדימה בעורך (React) - אותו חישוב ערכה כמו ב-generator. */
export function previewTheme(values: BlockValues) {
  const d = sanitizeDesign(values);
  const theme = getTheme(d.themeSelect, d.accentColor);
  const t = d.defaultThemeMode === "light" ? theme.light : theme.dark;
  return { t, accent: d.accentColor, font: d.fontSelect, dir: d.dir === "ltr" ? ("ltr" as const) : ("rtl" as const) };
}
