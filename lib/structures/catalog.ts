import type { StructureMeta } from "./types";
import { meta as rsvpMeta } from "./rsvp/meta";

/**
 * רשימת המבנים - מטא-דאטה בלבד (בלי הגנרטורים הכבדים), כדי שהתפריט, הקטלוג
 * וה-sitemap לא יגררו את כל תבניות הקוד לבאנדל של כל דף.
 */
export const structuresRegistry: StructureMeta[] = [rsvpMeta];

export const getStructureMeta = (slug: string) => structuresRegistry.find((s) => s.slug === slug);

/**
 * מבנים שמוצגים בקטלוג כ"בקרוב" בלבד: אין להם עמוד, עורך, sitemap או תפריט.
 * כשמבנה כזה נבנה בפועל - מעבירים אותו ל-structuresRegistry (ול-lib/structures/index.ts).
 */
export interface UpcomingStructure {
  slug: string;
  /** מפתחות i18n */
  name: string;
  description: string;
  /** שם אייקון ב-AppIcon */
  icon: string;
}

export const upcomingStructures: UpcomingStructure[] = [
  { slug: "shop", name: "structures.upcoming.shop.name", description: "structures.upcoming.shop.text", icon: "shop" },
];
