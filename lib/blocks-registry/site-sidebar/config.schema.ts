import type { FieldDef, BlockValues } from "../types";
import { DESIGN_FIELDS, buildDefaults } from "../_shared/util";

export const fields: FieldDef[] = [
  { id: "drawerTitle", aiAssist: true, label: "כותרת הווילון", type: "text", icon: "fa-heading", default: "תפריט", group: "תוכן" },
  {
    id: "navLinks",
    label: "קישורים",
    type: "textarea",
    icon: "fa-bars",
    default: "בית | /\nאודות | /about\nשירותים | /services\nצור קשר | /contact",
    group: "תוכן",
    hint: "שורה לכל קישור, בפורמט: טקסט | כתובת. עד 10 קישורים.",
  },
  { id: "ctaText", aiAssist: true, label: "טקסט כפתור פעולה", type: "text", icon: "fa-hand-pointer", default: "", group: "תוכן", hint: "ריק = בלי כפתור." },
  { id: "ctaUrl", label: "קישור הכפתור", type: "text", icon: "fa-link", default: "", group: "תוכן" },
  { id: "noteText", aiAssist: true, label: "הערה בתחתית הווילון", type: "textarea", icon: "fa-paragraph", default: "", group: "תוכן", hint: "רשות - למשל שעות פעילות או טלפון." },
  {
    id: "triggerStyle",
    aiDesignEditable: true,
    label: "כפתור פתיחה",
    type: "select",
    icon: "fa-hand-pointer",
    default: "button-top",
    group: "תצוגה",
    options: [
      { value: "button-top", label: "כפתור עגול בפינה עליונה" },
      { value: "button-bottom", label: "כפתור עגול בפינה תחתונה" },
      { value: "edge-tab", label: "לשונית בשולי המסך" },
    ],
  },
  { id: "triggerLabel", label: "תיאור הכפתור (לקוראי מסך)", type: "text", icon: "fa-universal-access", default: "פתיחת תפריט", group: "תצוגה" },
  {
    id: "drawerSide",
    aiDesignEditable: true,
    label: "צד הפתיחה",
    type: "select",
    icon: "fa-arrows-left-right",
    default: "right",
    group: "תצוגה",
    options: [
      { value: "right", label: "ימין" },
      { value: "left", label: "שמאל" },
    ],
  },
  {
    id: "drawerWidth",
    aiDesignEditable: true,
    label: "רוחב",
    type: "select",
    icon: "fa-arrows-left-right-to-line",
    default: "medium",
    group: "תצוגה",
    options: [
      { value: "narrow", label: "צר" },
      { value: "medium", label: "בינוני" },
      { value: "wide", label: "רחב" },
    ],
  },
  ...DESIGN_FIELDS,
];

export function defaultValues(): BlockValues {
  return buildDefaults(fields);
}
