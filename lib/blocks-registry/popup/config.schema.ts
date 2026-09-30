import type { FieldDef, BlockValues } from "../types";
import { DESIGN_FIELDS, buildDefaults } from "../_shared/util";

const PROMO = { field: "popupType", equals: ["promo", "exit-intent"] };
const COOKIE = { field: "popupType", equals: ["cookie"] };
const MSG = { field: "popupType", equals: ["message"] };
const NOT_COOKIE = { field: "popupType", equals: ["promo", "exit-intent", "message"] };
const MSG_OR_PROMO_ONLY = { field: "popupType", equals: ["promo", "message"] };
// launcherText תלוי ב-launcher, שבעצמו מוסתר בעוגיות - הטופס מסתיר גם אותו (תלות שרשרת)
const HAS_LAUNCHER = { field: "launcher", equals: ["pulse", "glow"] };
const COOKIE_REOPEN = { field: "cookieReopen", equals: ["yes"] };

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
    hint: "הבחירה נשמרת בדפדפן (localStorage, מפתח wbp-cookie), ונשלח אירוע weblok:consent. כדי שהבחירה באמת תשפיע על עוגיות וסקריפטים - ר' המדריך המלא שמקושר מעל ההגדרות.",
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
    hint: "ב-Exit-intent הפופאפ מופיע כשהעכבר יוצא מהחלון (במסכי מגע: אחרי 25 שניות). בעוגיות - מיד בטעינה. \"רק בלחיצה\" מתאים עם כפתור השקה (בקבוצת אנימציה).",
    options: [
      { value: "immediate", label: "מיד בטעינה" },
      { value: "delay5", label: "אחרי 5 שניות" },
      { value: "delay15", label: "אחרי 15 שניות" },
      { value: "scroll50", label: "אחרי גלילה של חצי עמוד" },
      { value: "manual", label: "רק בלחיצה על כפתור ההשקה" },
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
    hint: "בעוגיות הבחירה נשמרת ולא מוצגת שוב. כפתור השקה (אם יש) פותח את הפופאפ תמיד, בלי קשר לתדירות.",
    options: [
      { value: "session", label: "פעם אחת בכל ביקור" },
      { value: "day", label: "פעם ביום" },
      { value: "week", label: "פעם בשבוע" },
      { value: "once", label: "פעם אחת בלבד" },
      { value: "always", label: "בכל טעינה (לבדיקות)" },
    ],
  },
  {
    id: "cookieReopen",
    aiDesignEditable: true,
    label: "כפתור לשינוי הבחירה",
    type: "select",
    icon: "fa-cookie",
    default: "no",
    group: "התנהגות",
    dependsOn: COOKIE,
    hint: "כפתור עוגייה קטן בפינה שמופיע אחרי שהמבקר בחר, ומאפשר לו לחזור בו (דרישה נפוצה ב-GDPR). כל בחירה חדשה שולחת שוב את האירוע weblok:consent.",
    options: [
      { value: "no", label: "בלי" },
      { value: "yes", label: "כפתור עוגייה בפינה" },
    ],
  },
  { id: "reopenLabel", label: "תיאור כפתור העוגייה (לקוראי מסך)", type: "text", icon: "fa-universal-access", default: "הגדרות עוגיות", group: "התנהגות", dependsOn: COOKIE_REOPEN },

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
      { value: "modal", label: "חלון במרכז" },
      { value: "sheet", label: "מגירה מלמטה (Bottom sheet)" },
      { value: "corner", label: "כרטיס/טוסט בפינה" },
      { value: "bubble", label: "בועה עגולה עם הילה זוהרת" },
      { value: "fullscreen", label: "מסך מלא" },
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
      { value: "sheet", label: "מגירה מלמטה" },
      { value: "modal", label: "חלון במרכז (חוסם עד בחירה)" },
    ],
  },
  {
    id: "cornerSide",
    aiDesignEditable: true,
    label: "פינה (כרטיס בפינה / כפתורים צפים)",
    type: "select",
    icon: "fa-arrows-left-right",
    default: "right",
    group: "תצוגה",
    options: [
      { value: "right", label: "ימין למטה" },
      { value: "left", label: "שמאל למטה" },
    ],
  },
  {
    id: "backdrop",
    aiDesignEditable: true,
    label: "רקע מאחורי הפופאפ",
    type: "select",
    icon: "fa-layer-group",
    default: "dim",
    group: "תצוגה",
    hint: "חל על חלון במרכז, מגירה מלמטה, בועה ומסך מלא. \"בלי רקע\" = האתר נשאר לחיץ מאחור.",
    options: [
      { value: "dim", label: "מעומעם" },
      { value: "blur", label: "מטושטש (זכוכית)" },
      { value: "none", label: "בלי רקע" },
    ],
  },

  // אנימציה
  {
    id: "entryEffect",
    aiDesignEditable: true,
    label: "אפקט כניסה",
    type: "select",
    icon: "fa-wand-magic-sparkles",
    default: "spring",
    group: "אנימציה",
    hint: "מבקרים שביקשו \"הפחתת תנועה\" במערכת ההפעלה יראו את הפופאפ בלי אנימציה.",
    options: [
      { value: "spring", label: "קפיצי (Spring)" },
      { value: "fade", label: "הופעה הדרגתית" },
      { value: "zoom", label: "זום" },
      { value: "slide", label: "החלקה מהקצה" },
      { value: "blur", label: "מטושטש לחד" },
    ],
  },
  {
    id: "launcher",
    aiDesignEditable: true,
    label: "כפתור השקה צף",
    type: "select",
    icon: "fa-bullhorn",
    default: "none",
    group: "אנימציה",
    dependsOn: NOT_COOKIE,
    hint: "כפתור קטן בפינה שמזמין לפתוח את הפופאפ - גם אחרי שנסגר.",
    options: [
      { value: "none", label: "בלי" },
      { value: "pulse", label: "כפתור פועם בעדינות" },
      { value: "glow", label: "כפתור עם הילה זוהרת" },
    ],
  },
  { id: "launcherText", aiAssist: true, label: "טקסט כפתור ההשקה", type: "text", icon: "fa-font", default: "מתנה בשבילך", group: "אנימציה", dependsOn: HAS_LAUNCHER, hint: "ריק = כפתור עגול עם אייקון בלבד." },
  ...DESIGN_FIELDS,
];

export function defaultValues(): BlockValues {
  return buildDefaults(fields);
}
