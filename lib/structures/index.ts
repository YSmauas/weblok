import type { StructureDefinition } from "./types";
import { meta as rsvpMeta } from "./rsvp/meta";
import { fields as rsvpFields, defaultValues as rsvpDefaults } from "./rsvp/fields";
import { generate as rsvpGenerate } from "./rsvp/generator";
import { previewHtml as rsvpPreview } from "./rsvp/preview";

/**
 * רישום המבנים. מבנה חדש = תיקייה תחת lib/structures/<slug>/ (meta, fields,
 * generator, preview) + רשומה כאן ו-meta ב-catalog.ts (לתפריט/קטלוג/sitemap).
 */
export const structureDefinitions: StructureDefinition[] = [
  {
    meta: rsvpMeta,
    fields: rsvpFields,
    defaultValues: rsvpDefaults,
    generate: rsvpGenerate,
    previewHtml: rsvpPreview,
  },
];

export function getStructureDefinition(slug: string) {
  return structureDefinitions.find((s) => s.meta.slug === slug);
}
