import type { BlockDefinition, BlockMeta } from "./types";
import { meta as chatbotMeta } from "./chatbot-assistant/meta";
import {
  fields as chatbotFields,
  defaultValues as chatbotDefaults,
} from "./chatbot-assistant/config.schema";
import { generate as chatbotGenerate } from "./chatbot-assistant/generator";
import { Preview as ChatbotPreview } from "./chatbot-assistant/preview";
import { meta as contactMeta } from "./contact-form/meta";
import {
  fields as contactFields,
  defaultValues as contactDefaults,
} from "./contact-form/config.schema";
import { generate as contactGenerate, toOutput as contactToOutput } from "./contact-form/generator";
import { Preview as ContactPreview } from "./contact-form/preview";

/**
 * כל בלוק חדש נרשם כאן. כדי להוסיף בלוק:
 * 1. תיקייה חדשה תחת lib/blocks-registry/<slug>/ עם meta.ts, config.schema.ts,
 *    generator.ts ו-preview.tsx (אותו interface בדיוק).
 * 2. הוספת רשומה כאן.
 * שום שינוי לא נדרש בעורך, בקטלוג או ב-API - כולם קוראים מהרשימה הזו.
 */
export const blockDefinitions: BlockDefinition[] = [
  {
    meta: chatbotMeta,
    fields: chatbotFields,
    defaultValues: chatbotDefaults,
    generate: chatbotGenerate,
    Preview: ChatbotPreview,
  },
  {
    meta: contactMeta,
    fields: contactFields,
    defaultValues: contactDefaults,
    generate: contactGenerate,
    toOutput: contactToOutput,
    Preview: ContactPreview,
  },
];

export const blocksRegistry: BlockMeta[] = blockDefinitions.map((b) => b.meta);

export function getBlockDefinition(slug: string) {
  return blockDefinitions.find((b) => b.meta.slug === slug);
}
