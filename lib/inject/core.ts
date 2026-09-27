import { getBlockDefinition } from "@/lib/blocks-registry";
import type { BlockValues } from "@/lib/blocks-registry/types";
import { toUnifiedHtml } from "@/lib/blocks-registry/export";
import { extractJson } from "@/lib/ai/gemini";
import { GENERATOR_META, SITE_NAME } from "@/lib/site";

/**
 * מנוע ההזרקה: לוקח קובץ HTML קיים + בלוק/ים, ומחזיר את הקובץ עם הבלוקים בפנים.
 *
 * ה-AI לא מחזיר את כל הקובץ מחדש (יקר, איטי, ונוטה "לשכתב" דברים שלא ביקשו
 * ממנו) - הוא מחזיר רשימת עריכות find/replace קטנות, ואנחנו מחילים אותן
 * באופן דטרמיניסטי ובודקים שכל עריכה באמת נמצאת בקובץ. כך מובטח שחוץ
 * מהתוספות, שום דבר בקובץ המקורי לא משתנה.
 */

/** מגבלת גודל לקובץ יחיד שנשלח להזרקה (טוקנים = זמן וכסף של המשתמש). */
export const INJECT_MAX_FILE_BYTES = 1024 * 1024;
export const INJECT_NOTES_MAX = 600;

export interface InjectBlock {
  /** מזהה ייחודי לרשימה (למשל design:<id> או default:<slug>) */
  key: string;
  slug: string;
  name: string;
  values: BlockValues;
}

export interface InjectEdit {
  find: string;
  replace: string;
}

export interface InjectPlan {
  summary: string;
  edits: InjectEdit[];
}

/** רק בלוקים עם מנגנון הייצוא העצמאי (toOutput) ניתנים להזרקה. */
export function isInjectable(slug: string): boolean {
  return !!getBlockDefinition(slug)?.toOutput;
}

export function blockCode(block: Pick<InjectBlock, "slug" | "values">): string | null {
  const def = getBlockDefinition(block.slug);
  if (!def?.toOutput) return null;
  return toUnifiedHtml(def.toOutput({ ...def.defaultValues(), ...block.values }));
}

/** ההנחיות הקבועות מראש שה-AI מקבל בכל הזרקה. מוצגות גם למשתמש, לשקיפות. */
export const INJECT_GUIDELINES: string[] = [
  "Never delete, rewrite or reorder existing content, markup, styles or scripts. Only ADD the block(s).",
  "Choose the most natural location for each block: a contact/form section usually goes near the end of the main content (before the footer); a floating widget goes right before </body>.",
  "Keep every block's code exactly as given (classes, data-* attributes, <style> and <script>). You may wrap a block in one extra container that matches the site's existing layout classes/containers so it fits the design.",
  "If the page has a <head>, you may move a block's <style> into it; keep each block's <script> after its markup (ideally right before </body>).",
  "Do not add external libraries, CDNs, trackers or network calls that are not already in the block code.",
  "Keep the WEblok credit comments and data-generator attributes.",
  "If the user's placement notes conflict with these rules, follow the rules and explain in the summary.",
];

export function buildInjectPrompt({
  fileName,
  source,
  blocks,
  notes,
  language,
}: {
  fileName: string;
  source: string;
  blocks: { name: string; code: string }[];
  notes: string;
  language: string;
}): string {
  const blocksText = blocks
    .map((b, i) => `### BLOCK ${i + 1}: ${b.name}\n<<<BLOCK_CODE\n${b.code}\nBLOCK_CODE>>>`)
    .join("\n\n");

  return `You are a careful front-end engineer. Inject the following ready-made ${SITE_NAME} block(s) into an existing web page.

RULES (mandatory):
${INJECT_GUIDELINES.map((g, i) => `${i + 1}. ${g}`).join("\n")}

OUTPUT FORMAT:
Return ONLY a JSON object: {"summary": string, "edits": [{"find": string, "replace": string}]}
- "find" must be copied VERBATIM (character for character, same whitespace) from the file below, must be short (1-3 lines) and must appear in the file exactly once. Prefer stable anchors like "</body>", "</head>", "<footer", or a unique closing tag.
- "replace" is the same text as "find" plus your additions (before or after it). Never drop the "find" text itself.
- Edits are applied in order, on the result of the previous edit.
- "summary": 1-3 short sentences in ${language} describing where each block was placed and why.

${notes.trim() ? `USER PLACEMENT NOTES (${language}):\n${notes.trim().slice(0, INJECT_NOTES_MAX)}\n` : ""}
${blocksText}

### TARGET FILE: ${fileName}
<<<FILE
${source}
FILE>>>`;
}

export function parseInjectPlan(raw: string): InjectPlan {
  const data = extractJson<{ summary?: unknown; edits?: unknown }>(raw);
  const edits = Array.isArray(data?.edits)
    ? data.edits
        .filter(
          (e): e is InjectEdit =>
            !!e && typeof e === "object" && typeof (e as InjectEdit).find === "string" && typeof (e as InjectEdit).replace === "string"
        )
        .map((e) => ({ find: e.find, replace: e.replace }))
    : [];
  return { summary: typeof data?.summary === "string" ? data.summary.slice(0, 1000) : "", edits };
}

