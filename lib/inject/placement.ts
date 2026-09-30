/**
 * הזרקה בלי AI, עם בחירת מיקום: המשתמש בוחר *איפה* ייכנס כל בלוק (ראש הדף,
 * תחתית, סוף התוכן הראשי, לפני/אחרי אלמנט קיים, או "צף" מעל הדף), ואנחנו
 * מכניסים את קוד הבלוק שלנו - בדיוק כמו שהמחולל יצר אותו - בנקודה הזו.
 *
 * מודול טהור (בלי DOM ובלי fetch): עובד על מחרוזת, כדי שיהיה אפשר לבדוק אותו
 * ולהריץ אותו בכל סביבה. הזיהוי מבוסס regex פשוטים - מספיק לדפי HTML
 * רגילים, ובמקרה של ספק נופלים למיקום בטוח (לפני </body>).
 *
 * שום HTML של המשתמש לא "נבנה מחדש" ושום תוכן קיים לא נמחק - רק מוסיפים.
 * מה שמוזרק הוא אך ורק קוד הבלוקים שלנו (שכבר עבר סניטציה במחוללים), ועוד
 * כלל CSS קטן אחד לכל היותר לכל בלוק (ריווח/הזזה), שמסומן ב-data-weblok-placement
 * ומוגבל לבלוק שלנו בלבד דרך [data-weblok-block="..."].
 *
 * ---------------------------------------------------------------------------
 * סולם z-index של הבלוקים (לתיאום בין המחוללים - מי מכסה את מי):
 *
 *   1000          כותרת אתר (site-header, sticky)            - מעל תוכן הדף בלבד
 *   9998–10000    כפתורים ופאנלים צפים (צ'אט, טופס צף,       - מעל הכותרת
 *                 כפתור פתיחת מגירה)
 *   10001–10002   מגירת צד פתוחה (site-sidebar: רקע + פאנל)  - מעל הכפתורים הצפים
 *   99998–99999   פופאפ (popup: רקע + כרטיס)                  - מעל הכל
 *
 * כלל אצבע: פופאפ > מגירה פתוחה > כפתורים צפים > כותרת > תוכן.
 * ---------------------------------------------------------------------------
 */

import type { BlockValues } from "@/lib/blocks-registry/types";

export const Z_INDEX = {
  header: 1000,
  floating: [9998, 10000],
  drawer: [10001, 10002],
  popup: [99998, 99999],
} as const;

/** איפה ייכנס בלוק. before:/after: + מזהה של אלמנט שזוהה בדף (Landmark.id) */
export type PlacementChoice = "top" | "bottom" | "main-end" | "floating" | `before:${string}` | `after:${string}`;

export const BASIC_PLACEMENTS: readonly PlacementChoice[] = ["top", "main-end", "bottom", "floating"];

export interface Landmark {
  /** מזהה יציב לאותו קובץ: tag:מספר-סידורי */
  id: string;
  tag: string;
  /** תווית לתצוגה, למשל <section#about> או <nav.menu> */
  label: string;
  /** תחילת תגית הפתיחה */
  start: number;
  /** אחרי תגית הסגירה (-1 אם לא נמצאה) */
  end: number;
}

export type PlacementWarningCode =
  | "fixed_header"
  | "floating_conflict"
  | "duplicate_header"
  | "duplicate_footer"
  | "already_injected"
  | "no_body"
  | "no_target";

export interface PlacementWarning {
  code: PlacementWarningCode;
  /** שם הבלוק / המחלקה שזוהתה - לשילוב בהודעה */
  detail?: string;
}

export interface PageAnalysis {
  hasBody: boolean;
  landmarks: Landmark[];
  /** כותרת קיימת בדף עם position: fixed/sticky בראש המסך */
  fixedHeader: string | null;
  /** אלמנט צף קיים בפינה התחתונה (כפתור וואטסאפ, צ'אט וכו') */
  floatingCorner: string | null;
  /** בלוקים של WEblok שכבר נמצאים בדף (data-weblok-block) */
  existingBlocks: string[];
}

/* ---------- ברירות מחדל לפי סוג בלוק ---------- */

export function defaultPlacement(slug: string, values?: BlockValues): PlacementChoice {
  switch (slug) {
    case "site-header":
      return "top";
    case "site-footer":
      return "bottom";
    case "popup":
    case "chatbot-assistant":
    case "site-sidebar":
      return "floating";
    case "contact-form":
      return values?.displayMode === "widget" ? "floating" : "main-end";
    default:
      return "main-end";
  }
}

/* ---------- ניתוח הדף ---------- */

