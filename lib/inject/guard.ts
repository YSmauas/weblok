/**
 * שומר הסף של הזרקת ה-AI: מוודא שהעריכות שהמודל החזיר מוסיפות *רק* את קוד
 * הבלוקים שאנחנו נתנו לו - ולא שום דבר אחר.
 *
 * העיקרון: עבור כל עריכה find/replace מחשבים מה נוסף (replace פחות find),
 * ומפרקים את התוספת ליחידות מותרות בלבד:
 *   1. "חלקים" של קוד הבלוקים שלנו (הערת קרדיט, ה-div העוטף, ה-<style>,
 *      ה-<script>, הערת הסיום) - מותר שהמודל ישנה בהם רק רווחים/הזחה;
 *   2. תגיות עטיפה פשוטות (<div|section|... class="..." id="...">) עם
 *      מאפיינים מרשימה סגורה - בלי on*=, בלי style, בלי href/src - ומאוזנות
 *      בתוך אותה תוספת (כדי שלא יעטפו תוכן קיים של הדף);
 *   3. רווחים והערות HTML קצרות בלי תגיות.
 * כל דבר אחר (סקריפט נוסף, javascript:, onerror=, <iframe>, CSS חיצוני...) =
 * העריכה נדחית כולה. ומה שנכתב בפועל לקובץ הוא הגרסה *הקנונית* שלנו של כל
 * חלק (לא הטקסט שהמודל החזיר), כך שגם שינוי רווחים לא נכנס לקוד הבלוק.
 */

export type PieceKind = "credit" | "body" | "style" | "script" | "end";

export interface BlockPiece {
  block: number;
  kind: PieceKind;
  /** הטקסט הקנוני (כפי שהמחולל שלנו יצר) */
  text: string;
  tokens: string[];
}

/** חלק שחייב להופיע כדי שהבלוק ייחשב מוזרק (הערות הקרדיט - רשות) */
export const REQUIRED_KINDS: readonly PieceKind[] = ["body", "style", "script"];

/**
 * מפרק קוד בלוק מאוחד (toUnifiedHtml) לחלקים. אם המבנה לא צפוי - חלק יחיד
 * שמכיל את כל הקוד (אז מותר רק להזיז אותו בשלמותו).
 */
export function splitBlockCode(code: string, block: number): BlockPiece[] {
  const src = code.replace(/\r\n/g, "\n");
  const creditEnd = src.startsWith("<!--") ? src.indexOf("-->") + 3 : 0;
  const styleAt = src.lastIndexOf("\n<style>\n");
  const endAt = src.lastIndexOf("\n<!-- /");
  const scriptAt = styleAt >= 0 ? src.indexOf("\n<script>\n", styleAt) : -1;
  const piece = (kind: PieceKind, text: string): BlockPiece => ({
    block,
    kind,
    text: text.trim(),
    tokens: text.trim().split(/\s+/).filter(Boolean),
  });

  if (creditEnd < 3 || styleAt < creditEnd || endAt < styleAt || (scriptAt >= 0 && scriptAt > endAt)) {
    return [piece("body", src)];
  }
  const out = [piece("credit", src.slice(0, creditEnd)), piece("body", src.slice(creditEnd, styleAt))];
  out.push(piece("style", src.slice(styleAt, scriptAt >= 0 ? scriptAt : endAt)));
  if (scriptAt >= 0) out.push(piece("script", src.slice(scriptAt, endAt)));
  out.push(piece("end", src.slice(endAt)));
  return out.filter((p) => p.text);
}

/* ---------- יחידות מותרות ---------- */

