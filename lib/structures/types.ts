/**
 * "מבנים" - פרויקטים מלאים ומוכנים לפריסה (לא בלוק להטמעה). כל מבנה מייצר
 * ריפו שלם שרץ על ה-Vercel וה-Supabase של הלקוח עצמו - שום נתון לא נשאר אצלנו.
 *
 * שדות העורך כאן נפרדים מ-FieldDef של הבלוקים: התוויות הן מפתחות i18n,
 * ויש סוגי שדות נוספים (תאריך, שעה, מספר, טווח, תמונה).
 */

export type StructureFieldType =
  | "text"
  | "textarea"
  | "select"
  | "color"
  | "date"
  | "time"
  | "number"
  | "range"
  | "image";

export interface StructureFieldOption {
  value: string;
  /** מפתח i18n */
  label: string;
}

export interface StructureField {
  id: string;
  /** מפתח i18n */
  label: string;
  type: StructureFieldType;
  default: string;
  /** מפתח i18n של הקבוצה בפאנל */
  group: string;
  /** מפתח i18n להסבר קצר */
  hint?: string;
  options?: StructureFieldOption[];
  maxLength?: number;
  min?: number;
  max?: number;
  /** שדות טכניים (קישורים) נכתבים משמאל לימין גם בממשק עברי */
  ltr?: boolean;
  dependsOn?: { field: string; equals: string[] };
}

export type StructureValues = Record<string, string>;

/** תמונה שהמשתמש העלה - נשמרת בזיכרון הדפדפן בלבד ונכנסת לפרויקט כקובץ בינארי. */
export interface StructureImage {
  ext: "jpg" | "png" | "webp";
  mime: "image/jpeg" | "image/png" | "image/webp";
  base64: string;
  size: number;
}

/** קובץ בפרויקט המיוצא: טקסט (UTF-8) או בינארי כ-base64. */
export type GeneratedFile = string | { base64: string };
export type GeneratedProject = Record<string, GeneratedFile>;

export interface StructureMeta {
  slug: string;
  /** מפתחות i18n */
  name: string;
  description: string;
  /** שם אייקון ב-AppIcon */
  icon: string;
  /** שם ריפו מוצע */
  repoName: string;
  /** תגיות SEO בעברית (רכיבי שרת לא יכולים לתרגם) */
  seoTitle: string;
  seoDescription: string;
}

export interface StructureDefinition {
  meta: StructureMeta;
  fields: StructureField[];
  defaultValues: () => StructureValues;
  /** כל קבצי הפרויקט (נתיב → תוכן). לעולם לא כולל סודות. */
  generate: (values: StructureValues, image: StructureImage | null) => GeneratedProject;
  /** מסמך HTML סטטי לתצוגה המקדימה (רץ ב-iframe מבודד) */
  previewHtml: (values: StructureValues, image: StructureImage | null) => string;
}
