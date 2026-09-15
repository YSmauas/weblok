import type { BlockValues } from "../types";
import { fields } from "./config.schema";

const esc = (v: string) => v.replace(/"/g, "&quot;");

/**
 * מייצר את קוד ההטמעה שהלקוח יקבל.
 * חשוב: שדות עם serverOnly (כמו systemPrompt) לעולם לא נכנסים לכאן -
 * הם נשמרים ב-DB ומקושרים דרך blockId. ה-API Route בצד השרת הוא זה
 * שמצרף אותם לבקשה ל-Gemini/Groq בזמן ריצה, יחד עם מפתח ה-API של המשתמש.
 */
export function generate(values: BlockValues, blockId = "{{BLOCK_ID}}") {
  const clientSafeFields = fields.filter((f) => !f.serverOnly);
  const dataAttrs = clientSafeFields
    .map((f) => `  data-${f.id.toLowerCase()}="${esc(values[f.id] ?? f.default)}"`)
    .join("\n");

  return `<!-- Blocks Studio: ${values.titleText || "העוזר החכם"} -->
<script
  src="https://cdn.blocks-studio.app/embed/chatbot-assistant.js"
${dataAttrs}
  data-block-id="${blockId}"
  defer
></script>
<!--
  הערה: ה-blockId מקושר בצד השרת להוראות המערכת ולמפתחות ה-API שלכם.
  אין כאן שום מפתח גלוי - כל קריאה ל-AI עוברת דרך /api/chat בצד השרת.
-->`;
}