const WRAPPER_TAGS = "div|section|aside|article|main|header|footer|nav";
const OPEN_TAG = new RegExp(`^<(${WRAPPER_TAGS})((?:\\s+[^\\s=>/"'<]+(?:\\s*=\\s*(?:"[^"]*"|'[^']*'))?)*)\\s*>`, "i");
const CLOSE_TAG = new RegExp(`^<\\/(${WRAPPER_TAGS})\\s*>`, "i");
const ATTR = /([^\s=>/"'<]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'))?/g;
/** הערה קצרה בלי תגיות ובלי הערה מותנית (<!--[if IE]>) */
const COMMENT = /^<!--(?!\[)([^<>]{0,200}?)-->/;

/** מאפיינים מותרים בתגית עטיפה, וערכים מותרים לכל אחד */
const SAFE_ATTRS: Record<string, RegExp> = {
  class: /^[\p{L}\p{N}\s_\-:./%#[\]!@]*$/u,
  id: /^[\p{L}\p{N}_\-:.]*$/u,
  role: /^[a-z\s-]*$/i,
  "aria-label": /^[^<>"'`&=]*$/,
  dir: /^(rtl|ltr|auto)$/i,
  lang: /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/,
};

const escAttr = (v: string) => v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** מחזיר את התגית כפי שנכתוב אותה (מנוקה), או null אם יש בה משהו לא מותר */
function safeOpenTag(tag: string, attrs: string): string | null {
  const out: string[] = [];
  ATTR.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = ATTR.exec(attrs))) {
    const name = m[1].toLowerCase();
    const value = m[2] ?? m[3] ?? "";
    const rule = SAFE_ATTRS[name];
    if (!rule || !rule.test(value) || /javascript:|expression\(|url\(/i.test(value)) return null;
    out.push(`${name}="${escAttr(value)}"`);
  }
  return `<${tag.toLowerCase()}${out.length ? " " + out.join(" ") : ""}>`;
}

/** מנסה להתאים חלק בלוק במיקום pos: אותם טוקנים, מותר לשנות רק כמות רווחים ביניהם. */
function matchPiece(s: string, pos: number, p: BlockPiece): number {
  let at = pos;
  for (let i = 0; i < p.tokens.length; i++) {
    if (i > 0) {
      const ws = /^\s+/.exec(s.slice(at, at + 200));
      if (!ws) return -1;
      at += ws[0].length;
    }
    const tok = p.tokens[i];
    if (!s.startsWith(tok, at)) return -1;
    at += tok.length;
  }
  return at;
}

export interface GuardState {
  pieces: BlockPiece[];
  /** אינדקסים (בתוך pieces) של חלקים שכבר הוזרקו */
  used: Set<number>;
}

export function createGuard(codes: string[]): GuardState {
  return { pieces: codes.flatMap((c, i) => splitBlockCode(c, i)), used: new Set() };
}

/**
 * מפרק תוספת ליחידות מותרות ובונה אותה מחדש מהטקסט הקנוני.
 * `used` מתעדכן (על עותק) - חלק שכבר הוזרק לא יוזרק פעמיים.
 * מחזיר null אם יש בתוספת משהו שהוא לא אחד הבלוקים שלנו.
 */
export function canonicalizeInsertion(
  text: string,
  guard: GuardState,
  used: Set<number>
): { text: string; pieces: number[] } | null {
  let pos = 0;
  let out = "";
  const pieces: number[] = [];
  const stack: string[] = [];

  while (pos < text.length) {
    const rest = text.slice(pos);
    const ws = /^\s+/.exec(rest);
    if (ws) {
      out += ws[0];
      pos += ws[0].length;
      continue;
    }

    // חלק של אחד הבלוקים (קודם חלק שעוד לא שימש; בלוקים זהים - הבא בתור)
    let matched = false;
    for (let i = 0; i < guard.pieces.length; i++) {
      const p = guard.pieces[i];
      if (used.has(i) || !rest.startsWith(p.tokens[0] ?? "\u0000")) continue;
      const end = matchPiece(text, pos, p);
      if (end < 0) continue;
      used.add(i);
      pieces.push(i);
      out += p.text;
      pos = end;
      matched = true;
      break;
    }
    if (matched) continue;

    const open = OPEN_TAG.exec(rest);
    if (open) {
      const clean = safeOpenTag(open[1], open[2] ?? "");
      if (!clean) return null;
      stack.push(open[1].toLowerCase());
      out += clean;
      pos += open[0].length;
      continue;
    }
    const close = CLOSE_TAG.exec(rest);
    if (close) {
      // סגירה חייבת להתאים לפתיחה באותה תוספת - אחרת זו עטיפה של תוכן קיים
      if (stack.pop() !== close[1].toLowerCase()) return null;
      out += `</${close[1].toLowerCase()}>`;
      pos += close[0].length;
      continue;
    }
    const comment = COMMENT.exec(rest);
    if (comment) {
      out += `<!--${comment[1].replace(/--/g, "-")}-->`;
      pos += comment[0].length;
      continue;
    }
    return null;
  }
  if (stack.length) return null;
  return { text: out, pieces };
}

/** האם יש בתוספת תוכן ממשי (לא רק רווחים) */
export const hasContent = (s: string) => /\S/.test(s);