/**
 * "מסכה": תוכן של הערות, <script>, <style>, <textarea> ו-<template> מוחלף
 * ברווחים (באותו אורך), כדי שחיפוש תגיות לא ימצא "תגיות" בתוך קוד JS או הערה.
 */
export function maskHtml(html: string): string {
  return html.replace(/<!--[\s\S]*?(?:-->|$)|<(script|style|textarea|template)\b[^>]*>[\s\S]*?(?:<\/\1\s*>|$)/gi, (m) =>
    m.replace(/[^\n]/g, " ")
  );
}

const LANDMARK_TAGS = ["header", "nav", "main", "footer", "section", "article", "aside"];
const MAX_LANDMARKS = 40;

function attr(tag: string, name: string): string | null {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return m ? (m[1] ?? m[2] ?? m[3] ?? "").trim() : null;
}

/** מוצא את סוף תגית הסגירה התואמת (עם ספירת קינון של אותה תגית) */
function findClose(masked: string, tag: string, from: number): number {
  const re = new RegExp(`<(/?)${tag}\\b[^>]*>`, "gi");
  re.lastIndex = from;
  let depth = 1;
  let m: RegExpExecArray | null;
  while ((m = re.exec(masked))) {
    depth += m[1] ? -1 : 1;
    if (depth === 0) return m.index + m[0].length;
  }
  return -1;
}

