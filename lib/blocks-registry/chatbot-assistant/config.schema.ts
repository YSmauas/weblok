import type { FieldDef, BlockValues } from "../types";

export const fields: FieldDef[] = [
  {
    id: "titleText",
    label: "כותרת המערכת",
    type: "text",
    icon: "fa-heading",
    default: "העוזר החכם",
    group: "תוכן",
  },
  {
    id: "welcomeMsg",
    label: "הודעת פתיחה",
    type: "text",
    icon: "fa-comment-medical",
    default: "שלום! איך אפשר לעזור היום?",
    group: "תוכן",
  },
  {
    id: "placeholder",
    label: "טקסט שדה הקלדה",
    type: "text",
    icon: "fa-i-cursor",
    default: "הקלד הודעה כאן...",
    group: "תוכן",
  },
  {
    id: "systemPrompt",
    label: "הוראות מערכת (Prompt)",
    type: "textarea",
    icon: "fa-robot",
    default: "אתה נציג שירות לקוחות אדיב. ענה בקצרה ובעברית תקנית.",
    group: "תוכן",
    // הפרומפט נשמר בצד שרת ומקושר ל-blockId. הוא לעולם לא מוטמע בקוד הלקוח.
    serverOnly: true,
  },
  {
    id: "displayMode",
    label: "מצב תצוגה",
    type: "select",
    icon: "fa-desktop",
    default: "widget",
    group: "תצוגה",
    options: [
      { value: "widget", label: "ווידג'ט צף (בועה באתר)" },
      { value: "fullscreen", label: "מסך מלא (אפליקציה)" },
    ],
  },
  {
    id: "widgetPosition",
    label: "מיקום הווידג'ט",
    type: "select",
    icon: "fa-location-dot",
    default: "right",
    group: "תצוגה",
    options: [
      { value: "right", label: "ימין למטה" },
      { value: "left", label: "שמאל למטה" },
    ],
  },
  {
    id: "accentColor",
    label: "צבע מרכזי",
    type: "color",
    icon: "fa-palette",
    default: "#e8a33d",
    group: "עיצוב",
  },
  {
    id: "fontSelect",
    label: "גופן",
    type: "select",
    icon: "fa-font",
    default: "Heebo",
    group: "עיצוב",
    options: [
      { value: "Heebo", label: "Heebo" },
      { value: "Assistant", label: "Assistant" },
      { value: "Varela Round", label: "Varela Round" },
    ],
  },
];

export function defaultValues(): BlockValues {
  return Object.fromEntries(fields.map((f) => [f.id, f.default]));
       }
        
