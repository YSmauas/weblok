/**
 * מודל ההרשאות של WEblok.
 *
 * guest  - כל מבקר, כולל לא רשום. גישה: דפים ציבוריים בלבד.
 * user   - משתמש רשום ומחובר. גישה: guest + /dashboard/*.
 * admin  - איש צוות עם הרשאות ניהול. גישה: user + /admin/* (חוץ מניהול מנהלים).
 * owner  - הבעלים בלבד (משתמש יחיד, מוגדר ב-DB). גישה: admin + הוספה/הסרה של מנהלים.
 *
 * ההיררכיה היא לינארית: כל דרגה מקבלת את כל מה שיש לדרגה שמתחתיה.
 */
export type Role = "guest" | "user" | "admin" | "owner";

const HIERARCHY: Role[] = ["guest", "user", "admin", "owner"];

export function roleAtLeast(role: Role | null | undefined, required: Role): boolean {
  const current = role ?? "guest";
  return HIERARCHY.indexOf(current) >= HIERARCHY.indexOf(required);
}

/** רק הבעלים רשאי לשנות תפקידים של משתמשים אחרים (למנות/להוריד מנהלים). */
export function canManageAdmins(role: Role | null | undefined): boolean {
  return role === "owner";
}

/** מפת דרישת-ההרשאה המינימלית לכל נתיב מוגן, לפי prefix. נבדקת ב-middleware.ts. */
export const PROTECTED_PREFIXES: { prefix: string; required: Role }[] = [
  { prefix: "/admin", required: "admin" },
  { prefix: "/dashboard", required: "user" },
];
