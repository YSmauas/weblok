import type { BlockValues, FieldDef } from "@/lib/blocks-registry/types";
import { extractJson } from "./gemini";

/**
 * הפרומפטים וה-guardrails של "שפר עם AI" ו"עריכה עם AI" - במקום אחד, כדי
 * שהשרת (מפתח מוצפן ב-DB) והדפדפן (מפתח ששמור בדפדפן בלבד) יתנהגו זהה.
 */

export const IMPROVE_MAX_LENGTH = 2000;
export const REDESIGN_MAX_LENGTH = 500;

export function buildImprovePrompt(text: string, label: string): string {
  return `שפר את הטקסט הבא לשדה "${label.slice(0, 80)}" בבלוק אתר. שמור על אותה שפה, אותה משמעות ואורך דומה, ניסוח שיווקי קצר וברור, בלי גרשיים ובלי הסברים - רק הטקסט המשופר:\n\n${text}`;
}

/** מנקה גרשיים עוטפים שהמודל נוטה להוסיף. */
export function cleanImproved(text: string): string {
  return text.trim().replace(/^["'״]+|["'״]+$/g, "").trim();
}

export function editableFields(fields: FieldDef[]): FieldDef[] {
  return fields.filter((f) => f.aiDesignEditable);
}

export function buildRedesignPrompt(
  fields: FieldDef[],
  currentValues: BlockValues,
  description: string
): string {
  const fieldsDescription = editableFields(fields)
    .map((f) => {
      const opts = f.type === "select" ? ` אפשרויות: ${f.options?.map((o) => o.value).join(" | ")}` : "";
      const type = f.type === "color" ? " (צבע hex, למשל #38bdf8)" : "";
      return `- ${f.id} ("${f.label}")${opts}${type} - ערך נוכחי: ${String(currentValues[f.id] ?? "").slice(0, 60)}`;
    })
    .join("\n");

  return `אתה עורך עיצוב לבלוק אתר. מותר לך לשנות אך ורק את השדות המפורטים מטה, ואך ורק
לערכים המותרים שצוינו לכל שדה (לשדה select - רק אחד מהאפשרויות שנרשמו, לשדה color - קוד hex תקין).
אסור לך להוסיף שדות שלא מופיעים ברשימה, ואסור להמציא ערכים שלא הותרו.

שדות מותרים:
${fieldsDescription}

בקשת המשתמש: "${description.slice(0, REDESIGN_MAX_LENGTH)}"

החזר אך ורק אובייקט JSON שטוח של {שם_שדה: ערך_חדש} עבור השדות שאתה משנה בלבד (אל תחזיר שדות שלא משתנים).
בלי הסברים, בלי markdown, רק ה-JSON.`;
}

const HEX = /^#[0-9a-fA-F]{6}$/;

/**
 * מסנן את תשובת המודל: רק שדות aiDesignEditable, ורק ערכים מותרים.
 * כל דבר אחר נזרק בשקט. מחזיר אובייקט ריק אם אין אף שינוי תקין.
 */
export function parseRedesignChanges(raw: string, fields: FieldDef[]): Record<string, string> {
  let parsed: unknown;
  try {
    parsed = extractJson(raw);
  } catch {
    return {};
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

  const byId = new Map(editableFields(fields).map((f) => [f.id, f]));
  const changes: Record<string, string> = {};
  for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
    const field = byId.get(id);
    if (!field || typeof value !== "string") continue;
    if (field.type === "select" && field.options?.some((o) => o.value === value)) {
      changes[id] = value;
    } else if (field.type === "color" && HEX.test(value)) {
      changes[id] = value.toLowerCase();
    }
  }
  return changes;
}
