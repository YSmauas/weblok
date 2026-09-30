import { getBlockDefinition } from "@/lib/blocks-registry";
import type { BlockValues } from "@/lib/blocks-registry/types";
import { toUnifiedHtml } from "@/lib/blocks-registry/export";
import { extractJson } from "@/lib/ai/gemini";
import { GENERATOR_META, SITE_NAME } from "@/lib/site";
import { defaultPlacement, injectPlaced, type PlacementChoice, type PlacementOptions, type PlacementWarning } from "./placement";
import { canonicalizeInsertion, createGuard, REQUIRED_KINDS, type GuardState } from "./guard";

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
  "Keep every block's code exactly as given (classes, data-* attributes, <style> and <script>). You may wrap a block in one extra container (div/section/aside/article/main/header/footer/nav) with only class, id, role, aria-label, dir or lang attributes, matching the site's existing layout classes so it fits the design.",
  "If the page has a <head>, you may move a block's <style> into it; keep each block's <script> after its markup (ideally right before </body>).",
  "Do not add anything else: no extra scripts, styles, event handlers (on*), links, iframes, external libraries, CDNs, trackers or network calls. Every addition is verified automatically - anything that is not the exact block code or a plain wrapper is rejected.",
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

/** תקרות על תשובת המודל - תשובה חריגה לא אמורה להיות גדולה מזה */
const MAX_EDITS = 24;
const MAX_EDIT_CHARS = 400_000;

export function parseInjectPlan(raw: string): InjectPlan {
  let data: { summary?: unknown; edits?: unknown } | null;
  try {
    data = extractJson<{ summary?: unknown; edits?: unknown }>(raw);
  } catch {
    throw new InjectError("bad_response");
  }
  if (!data || typeof data !== "object") throw new InjectError("bad_response");
  const edits = Array.isArray(data.edits)
    ? data.edits
        .filter(
          (e): e is InjectEdit =>
            !!e &&
            typeof e === "object" &&
            typeof (e as InjectEdit).find === "string" &&
            typeof (e as InjectEdit).replace === "string" &&
            (e as InjectEdit).find.length + (e as InjectEdit).replace.length <= MAX_EDIT_CHARS
        )
        .slice(0, MAX_EDITS)
        .map((e) => ({ find: e.find, replace: e.replace }))
    : [];
  // הסיכום מוצג כטקסט רגיל (React בורח ממנו) - רק מקצרים ומנקים תווי בקרה
  const summary = typeof data.summary === "string" ? data.summary.replace(/[\u0000-\u0008\u000b-\u001f]/g, "").slice(0, 1000) : "";
  return { summary, edits };
}

const toLf = (s: string) => s.replace(/\r\n/g, "\n");
const toCrlf = (s: string) => s.replace(/\r?\n/g, "\r\n");

function countOccurrences(hay: string, needle: string): number {
  let n = 0;
  for (let at = hay.indexOf(needle); at >= 0; at = hay.indexOf(needle, at + needle.length)) n++;
  return n;
}

/**
 * בונה מחדש את ה-replace של עריכה: הטקסט של find נשמר כמו שהוא, וכל מה שנוסף
 * סביבו עובר דרך canonicalizeInsertion (רק הבלוקים שלנו + עטיפות פשוטות).
 * null = העריכה מוחקת/משנה תוכן קיים, או מוסיפה משהו שהוא לא הבלוקים שלנו.
 */
