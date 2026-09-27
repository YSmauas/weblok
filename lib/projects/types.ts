/**
 * טיפוסים ועזרים של פרויקטים שמשותפים לשרת ולדפדפן. בכוונה לא "use client":
 * דף הפרויקט (Server Component) קורא ל-parseBlockRefs, ופונקציה שמיובאת
 * ממודול "use client" הופכת בשרת להפניה ללקוח ולא לפונקציה שאפשר להריץ.
 */

/** בלוק ששויך לפרויקט (נשמר ב-projects.blocks כ-jsonb) */
export interface ProjectBlockRef {
  key: string;
  slug: string;
  name: string;
  designId?: string;
}

export interface ProjectFileMeta {
  id: string;
  path: string;
  size: number;
  updated_at: string;
}

export function parseBlockRefs(raw: unknown): ProjectBlockRef[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (b): b is ProjectBlockRef =>
      !!b && typeof b === "object" && typeof b.key === "string" && typeof b.slug === "string" && typeof b.name === "string"
  );
}
