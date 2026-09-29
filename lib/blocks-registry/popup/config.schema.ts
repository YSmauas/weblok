import type { FieldDef, BlockValues } from "../types";
import { DESIGN_FIELDS, buildDefaults } from "../_shared/util";

const PROMO = { field: "popupType", equals: ["promo", "exit-intent"] };
const COOKIE = { field: "popupType", equals: ["cookie"] };
const MSG = { field: "popupType", equals: ["message"] };
const NOT_COOKIE = { field: "popupType", equals: ["promo", "exit-intent", "message"] };
const MSG_OR_PROMO_ONLY = { field: "popupType", equals: ["promo", "message"] };

export const fields: FieldDef[] = [
  {
    id: "popupType",
    aiDesignEditable: true,
    label: "סוג הפופאפ",
    type: "select",
    icon: "fa-window-restore",
    default: "promo",
    group: "סוג",
    options: [
      { value: "promo", label: "קידום / מבצע" },
      { value: "cookie", label: "הסכמת עוגיות" },
      { value: "exit-intent", label: "Exit-intent (כשעומדים לעזוב)" },
      { value: "message", label: "הודעה כללית" },
    ],
  },

  // קידום + exit-intent
  { id: "promoTitle", aiAssist: true, label: "כותרת", type: "text", icon: "fa-heading", default: "10% הנחה להזמנה הראשונה", group: "תוכן", dependsOn: PROMO },
  { id: "promoBody", aiAssist: true, label: "טקסט", type: "textarea", icon: "fa-paragraph", default: "הצטרפו היום וקבלו הנחה על הרכישה הראשונה.", group: "תוכן", dependsOn: PROMO },
  { id: "promoCode", label: "קוד קופון", type: "text", icon: "fa-ticket", default: "WELCOME10", group: "תוכן", dependsOn: PROMO, hint: "רשות. מוצג עם כפתור העתקה. ריק = בלי קוד." },
  { id: "ctaText", aiAssist: true, label: "טקסט כפתור", type: "text", icon: "fa-hand-pointer", default: "למימוש ההטבה", group: "תוכן", dependsOn: PROMO },
  { id: "ctaUrl", label: "קישור הכפתור", type: "text", icon: "fa-link", default: "/", group: "תוכן", dependsOn: PROMO },

  // עוגיות
  { id: "cookieTitle", aiAssist: true, label: "כותרת", type: "text", icon: "fa-heading", default: "אנחנו משתמשים בעוגיות", group: "תוכן", dependsOn: COOKIE },
  {
    id: "cookieBody",
    aiAssist: true,
    label: "טקסט",
    type: "textarea",
    icon: "fa-paragraph",
    default: "האתר משתמש בעוגיות כדי לשפר את החוויה ולמדוד שימוש. אפשר לאשר או לדחות.",
    group: "תוכן",
    dependsOn: COOKIE,
  },
  { id: "acceptText", label: "טקסט כפתור אישור", type: "text", icon: "fa-check", default: "אישור", group: "תוכן", dependsOn: COOKIE },
  { id: "declineText", label: "טקסט כפתור דחייה", type: "text", icon: "fa-xmark", default: "דחייה", group: "תוכן", dependsOn: COOKIE },
  { id: "policyText", label: "טקסט קישור למדיניות", type: "text", icon: "fa-shield", default: "מדיניות פרטיות", group: "תוכן", dependsOn: COOKIE },
  {
    id: "policyUrl",
    label: "קישור למדיניות",
    type: "text",
    icon: "fa-link",
    default: "/privacy",
    group: "תוכן",
    dependsOn: COOKIE,
    hint: "הבחירה נשמרת בדפדפן, ונשלח אירוע weblok:consent שאפשר להאזין לו כדי להפעיל סקריפטי מעקב רק אחרי אישור.",
  },

  // הודעה כללית
  { id: "msgTitle", aiAssist: true, label: "כותרת", type: "text", icon: "fa-heading", default: "הודעה חשובה", group: "תוכן", dependsOn: MSG },
  { id: "msgBody", aiAssist: true, label: "טקסט", type: "textarea", icon: "fa-paragraph", default: "האתר יהיה סגור לרגל החג. נשוב לפעילות רגילה ביום ראשון.", group: "תוכן", dependsOn: MSG },
  { id: "msgBtnText", label: "טקסט כפתור סגירה", type: "text", icon: "fa-check", default: "הבנתי", group: "תוכן", dependsOn: MSG },

  // התנהגות
  {
    id: "trigger",
    aiDesignEditable: true,
    label: "מתי להציג",
    type: "select",
    icon: "fa-clock",
    default: "delay5",
    group: "התנהגות",
    dependsOn: MSG_OR_PROMO_ONLY,
    hint: "ב-Exit-intent הפופאפ מופיע כשהעכבר יוצא מהחלון (במסכי מגע: אחרי 25 שניות). בעוגיות - מיד בטעינה.",
    options: [
      { value: "immediate", label: "מיד בטעינה" },
      { value: "delay5", label: "אחרי 5 שניות" },
      { value: "delay15", label: "אחרי 15 שניות" },
      { value: "scroll50", label: "אחרי גלילה של חצי עמוד" },
    ],
  },
  {
    id: "frequency",
    aiDesignEditable: true,
    label: "תדירות הצגה לאותו מבקר",
    type: "select",
    icon: "fa-repeat",
    default: "session",
    group: "התנהגות",
    dependsOn: NOT_COOKIE,
    hint: "בעוגיות הבחירה נשמרת ולא מוצגת שוב.",
    options: [
      { value: "session", label: "פעם אחת בכל ביקור" },
      { value: "day", label: "פעם ביום" },
      { value: "week", label: "פעם בשבוע" },
      { value: "once", label: "פעם אחת בלבד" },
      { value: "always", label: "בכל טעינה (לבדיקות)" },
    ],
  },

  // תצוגה
  {
    id: "layout",
    aiDesignEditable: true,
    label: "צורת תצוגה",
    type: "select",
    icon: "fa-window-maximize",
    default: "modal",
    group: "תצוגה",
    dependsOn: NOT_COOKIE,
    options: [
      { value: "modal", label: "חלון במרכז עם רקע מעומעם" },
      { value: "corner", label: "כרטיס בפינה" },
    ],
  },
  {
    id: "cookieLayout",
    aiDesignEditable: true,
    label: "צורת תצוגה",
    type: "select",
    icon: "fa-window-maximize",
    default: "bar",
    group: "תצוגה",
    dependsOn: COOKIE,
    options: [
      { value: "bar", label: "פס בתחתית המסך" },
      { value: "corner", label: "כרטיס בפינה" },
    ],
  },
  {
    id: "cornerSide",
    aiDesignEditable: true,
    label: "פינה (בתצוגת כרטיס בפינה)",
    type: "select",
    icon: "fa-arrows-left-right",
    default: "right",
    group: "תצוגה",
    options: [
      { value: "right", label: "ימין למטה" },
      { value: "left", label: "שמאל למטה" },
    ],
  },
  ...DESIGN_FIELDS,
];

export function defaultValues(): BlockValues {
  return buildDefaults(fields);
}