function rebuildReplace(
  find: string,
  replace: string,
  guard: GuardState,
  used: Set<number>
): { text: string; pieces: number[] } | null {
  // 1. המקרה הנפוץ: find מופיע כמו שהוא בתוך replace (הוספה לפני/אחרי)
  for (let at = replace.indexOf(find); at >= 0; at = replace.indexOf(find, at + 1)) {
    const tryUsed = new Set(used);
    const before = canonicalizeInsertion(replace.slice(0, at), guard, tryUsed);
    const after = before && canonicalizeInsertion(replace.slice(at + find.length), guard, tryUsed);
    if (before && after) {
      tryUsed.forEach((i) => used.add(i));
      return { text: before.text + find + after.text, pieces: [...before.pieces, ...after.pieces] };
    }
  }

  // 2. המודל שינה הזחה/רווחים: כל שורה של find (בלי רווחים בקצוות) חייבת להופיע
  //    ב-replace, באותו סדר. מה שבין השורות = תוספת (או רווחים בלבד).
  const lines: { text: string; at: number }[] = [];
  const re = /[^\n]+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(find))) {
    const lead = m[0].length - m[0].trimStart().length;
    const text = m[0].trim();
    if (text) lines.push({ text, at: m.index + lead });
  }
  if (!lines.length) return null;

  const tryUsed = new Set(used);
  let from = 0;
  let out = "";
  const pieces: number[] = [];
  for (let i = 0; i <= lines.length; i++) {
    const next = i < lines.length ? replace.indexOf(lines[i].text, from) : replace.length;
    if (next < 0) return null;
    const gap = replace.slice(from, next);
    if (i > 0 && i < lines.length && !/\S/.test(gap)) {
      // רווחים בלבד בין שתי שורות קיימות - משאירים את הרווחים המקוריים
      out += find.slice(lines[i - 1].at + lines[i - 1].text.length, lines[i].at);
    } else {
      const c = canonicalizeInsertion(gap, guard, tryUsed);
      if (!c) return null;
      out += c.text;
      pieces.push(...c.pieces);
    }
    if (i < lines.length) {
      out += lines[i].text;
      from = next + lines[i].text.length;
    }
  }
  tryUsed.forEach((i) => used.add(i));
  return { text: out, pieces };
}

export interface ApplyResult {
  result: string;
  applied: number;
  /** עריכות שהעוגן שלהן לא נמצא בקובץ (או נמצא יותר מפעם אחת) */
  failed: number;
  /** עריכות שנדחו כי מחקו תוכן קיים או הוסיפו משהו שהוא לא הבלוקים שלנו */
  rejected: number;
  /** אינדקסים של חלקי הבלוקים שהוזרקו (guard.pieces) */
  used: Set<number>;
}

/**
 * מחיל את העריכות. עריכה שה-find שלה לא נמצא בקובץ בדיוק פעם אחת (המודל
 * "המציא" עוגן, או עוגן דו-משמעי) - מדלגים עליה. עריכה שמוחקת תוכן קיים או
 * מוסיפה משהו שאינו הבלוקים שנתנו (סקריפט, קישור javascript:, אירוע on*) -
 * נדחית. מה שנכתב לקובץ הוא הגרסה הקנונית של קוד הבלוקים.
 */
export function applyEdits(source: string, edits: InjectEdit[], codes: string[], guard = createGuard(codes)): ApplyResult {
  const crlf = source.includes("\r\n");
  let result = source;
  let applied = 0;
  let failed = 0;
  let rejected = 0;

  for (const edit of edits) {
    const findLf = toLf(edit.find);
    if (!findLf.trim()) {
      failed++;
      continue;
    }
    const find = crlf ? toCrlf(findLf) : findLf;
    const count = countOccurrences(result, find);
    if (count !== 1) {
      failed++;
      continue;
    }
    const tryUsed = new Set(guard.used);
    const rebuilt = rebuildReplace(findLf, toLf(edit.replace), guard, tryUsed);
    if (!rebuilt) {
      rejected++;
      continue;
    }
    const idx = result.indexOf(find);
    const replacement = crlf ? toCrlf(rebuilt.text) : rebuilt.text;
    result = result.slice(0, idx) + replacement + result.slice(idx + find.length);
    guard.used = tryUsed;
    applied++;
  }
  return { result, applied, failed, rejected, used: guard.used };
}

/**
 * השלמה: אם ה-AI שם את הבלוק אבל "שכח" את ה-<style>/<script> שלו - מוסיפים
 * אותם (בגרסה הקנונית) מיד אחרי הבלוק, כדי שהבלוק יעבוד בפועל.
 */
