import type { BlockDefinition, BlockMeta } from "./types";
import { meta as chatbotMeta } from "./chatbot-assistant/meta";
import {
  fields as chatbotFields,
  defaultValues as chatbotDefaults,
} from "./chatbot-assistant/config.schema";
import { generate as chatbotGenerate } from "./chatbot-assistant/generator";
import { Preview as ChatbotPreview } from "./chatbot-assistant/preview";

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
];

export const blocksRegistry: BlockMeta[] = blockDefinitions.map((b) => b.meta);

export function getBlockDefinition(slug: string) {
  return blockDefinitions.find((b) => b.meta.slug === slug);
}
