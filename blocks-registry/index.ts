import type { BlockDefinition, BlockMeta } from "./types";
import { meta as chatbotMeta } from "./chatbot-assistant/meta";
import {
  fields as chatbotFields,
  defaultValues as chatbotDefaults,
} from "./chatbot-assistant/config.schema";
import { generate as chatbotGenerate, toOutput as chatbotToOutput } from "./chatbot-assistant/generator";
import { Preview as ChatbotPreview } from "./chatbot-assistant/preview";
import { meta as contactMeta } from "./contact-form/meta";
import {
  fields as contactFields,
  defaultValues as contactDefaults,
} from "./contact-form/config.schema";
import { generate as contactGenerate, toOutput as contactToOutput } from "./contact-form/generator";
import { Preview as ContactPreview } from "./contact-form/preview";
import { meta as headerMeta } from "./site-header/meta";
import {
  fields as headerFields,
  defaultValues as headerDefaults,
} from "./site-header/config.schema";
import { generate as headerGenerate, toOutput as headerToOutput } from "./site-header/generator";
import { Preview as HeaderPreview } from "./site-header/preview";
import { meta as footerMeta } from "./site-footer/meta";
import {
  fields as footerFields,
  defaultValues as footerDefaults,
} from "./site-footer/config.schema";
import { generate as footerGenerate, toOutput as footerToOutput } from "./site-footer/generator";
import { Preview as FooterPreview } from "./site-footer/preview";
import { meta as sidebarMeta } from "./site-sidebar/meta";
import {
  fields as sidebarFields,
  defaultValues as sidebarDefaults,
} from "./site-sidebar/config.schema";
import { generate as sidebarGenerate, toOutput as sidebarToOutput } from "./site-sidebar/generator";
import { Preview as SidebarPreview } from "./site-sidebar/preview";
import { meta as popupMeta } from "./popup/meta";
import {
  fields as popupFields,
  defaultValues as popupDefaults,
} from "./popup/config.schema";
import { generate as popupGenerate, toOutput as popupToOutput } from "./popup/generator";
import { Preview as PopupPreview } from "./popup/preview";

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
    toOutput: chatbotToOutput,
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
  {
    meta: headerMeta,
    fields: headerFields,
    defaultValues: headerDefaults,
    generate: headerGenerate,
    toOutput: headerToOutput,
    Preview: HeaderPreview,
  },
  {
    meta: footerMeta,
    fields: footerFields,
    defaultValues: footerDefaults,
    generate: footerGenerate,
    toOutput: footerToOutput,
    Preview: FooterPreview,
  },
  {
    meta: sidebarMeta,
    fields: sidebarFields,
    defaultValues: sidebarDefaults,
    generate: sidebarGenerate,
    toOutput: sidebarToOutput,
    Preview: SidebarPreview,
  },
  {
    meta: popupMeta,
    fields: popupFields,
    defaultValues: popupDefaults,
    generate: popupGenerate,
    toOutput: popupToOutput,
    Preview: PopupPreview,
  },
];

export const blocksRegistry: BlockMeta[] = blockDefinitions.map((b) => b.meta);

export function getBlockDefinition(slug: string) {
  return blockDefinitions.find((b) => b.meta.slug === slug);
}