function completeBlocks(result: string, guard: GuardState, blockCount: number): { result: string; missing: number } {
  const crlf = result.includes("\r\n");
  let missing = 0;
  for (let b = 0; b < blockCount; b++) {
    const idx = guard.pieces.map((p, i) => ({ p, i })).filter(({ p }) => p.block === b);
    const body = idx.find(({ p }) => p.kind === "body");
    if (!body || !guard.used.has(body.i)) {
      missing++;
      continue;
    }
    const lost = idx.filter(({ p, i }) => REQUIRED_KINDS.includes(p.kind) && p.kind !== "body" && !guard.used.has(i));
    if (!lost.length) continue;
    const anchor = crlf ? toCrlf(body.p.text) : body.p.text;
    const at = result.indexOf(anchor);
    if (at < 0) {
      missing++;
      continue;
    }
    const add = lost.map(({ p }) => p.text).join("\n");
    const insert = crlf ? toCrlf(`\n${add}`) : `\n${add}`;
    result = result.slice(0, at + anchor.length) + insert + result.slice(at + anchor.length);
    lost.forEach(({ i }) => guard.used.add(i));
  }
  return { result, missing };
}

/** מוסיף <meta name="generator"> ל-<head> (פעם אחת) - "חותמת יצרן" לדף. */
export function stampGenerator(html: string): string {
  if (/<meta[^>]+name=["']generator["'][^>]*WEblok/i.test(html)) return html;
  const tag = `<meta name="generator" content="${GENERATOR_META.replace(/"/g, "&quot;")}">`;
  const head = html.match(/<head(\s[^>]*)?>/i);
  if (!head || head.index === undefined) return html;
  const at = head.index + head[0].length;
  const nl = html.includes("\r\n") ? "\r\n" : "\n";
  return `${html.slice(0, at)}${nl}  ${tag}${html.slice(at)}`;
}

export function byteLength(s: string): number {
  return new TextEncoder().encode(s).length;
}

export type InjectFailure = "no_edits" | "blocks_missing" | "bad_response" | "unsafe";

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
}): Promise<{ result: string; summary: string; failed: number; rejected: number }> {
  const codes = blocks
    .map((b) => ({ name: b.name, code: blockCode(b) }))
    .filter((b): b is { name: string; code: string } => !!b.code);
  if (!codes.length) throw new InjectError("blocks_missing");

  const raw = await ask(buildInjectPrompt({ fileName, source, blocks: codes, notes, language }));
  const plan = parseInjectPlan(raw);
  if (plan.edits.length === 0) throw new InjectError("no_edits");

  const guard = createGuard(codes.map((c) => c.code));
  const applied = applyEdits(source, plan.edits, [], guard);
  if (applied.applied === 0) throw new InjectError(applied.rejected > 0 ? "unsafe" : "no_edits");

  const { result, missing } = completeBlocks(applied.result, guard, codes.length);
  // כל בלוק חייב להיכנס במלואו - אחרת ה-AI לא עשה את העבודה עד הסוף
  if (missing > 0) throw new InjectError(applied.rejected > 0 ? "unsafe" : "blocks_missing");

  return { result: stampGenerator(result), summary: plan.summary, failed: applied.failed, rejected: applied.rejected };
}

/**
 * הזרקה בלי AI עם בחירת מיקום לכל בלוק (ברירת מחדל לפי סוג הבלוק).
 * מוזרק רק קוד שהמחולל שלנו יצר - אף פעם לא HTML גולמי של משתמש.
 */
export function runPlacedInject(
  source: string,
  blocks: InjectBlock[],
  placements: Record<string, PlacementChoice>,
  opts: PlacementOptions = {}
): { html: string; warnings: PlacementWarning[] } {
  const placed = blocks
    .map((b) => {
      const code = blockCode(b);
      return code ? { code, slug: b.slug, name: b.name, placement: placements[b.key] ?? defaultPlacement(b.slug, b.values) } : null;
    })
    .filter((b): b is NonNullable<typeof b> => !!b);
  const { html, warnings } = injectPlaced(source, placed, opts);
  return { html: stampGenerator(html), warnings };
}
