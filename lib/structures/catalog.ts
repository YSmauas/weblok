import type { StructureMeta } from "./types";
import { meta as rsvpMeta } from "./rsvp/meta";

/**
 * רשימת המבנים - מטא-דאטה בלבד (בלי הגנרטורים הכבדים), כדי שהתפריט, הקטלוג
 * וה-sitemap לא יגררו את כל תבניות הקוד לבאנדל של כל דף.
 */
export const structuresRegistry: StructureMeta[] = [rsvpMeta];

export const getStructureMeta = (slug: string) => structuresRegistry.find((s) => s.slug === slug);