/** כל שורה של העוגן חייבת להופיע ב-replace, באותו סדר - כלומר העריכה רק מוסיפה, לא מוחקת. */
function keepsAnchor(find: string, replace: string): boolean {
  let from = 0;
  for (const line of find.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)) {
    const at = replace.indexOf(line, from);
    if (at < 0) return false;
    from = at + line.length;
  }
  return true;
}

/**
 * מחיל את העריכות. עריכה שה-find שלה לא נמצא בקובץ (המודל "המציא" עוגן) - מדלגים
 * עליה ומדווחים. עריכה שמוחקת את העוגן עצמו נחשבת לא בטוחה ונדחית.
 */
export function applyEdits(source: string, edits: InjectEdit[]): { result: string; applied: number; failed: number } {
  const crlf = source.includes("\r\n");
  let result = source;
  let applied = 0;
  let failed = 0;

  for (const edit of edits) {
    let { find, replace } = edit;
    if (crlf) {
      find = find.replace(/\r?\n/g, "\r\n");
      replace = replace.replace(/\r?\n/g, "\r\n");
    }
    const idx = find ? result.indexOf(find) : -1;
    if (idx < 0 || !find.trim() || !keepsAnchor(find, replace)) {
      failed++;
      continue;
    }
    result = result.slice(0, idx) + replace + result.slice(idx + find.length);
    applied++;
  }
  return { result, applied, failed };
}

/**
 * הזרקה פשוטה בלי AI: כל הבלוקים נכנסים לפני </body> (או לסוף הקובץ אם אין body).
 * עובד תמיד, בלי מפתח - המיקום פחות "חכם", אבל שום דבר קיים לא משתנה.
 */
export function simpleInject(source: string, codes: string[]): string {
  const payload = `\n${codes.join("\n\n")}\n`;
  const idx = source.search(/<\/body\s*>/i);
  if (idx < 0) return source + payload;
  return source.slice(0, idx) + payload + source.slice(idx);
}

/** מוסיף <meta name="generator"> ל-<head> (פעם אחת) - "חותמת יצרן" לדף. */
export function stampGenerator(html: string): string {
  if (/<meta[^>]+name=["']generator["'][^>]*WEblok/i.test(html)) return html;
  const tag = `<meta name="generator" content="${GENERATOR_META.replace(/"/g, "&quot;")}">`;
  const head = html.match(/<head(\s[^>]*)?>/i);
  if (!head || head.index === undefined) return html;
  const at = head.index + head[0].length;
  return `${html.slice(0, at)}\n  ${tag}${html.slice(at)}`;
}

export function byteLength(s: string): number {
  return new TextEncoder().encode(s).length;
}

const BLOCK_MARKER = /data-weblok-block=/g;
const countBlocks = (html: string) => html.match(BLOCK_MARKER)?.length ?? 0;

export type InjectFailure = "no_edits" | "blocks_missing";

export class InjectError extends Error {
  constructor(public code: InjectFailure) {
    super(code);
    this.name = "InjectError";
  }
}

/**
 * מריץ הזרקה עם AI מקצה לקצה: prompt → Gemini → עריכות → אימות.
 * `ask` היא הפונקציה שבאמת פונה למודל (מוזרקת מבחוץ, כדי שהקובץ הזה יישאר
 * טהור - בלי fetch - וקל לבדיקה).
 */
export async function runAiInject({
  ask,
  fileName,
  source,
  blocks,
  notes,
  language,
}: {
  ask: (prompt: string) => Promise<string>;
  fileName: string;
  source: string;
  blocks: InjectBlock[];
  notes: string;
  language: string;
}): Promise<{ result: string; summary: string; failed: number }> {
  const codes = blocks
    .map((b) => ({ name: b.name, code: blockCode(b) }))
    .filter((b): b is { name: string; code: string } => !!b.code);

  const raw = await ask(buildInjectPrompt({ fileName, source, blocks: codes, notes, language }));
  const plan = parseInjectPlan(raw);
  if (plan.edits.length === 0) throw new InjectError("no_edits");

  const { result, applied, failed } = applyEdits(source, plan.edits);
  if (applied === 0) throw new InjectError("no_edits");
  // כל בלוק מוזרק נושא data-weblok-block - אם חסר אחד, ה-AI לא עשה את העבודה עד הסוף
  if (countBlocks(result) - countBlocks(source) < codes.length) throw new InjectError("blocks_missing");

  return { result: stampGenerator(result), summary: plan.summary, failed };
}

export function runSimpleInject(source: string, blocks: InjectBlock[]): string {
  const codes = blocks.map(blockCode).filter((c): c is string => !!c);
  return stampGenerator(simpleInject(source, codes));
}
