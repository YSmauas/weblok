import type { BlockValues } from "../types";
import { fields } from "./config.schema";

const esc = (v: string) =>
  v
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

// טקסט בתוך הערת HTML: אסור שיכיל "--" או ">" שסוגרים את ההערה ומאפשרים הזרקת <script>
const commentSafe = (v: string) => v.replace(/-{2,}/g, "-").replace(/[<>]/g, "");

const BLOCK_ID = /^(\{\{BLOCK_ID\}\}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

/**
 * מייצר את קוד ההטמעה שהלקוח יקבל.
 * חשוב: שדות עם serverOnly (כמו systemPrompt) לעולם לא נכנסים לכאן -
 * הם נשמרים ב-DB ומקושרים דרך blockId. ה-API Route בצד השרת הוא זה
 * שמצרף אותם לבקשה ל-Gemini בזמן ריצה, יחד עם מפתח ה-API של המשתמש.
 */
export function generate(values: BlockValues, blockId = "{{BLOCK_ID}}") {
  if (!BLOCK_ID.test(blockId)) blockId = "{{BLOCK_ID}}";
  const clientSafeFields = fields.filter((f) => !f.serverOnly);
  const dataAttrs = clientSafeFields
    .map((f) => `  data-${f.id.toLowerCase()}="${esc(values[f.id] ?? f.default)}"`)
    .join("\n");

  return `<!-- Blocks Studio: ${commentSafe(values.titleText || "העוזר החכם")} -->
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
