import type { FieldDef, BlockValues } from "../types";
import { DESIGN_FIELDS, buildDefaults } from "../_shared/util";

const COLS = { field: "footerLayout", equals: ["columns"] };

export const fields: FieldDef[] = [
  { id: "brandText", aiAssist: true, label: "שם האתר", type: "text", icon: "fa-signature", default: "האתר שלי", group: "תוכן" },
  { id: "tagline", aiAssist: true, label: "משפט קצר על האתר", type: "textarea", icon: "fa-paragraph", default: "אנחנו כאן כדי לעזור לכם להצליח.", group: "תוכן" },
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
    hint: "שורה לכל קישור: טקסט | כתובת. עד 8. בפריסה הפשוטה הקישורים האלה מוצגים בשורה אחת.",
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
    default: "",
    group: "קישורים",
    hint: "שורה לכל רשת: שם | כתובת מלאה. למשל: Instagram | https://instagram.com/... . עד 6.",
  },
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
    id: "footerLayout",
    aiDesignEditable: true,
    label: "פריסה",
    type: "select",
    icon: "fa-table-columns",
    default: "columns",
    group: "תצוגה",
    options: [
      { value: "columns", label: "עמודות" },
      { value: "simple", label: "פשוטה וממורכזת" },
    ],
  },
  ...DESIGN_FIELDS,
];

export function defaultValues(): BlockValues {
  return buildDefaults(fields);
}
