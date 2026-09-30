import type { FieldDef, BlockValues } from "../types";
import { DESIGN_FIELDS, buildDefaults } from "../_shared/util";

export const fields: FieldDef[] = [
  { id: "brandText", aiAssist: true, label: "שם האתר", type: "text", icon: "fa-signature", default: "האתר שלי", group: "מותג" },
  {
    id: "logoUrl",
    label: "כתובת לוגו (תמונה)",
    type: "text",
    icon: "fa-image",
    default: "",
    group: "מותג",
    hint: "רשות. https://... או נתיב שמתחיל ב-/ . אם ריק - מוצג רק שם האתר.",
  },
  { id: "brandUrl", label: "קישור הלוגו", type: "text", icon: "fa-link", default: "/", group: "מותג" },
  {
    id: "navLinks",
    label: "קישורי ניווט",
    type: "textarea",
    icon: "fa-bars",
    default: "בית | /\nאודות | /about\nשירותים | /services",
    group: "ניווט",
    hint: "שורה לכל קישור, בפורמט: טקסט | כתובת. עד 8 קישורים. הקישור של העמוד הנוכחי מסומן אוטומטית.",
  },
  { id: "ctaText", aiAssist: true, label: "טקסט כפתור פעולה", type: "text", icon: "fa-hand-pointer", default: "צור קשר", group: "ניווט", hint: "ריק = בלי כפתור." },
  { id: "ctaUrl", label: "קישור הכפתור", type: "text", icon: "fa-link", default: "/contact", group: "ניווט" },
  {
    id: "headerStyle",
    aiDesignEditable: true,
    label: "סגנון",
    type: "select",
    icon: "fa-layer-group",
    default: "glass",
    group: "תצוגה",
    options: [
      { value: "glass", label: "זכוכית שקופה (מטשטשת את מה שמאחור)" },
      { value: "solid", label: "רקע מלא" },
      { value: "floating", label: "כותרת צפה מעוגלת" },
    ],
  },
  {
    id: "headerLayout",
    aiDesignEditable: true,
    label: "פריסה",
    type: "select",
    icon: "fa-table-columns",
    default: "spread",
    group: "תצוגה",
    options: [
      { value: "spread", label: "לוגו בצד, תפריט בצד השני" },
      { value: "logo-center", label: "לוגו באמצע, תפריט וכפתור בצדדים" },
      { value: "center", label: "ממורכז (לוגו מעל התפריט)" },
    ],
  },
  {
    id: "stickyMode",
    aiDesignEditable: true,
    label: "התנהגות בגלילה",
    type: "select",
    icon: "fa-thumbtack",
    default: "sticky",
    group: "תצוגה",
    options: [
      { value: "sticky", label: "נשארת דבוקה למעלה" },
      { value: "autohide", label: "נעלמת בגלילה למטה, חוזרת בגלילה למעלה" },
      { value: "static", label: "גוללת עם העמוד" },
    ],
  },
  {
    id: "shrinkOnScroll",
    aiDesignEditable: true,
    label: "התכווצות בגלילה",
    type: "select",
    icon: "fa-compress",
    default: "yes",
    group: "תצוגה",
    dependsOn: { field: "stickyMode", equals: ["sticky", "autohide"] },
    options: [
      { value: "yes", label: "מתכווצת ומקבלת צל אחרי גלילה" },
      { value: "no", label: "גובה קבוע" },
    ],
  },
  ...DESIGN_FIELDS,
];

export function defaultValues(): BlockValues {
  return buildDefaults(fields);
}