export function detectLandmarks(html: string, masked = maskHtml(html)): Landmark[] {
  const out: Landmark[] = [];
  const counters: Record<string, number> = {};
  const re = new RegExp(`<(${LANDMARK_TAGS.join("|")})\\b[^>]*>`, "gi");
  let m: RegExpExecArray | null;
  while ((m = re.exec(masked)) && out.length < MAX_LANDMARKS) {
    const tag = m[1].toLowerCase();
    const openTag = html.slice(m.index, m.index + m[0].length);
    // הבלוקים שלנו עצמם (header/nav בתוך בלוק מוזרק) - לא נקודות עיגון
    if (/\sclass\s*=\s*["']?wb[a-z]*[-\s"']/i.test(openTag) || /data-wb-/i.test(openTag)) continue;
    const id = attr(openTag, "id");
    const cls = attr(openTag, "class")?.split(/\s+/).filter(Boolean)[0] ?? null;
    // section/article/aside - רק עם id או class (אחרת אין איך להבדיל ביניהם)
    if (["section", "article", "aside"].includes(tag) && !id && !cls) continue;
    counters[tag] = (counters[tag] ?? 0) + 1;
    const safe = (s: string) => s.replace(/[^\p{L}\p{N}_:.-]/gu, "").slice(0, 40);
    const label = `<${tag}${id ? `#${safe(id)}` : cls ? `.${safe(cls)}` : ""}>${counters[tag] > 1 && !id ? ` (${counters[tag]})` : ""}`;
    out.push({ id: `${tag}:${counters[tag]}`, tag, label, start: m.index, end: findClose(masked, tag, m.index + m[0].length) });
  }
  return out;
}

interface CssRule {
  selector: string;
  body: string;
}

/** כללי CSS פשוטים (selector { ... }) מתוך טקסט CSS. @media וכו' - הכללים הפנימיים נאספים. */
export function cssRules(css: string): CssRule[] {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const out: CssRule[] = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(clean))) {
    const selector = m[1].trim().replace(/^@[^{]*$/, "");
    if (selector && !selector.startsWith("@")) out.push({ selector, body: m[2] });
  }
  return out;
}

const POS_FIXED = /(?:^|[;\s])position\s*:\s*fixed/i;
const POS_STICKY_OR_FIXED = /(?:^|[;\s])position\s*:\s*(fixed|sticky)/i;
const TOP_ZERO = /(?:^|[;\s])top\s*:\s*0(?:px|rem|em)?\s*(?:;|!|$)/i;
const HAS_TOP = /(?:^|[;\s])top\s*:/i;
const HAS_BOTTOM = /(?:^|[;\s])bottom\s*:/i;
const HAS_SIDE = /(?:^|[;\s])(right|left|inset-inline-end|inset-inline-start)\s*:/i;
const FULL_COVER = /(?:^|[;\s])inset\s*:\s*0/i;

/** האם זה כלל של בלוק WEblok (שלנו) - לא נחשב "אלמנט קיים" של האתר */
const isOurs = (selector: string) => /(^|[\s,>+~])\.(wb[a-z]*-|wb[a-z]*\b|weblok-)|data-wb-|data-weblok/i.test(selector);

function styleSources(html: string): { css: string; inline: { tag: string; style: string }[]; classes: string[] } {
  const css: string[] = [];
  const noComments = html.replace(/<!--[\s\S]*?-->/g, "");
  const styleRe = /<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi;
  let m: RegExpExecArray | null;
  while ((m = styleRe.exec(noComments))) css.push(m[1]);
  const masked = maskHtml(html);
  const inline: { tag: string; style: string }[] = [];
  const classes: string[] = [];
  const tagRe = /<([a-z][a-z0-9-]*)\b[^>]*>/gi;
  while ((m = tagRe.exec(masked))) {
    const tagText = html.slice(m.index, m.index + m[0].length);
    if (/data-wb-|data-weblok|class\s*=\s*["']?(wb|weblok-)/i.test(tagText)) continue;
    const st = attr(tagText, "style");
    if (st) inline.push({ tag: m[1].toLowerCase(), style: st });
    const cl = attr(tagText, "class");
    if (cl) classes.push(cl);
  }
  return { css: css.join("\n"), inline, classes };
}

export function analyzePage(html: string): PageAnalysis {
  const masked = maskHtml(html);
  const { css, inline, classes } = styleSources(html);
  const rules = cssRules(css).filter((r) => !isOurs(r.selector));

  let fixedHeader: string | null = null;
  let floatingCorner: string | null = null;

  for (const r of rules) {
    if (!fixedHeader && POS_STICKY_OR_FIXED.test(r.body) && TOP_ZERO.test(r.body) && !HAS_BOTTOM.test(r.body) && !FULL_COVER.test(r.body)) {
      fixedHeader = r.selector.slice(0, 60);
    }
    if (!floatingCorner && POS_FIXED.test(r.body) && HAS_BOTTOM.test(r.body) && HAS_SIDE.test(r.body) && !HAS_TOP.test(r.body) && !FULL_COVER.test(r.body)) {
      floatingCorner = r.selector.slice(0, 60);
    }
  }
  for (const { tag, style } of inline) {
    const body = style.replace(/&quot;/g, '"');
    if (!fixedHeader && POS_STICKY_OR_FIXED.test(body) && TOP_ZERO.test(body + ";") && !HAS_BOTTOM.test(body)) fixedHeader = `<${tag} style>`;
    if (!floatingCorner && POS_FIXED.test(body) && HAS_BOTTOM.test(body) && HAS_SIDE.test(body) && !HAS_TOP.test(body)) floatingCorner = `<${tag} style>`;
  }
  // Tailwind / Bootstrap: "fixed top-0", "sticky top-0", "fixed-top", "fixed bottom-4 right-4"
  for (const cl of classes) {
    const tokens = cl.split(/\s+/);
    const has = (re: RegExp) => tokens.some((t) => re.test(t));
    if (!fixedHeader && (has(/^(fixed|sticky)-top$/) || (has(/^(fixed|sticky)$/) && has(/^top-0$/) && !has(/^bottom-/) && !has(/^inset-0$/)))) {
      fixedHeader = `.${tokens.join(".")}`.slice(0, 60);
    }
    if (!floatingCorner && has(/^fixed$/) && has(/^bottom-/) && has(/^(right|left|end|start)-/) && !has(/^top-/)) {
      floatingCorner = `.${tokens.join(".")}`.slice(0, 60);
    }
  }

  const existingBlocks = Array.from(new Set(Array.from(html.matchAll(/data-weblok-block="([^"]+)"/g), (x) => x[1])));

  return {
    hasBody: /<body\b[^>]*>/i.test(masked),
    landmarks: detectLandmarks(html, masked),
    fixedHeader,
    floatingCorner,
    existingBlocks,
  };
}

/* ---------- נקודות הכנסה ---------- */

interface Anchors {
  bodyOpenEnd: number;
  bodyClose: number;
  headCloseEnd: number;
  htmlOpenEnd: number;
  doctypeEnd: number;
}

function anchors(masked: string): Anchors {
  const endOf = (re: RegExp) => {
    const m = re.exec(masked);
    return m ? m.index + m[0].length : -1;
  };
  let bodyClose = -1;
  const closeRe = /<\/body\s*>/gi;
  let m: RegExpExecArray | null;
  while ((m = closeRe.exec(masked))) bodyClose = m.index;
  return {
    bodyOpenEnd: endOf(/<body\b[^>]*>/i),
    bodyClose,
    headCloseEnd: endOf(/<\/head\s*>/i),
    htmlOpenEnd: endOf(/<html\b[^>]*>/i),
    doctypeEnd: endOf(/<!doctype[^>]*>/i),
  };
}

/** הפוטר "של הדף": האחרון שלא נמצא בתוך <main>/<article> */
function pageFooter(landmarks: Landmark[]): Landmark | undefined {
  const containers = landmarks.filter((l) => (l.tag === "main" || l.tag === "article") && l.end > 0);
  return [...landmarks]
    .reverse()
    .find((l) => l.tag === "footer" && !containers.some((c) => c.start < l.start && l.start < c.end));
}

function endOfDoc(a: Anchors, len: number) {
  return a.bodyClose >= 0 ? a.bodyClose : len;
}

/** מיקום (אינדקס) להכנסה + האם נפלנו לברירת מחדל כי היעד לא נמצא */
export function resolvePosition(
  html: string,
  choice: PlacementChoice,
  analysis: PageAnalysis,
  masked = maskHtml(html)
): { at: number; fallback: boolean } {
  const a = anchors(masked);
  const lms = analysis.landmarks;
  const len = html.length;

  if (choice === "top") {
    if (a.bodyOpenEnd >= 0) return { at: a.bodyOpenEnd, fallback: false };
    if (a.headCloseEnd >= 0) return { at: a.headCloseEnd, fallback: false };
    if (a.htmlOpenEnd >= 0) return { at: a.htmlOpenEnd, fallback: false };
    return { at: a.doctypeEnd >= 0 ? a.doctypeEnd : 0, fallback: false };
  }
  if (choice === "floating") return { at: endOfDoc(a, len), fallback: false };
  if (choice === "bottom") {
    const f = pageFooter(lms);
    if (f && f.end > 0) return { at: f.end, fallback: false };
    return { at: endOfDoc(a, len), fallback: false };
  }
  if (choice === "main-end") {
    const main = lms.find((l) => l.tag === "main" && l.end > 0);
    if (main) {
      const closeAt = masked.lastIndexOf("</", main.end - 1);
      return { at: closeAt, fallback: false };
    }
    const f = pageFooter(lms);
    if (f) return { at: f.start, fallback: false };
    return { at: endOfDoc(a, len), fallback: false };
  }
  const [kind, id] = [choice.slice(0, choice.indexOf(":")), choice.slice(choice.indexOf(":") + 1)];
  const lm = lms.find((l) => l.id === id);
  if (!lm || (kind === "after" && lm.end < 0)) return { at: endOfDoc(a, len), fallback: true };
  return { at: kind === "before" ? lm.start : lm.end, fallback: false };
}

/* ---------- ריווח/הזזה כדי לא לכסות אלמנטים קיימים ---------- */

export interface PlacementOptions {
  /** הזזת הכותרת שלנו (ורכיבים שלנו שמוצמדים לראש המסך) מתחת לכותרת קבועה קיימת, בפיקסלים. 0 = בלי */
  headerOffset?: number;
  /** הרמת הכפתורים הצפים שלנו מעל כפתור צף קיים בפינה, בפיקסלים. 0 = בלי */
  floatLift?: number;
}

const clampPx = (n: number | undefined) => Math.max(0, Math.min(400, Math.round(Number(n) || 0)));

/** גובה משוער של כותרת האתר שלנו (ריווח עוגנים: קישור #section לא ייחבא מתחתיה) */
const HEADER_SCROLL_PAD = 72;

/**
 * כלל CSS נלווה לבלוק (או מחרוזת ריקה). נגזר מה-CSS של הבלוק עצמו - אילו
 * אלמנטים שלו position: fixed/sticky בראש/בתחתית המסך - כך שלא צריך לשכפל כאן
 * שמות מחלקות של המחוללים.
 */
export function placementCss(code: string, opts: PlacementOptions): string {
  const blockId = code.match(/data-weblok-block="([a-z0-9-]+)"/)?.[1];
  if (!blockId) return "";
  const css = Array.from(code.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi), (m) => m[1]).join("\n");
  const scope = (sel: string) =>
    sel
      .split(",")
      .map((s) => `[data-weblok-block="${blockId}"] ${s.trim()}`)
      .join(", ");

  const top = clampPx(opts.headerOffset);
  const lift = clampPx(opts.floatLift);
  const rules: string[] = [];
  let stickyTop = false;

  for (const r of cssRules(css)) {
    if (/[:]{1,2}(hover|focus|before|after)/i.test(r.selector)) continue;
    const pos = r.body.match(POS_STICKY_OR_FIXED)?.[1]?.toLowerCase();
    if (!pos) continue;
    if (HAS_TOP.test(r.body) && !HAS_BOTTOM.test(r.body) && !FULL_COVER.test(r.body)) {
      if (pos === "sticky") stickyTop = true;
      if (top) rules.push(pos === "sticky" ? `${scope(r.selector)} { top: ${top}px; }` : `${scope(r.selector)} { translate: 0 ${top}px; }`);
    } else if (pos === "fixed" && HAS_BOTTOM.test(r.body) && !HAS_TOP.test(r.body) && !FULL_COVER.test(r.body) && lift) {
      rules.push(`${scope(r.selector)} { translate: 0 -${lift}px; }`);
    }
  }
  // כותרת דביקה: ריווח גלילה לעוגנים, כדי שקישור לסעיף לא ייעלם מתחת לכותרת
  if (stickyTop) rules.unshift(`html { scroll-padding-top: ${HEADER_SCROLL_PAD + top}px; }`);
  if (!rules.length) return "";
  return `<style data-weblok-placement="${blockId}">\n${rules.join("\n")}\n</style>`;
}

/* ---------- ההזרקה עצמה ---------- */

export interface PlacedBlock {
  /** קוד הבלוק המאוחד (toUnifiedHtml) - רק קוד שהמחולל שלנו יצר */
  code: string;
  slug: string;
  name: string;
  placement: PlacementChoice;
}

/** מכניס טקסט במיקום: אם לפני המיקום יש רק הזחה באותה שורה - בתחילת השורה, אחרת בשורה חדשה */
function insertAt(src: string, at: number, text: string, nl: string): string {
  const lineStart = src.lastIndexOf("\n", at - 1) + 1;
  if (!/\S/.test(src.slice(lineStart, at))) {
    return src.slice(0, lineStart) + text + nl + src.slice(lineStart);
  }
  return src.slice(0, at) + nl + text + nl + src.slice(at);
}

export function injectPlaced(
  source: string,
  blocks: PlacedBlock[],
  opts: PlacementOptions = {}
): { html: string; warnings: PlacementWarning[] } {
  const nl = source.includes("\r\n") ? "\r\n" : "\n";
  const masked = maskHtml(source);
  const analysis = analyzePage(source);
  const warnings: PlacementWarning[] = [];
  if (!analysis.hasBody) warnings.push({ code: "no_body" });

  // כל המיקומים מחושבים על הקובץ המקורי, ומוכנסים מהסוף להתחלה כדי שהאינדקסים לא יזוזו.
  // כמה בלוקים באותה נקודה - נשמר סדר הבחירה.
  const groups = new Map<number, string[]>();
  for (const b of blocks) {
    const { at, fallback } = resolvePosition(source, b.placement, analysis, masked);
    if (fallback) warnings.push({ code: "no_target", detail: b.name });
    const extra = placementCss(b.code, opts);
    const text = (extra ? `${extra}\n${b.code}` : b.code).replace(/\r?\n/g, nl);
    groups.set(at, [...(groups.get(at) ?? []), text]);
  }

  let html = source;
  for (const at of Array.from(groups.keys()).sort((x, y) => y - x)) {
    html = insertAt(html, at, groups.get(at)!.join(nl + nl), nl);
  }
  return { html, warnings };
}

/**
 * אזהרות שכדאי להציג *לפני* ההזרקה (לפי הבלוקים והמיקומים שנבחרו), כדי שהמשתמש
 * יחליט על ריווח/הזזה או מיקום אחר.
 */
export function placementWarnings(
  analysis: PageAnalysis,
  blocks: { slug: string; name: string; code: string; placement: PlacementChoice }[]
): PlacementWarning[] {
  const out: PlacementWarning[] = [];
  const hasSlug = (s: string) => blocks.some((b) => b.slug === s);
  const topBlocks = blocks.filter((b) => b.placement === "top" || /position\s*:\s*(fixed|sticky)[^}]*\btop\s*:/i.test(b.code));
  if (analysis.fixedHeader && topBlocks.length) out.push({ code: "fixed_header", detail: analysis.fixedHeader });
  const floaters = blocks.filter((b) => /position\s*:\s*fixed[^}]*\bbottom\s*:/i.test(b.code));
  if (analysis.floatingCorner && floaters.length) out.push({ code: "floating_conflict", detail: analysis.floatingCorner });
  if (hasSlug("site-header") && analysis.landmarks.some((l) => l.tag === "header")) out.push({ code: "duplicate_header" });
  if (hasSlug("site-footer") && analysis.landmarks.some((l) => l.tag === "footer")) out.push({ code: "duplicate_footer" });
  for (const b of blocks) {
    const id = b.code.match(/data-weblok-block="([a-z0-9-]+)"/)?.[1];
    if (id && analysis.existingBlocks.includes(id)) out.push({ code: "already_injected", detail: b.name });
  }
  return out;
}
