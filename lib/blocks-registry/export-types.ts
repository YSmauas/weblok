/**
 * מנוע הבלוקים - חוזה הייצוא המשותף לכל בלוק.
 * כל בלוק מפיק תוצר עצמאי לגמרי (HTML+CSS+JS) - בלי שרת שלנו, בלי script
 * חיצוני. שלושת הפורמטים הם 3 סריאליזציות שונות לאותו תוצר, לא 3 מימושים.
 */
export type ExportFormat = "html" | "html-css-js" | "jsx";

/** מה שכל בלוק (generator.ts) מחזיר - לפני סריאליזציה לפורמט המבוקש. */
export interface BlockOutput {
  /** תוכן ה-body (בלי <html>/<head>) */
  html: string;
  /** CSS גלובלי לבלוק (class-based, מבודד ע"י prefix כדי לא להתנגש באתר המארח) */
  css: string;
  /** JS וניל, אם צריך (למשל שליחת טופס). ריק אם הבלוק סטטי לגמרי. */
  js?: string;
  /** שם קצר לשימוש בקובץ/ה-component (למשל "ContactBlock") */
  componentName: string;
}
