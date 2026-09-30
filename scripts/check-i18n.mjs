#!/usr/bin/env node
/**
 * בדיקת i18n (רצה ב-CI):
 * 1. לשלוש השפות אותו סט מפתחות בדיוק, ואין ערכים ריקים.
 * 2. כל מפתח קבוע שמופיע בקוד (t("x.y") / <T k="x.y" />) קיים בקבצים.
 * 3. מפתחות דינמיים (`blocks.cat.${c}`, `ai.err.${code}` וכו') לא נבדקים
 *    כ"חסרים" - אבל מדווחים כמידע, ומפתחות שמתאימים להם לא נחשבים "לא בשימוש".
 * דגל --unused מדפיס מפתחות שלא נמצאו בקוד (לבדיקה ידנית, לא נכשל).
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const LOCALES = ["he", "en", "es"];
const dicts = Object.fromEntries(
  LOCALES.map((l) => [l, JSON.parse(fs.readFileSync(path.join(root, `lib/i18n/locales/${l}.json`), "utf8"))])
);

let failed = false;
const fail = (msg) => {
  failed = true;
  console.error(`✗ ${msg}`);
};

// 1. אותו סט מפתחות
const base = new Set(Object.keys(dicts.he));
for (const l of LOCALES) {
  const keys = new Set(Object.keys(dicts[l]));
  for (const k of base) if (!keys.has(k)) fail(`${l}.json: חסר "${k}"`);
  for (const k of keys) if (!base.has(k)) fail(`${l}.json: מפתח עודף "${k}" (לא קיים ב-he.json)`);
  for (const [k, v] of Object.entries(dicts[l])) if (typeof v !== "string" || !v.trim()) fail(`${l}.json: ערך ריק ל-"${k}"`);
}

// 2. סריקת הקוד
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".next", ".git"].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(tsx?|mjs)$/.test(e.name)) out.push(p);
  }
  return out;
}
const files = ["app", "components", "lib"].flatMap((d) => walk(path.join(root, d)));
const used = new Set();
const dynamic = new Set();
const STATIC_RE = /(?:\bt\(\s*|\bk=\{?\s*|\bk:\s*|Key:\s*|label:\s*|title:\s*)["'`]([a-z][\w-]*(?:\.[\w-]+)+)["'`]/g;
const DYN_RE = /[`]([a-z][\w-]*(?:\.[\w-]+)*\.)\$\{/g;
const LITERAL_RE = /["'`]([a-z][\w-]*(?:\.[\w-]+)+)["'`]/g;
for (const f of files) {
  const src = fs.readFileSync(f, "utf8");
  for (const m of src.matchAll(STATIC_RE)) if (!m[0].includes("${")) used.add(m[1]);
  for (const m of src.matchAll(DYN_RE)) dynamic.add(m[1]);
  // מחרוזות שנראות כמו מפתחות ומופיעות בכל מקום (מערכים של מפתחות וכו') - לספירת "בשימוש"
  for (const m of src.matchAll(LITERAL_RE)) if (base.has(m[1])) used.add(m[1]);
}

// ערך שהוא קידומת של מפתחות (למשל k: "dash.l.profile" → `${k}.title`) = קידומת דינמית
for (const k of [...used]) {
  if (!base.has(k) && [...base].some((b) => b.startsWith(k + "."))) {
    used.delete(k);
    dynamic.add(k + ".");
  }
}

for (const k of used) {
  if (!base.has(k) && [...base].some((b) => b.startsWith(k.split(".")[0] + "."))) {
    fail(`מפתח בשימוש בקוד וחסר בקבצי השפה: "${k}"`);
  }
}

if (process.argv.includes("--unused")) {
  const unused = [...base].filter((k) => !used.has(k) && ![...dynamic].some((p) => k.startsWith(p)));
  console.log(`מפתחות שלא נמצאו בקוד (${unused.length}) - בדקו ידנית לפני מחיקה:`);
  unused.forEach((k) => console.log(`  ${k}`));
  console.log(`קידומות דינמיות שזוהו: ${[...dynamic].sort().join(", ")}`);
}

if (failed) process.exit(1);
console.log(`✓ i18n: ${base.size} מפתחות, זהים ב-${LOCALES.join("/")}`);
