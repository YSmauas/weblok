import { blockDefinitions } from "@/lib/blocks-registry";
import type { BlockValues } from "@/lib/blocks-registry/types";
import type { InjectBlock } from "./core";

/** בלוקים מהקטלוג בערכי ברירת המחדל שלהם - זמינים לכולם, גם בלי חשבון. */
export function defaultInjectBlocks(): InjectBlock[] {
  return blockDefinitions
    .filter((d) => d.toOutput)
    .map((d) => ({ key: `default:${d.meta.slug}`, slug: d.meta.slug, name: d.meta.name, values: d.defaultValues() }));
}

/** עיצוב שמור (מה-DB) → בלוק להזרקה. מחזיר null לבלוקים שעוד לא תומכים בייצוא. */
export function designToInjectBlock(design: {
  id: string;
  name: string;
  block_slug: string;
  config: unknown;
}): InjectBlock | null {
  const def = blockDefinitions.find((d) => d.meta.slug === design.block_slug);
  if (!def?.toOutput) return null;
  const config = design.config && typeof design.config === "object" ? (design.config as Record<string, unknown>) : {};
  const values: BlockValues = def.defaultValues();
  for (const f of def.fields) if (typeof config[f.id] === "string") values[f.id] = config[f.id] as string;
  return { key: `design:${design.id}`, slug: def.meta.slug, name: design.name, values };
}

/**
 * העברה מהעורך לכלי ההזרקה: העורך שומר את הבלוק הנוכחי ב-sessionStorage (רק
 * בלשונית הזו, בלי שרת), וכלי ההזרקה קורא אותו ומסמן אותו מראש.
 */
const DRAFT_KEY = "weblok-inject-draft";

export function saveEditorDraft(block: { slug: string; name: string; values: BlockValues }) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(block));
  } catch {
    /* אין sessionStorage - המשתמש יבחר את הבלוק ידנית */
  }
}

export function readEditorDraft(): InjectBlock | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as { slug?: unknown; name?: unknown; values?: unknown };
    const def = blockDefinitions.find((b) => b.meta.slug === d.slug);
    if (!def?.toOutput || typeof d.name !== "string" || !d.values || typeof d.values !== "object") return null;
    const values: BlockValues = def.defaultValues();
    for (const f of def.fields) {
      const v = (d.values as Record<string, unknown>)[f.id];
      if (typeof v === "string") values[f.id] = v;
    }
    return { key: "draft", slug: def.meta.slug, name: d.name.slice(0, 100), values };
  } catch {
    return null;
  }
}
