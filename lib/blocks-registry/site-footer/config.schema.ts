import type { FieldDef, BlockValues } from "../types";
import { DESIGN_FIELDS, buildDefaults } from "../_shared/util";

const COLS = { field: "footerLayout", equals: ["columns"] };

export const fields: FieldDef[] = [
  { id: "brandText", aiAssist: true, label: "שם האתר", type: "text", icon: "fa-signature", default: "האתר שלי", group: "תוכן" },
  { id: "tagline", aiAssist: true, label: "משפט קצר על האתר", type: "textarea", icon: "fa-paragraph", default: "אנחנו כאן כדי לעזור לכם להצליח.", group: "תוכן" },
  {
    id: "copyrightText",
    label: "שורת זכויות יוצרים",
    type: "text",
    icon: "fa-copyright",
    default: "© {year} כל הזכויות שמורות",
    group: "תוכן",
    hint: "{year} מוחלף אוטומטית בשנה הנוכחית.",
  },
  {
    id: "col1Title",
    label: "כותרת עמודת קישורים 1",
    type: "text",
    icon: "fa-heading",
    default: "ניווט",
    group: "קישורים",
    dependsOn: COLS,
  },
  {
    id: "col1Links",
    label: "קישורים (עמודה 1)",
    type: "textarea",
    icon: "fa-link",
    default: "בית | /\nאודות | /about\nשירותים | /services",
    group: "קישורים",
    hint: "שורה לכל קישור: טקסט | כתובת. עד 8. בפריסות \"פשוטה\" ו\"שורה אחת\" הקישורים האלה מוצגים בשורה.",
  },
  { id: "col2Title", label: "כותרת עמודת קישורים 2", type: "text", icon: "fa-heading", default: "מידע", group: "קישורים", dependsOn: COLS },
  {
    id: "col2Links",
    label: "קישורים (עמודה 2)",
    type: "textarea",
    icon: "fa-link",
    default: "מדיניות פרטיות | /privacy\nתנאי שימוש | /terms\nצור קשר | /contact",
    group: "קישורים",
    dependsOn: COLS,
  },
  {
    id: "socialLinks",
    label: "רשתות חברתיות",
    type: "textarea",
    icon: "fa-share-nodes",
    default: "Instagram | https://instagram.com/\nFacebook | https://facebook.com/\nLinkedIn | https://linkedin.com/",
    group: "קישורים",
    hint: "שורה לכל רשת: שם | כתובת מלאה (https). עד 6. Instagram, Facebook, X, LinkedIn, YouTube, TikTok, GitHub, WhatsApp ו-Telegram מקבלים אייקון אוטומטית.",
  },
  {
    id: "footerLayout",
    aiDesignEditable: true,
    label: "פריסה",
    type: "select",
    icon: "fa-table-columns",
    default: "columns",
    group: "תצוגה",
    options: [
      { value: "columns", label: "עמודות" },
      { value: "split", label: "שורה אחת (מותג וקישורים משני הצדדים)" },
      { value: "simple", label: "פשוטה וממורכזת" },
    ],
  },
  {
    id: "socialStyle",
    aiDesignEditable: true,
    label: "תצוגת רשתות חברתיות",
    type: "select",
    icon: "fa-icons",
    default: "icons",
    group: "תצוגה",
    options: [
      { value: "icons", label: "אייקונים עגולים" },
      { value: "pills", label: "תגיות טקסט" },
    ],
  },
  {
    id: "footerDecor",
    aiDesignEditable: true,
    label: "קישוט עליון",
    type: "select",
    icon: "fa-wand-magic-sparkles",
    default: "line",
    group: "תצוגה",
    options: [
      { value: "line", label: "קו מדורג בצבע המרכזי" },
      { value: "glow", label: "זוהר עדין" },
      { value: "none", label: "בלי" },
    ],
  },
  {
    id: "backToTop",
    aiDesignEditable: true,
    label: "כפתור \"חזרה למעלה\"",
    type: "select",
    icon: "fa-arrow-up",
    default: "yes",
    group: "תצוגה",
    options: [
      { value: "yes", label: "מוצג" },
      { value: "no", label: "מוסתר" },
    ],
  },
  ...DESIGN_FIELDS,
];

export function defaultValues(): BlockValues {
  return buildDefaults(fields);
}
