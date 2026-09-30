#!/usr/bin/env node
/**
 * ממזג קבצי מפתחות חדשים לשלוש השפות.
 * קלט: קבצי JSON בפורמט { "key": { "he": "...", "en": "...", "es": "..." } }
 * (ברירת מחדל: כל הקבצים ב-i18n-pending/, שנמחקים אחרי מיזוג מוצלח).
 * מפתח חדש נכנס אחרי המפתח האחרון עם אותה קידומת (עד הנקודה האחרונה),
 * אחרת בסוף הקובץ. מפתח קיים מתעדכן. חייבים תרגום לשלוש השפות.
 *
 * שימוש: node scripts/i18n-merge.mjs [file.json ...]
 */
import fs from "node:fs";
import path from "node:path";

const LOCALES = ["he", "en", "es"];
const dir = path.join(process.cwd(), "lib/i18n/locales");
const pendingDir = path.join(process.cwd(), "i18n-pending");

let inputs = process.argv.slice(2);
const fromPending = inputs.length === 0;
if (fromPending) {
  inputs = fs.existsSync(pendingDir)
    ? fs.readdirSync(pendingDir).filter((f) => f.endsWith(".json")).map((f) => path.join(pendingDir, f))
    : [];
}
if (!inputs.length) {
  console.log("אין מה למזג.");
  process.exit(0);
}

const additions = {};
for (const file of inputs) {
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const [key, tr] of Object.entries(data)) {
    for (const l of LOCALES) {
      if (typeof tr?.[l] !== "string" || !tr[l].trim()) {
        console.error(`✗ ${path.basename(file)}: למפתח "${key}" חסר תרגום ל-${l}`);
        process.exit(1);
      }
    }
    additions[key] = tr;
  }
}

const prefix = (k) => k.slice(0, Math.max(0, k.lastIndexOf(".")));

for (const l of LOCALES) {
  const file = path.join(dir, `${l}.json`);
  const dict = JSON.parse(fs.readFileSync(file, "utf8"));
  const entries = Object.entries(dict);
  for (const [key, tr] of Object.entries(additions)) {
    const existing = entries.findIndex(([k]) => k === key);
    if (existing >= 0) {
      entries[existing][1] = tr[l];
      continue;
    }
    const p = prefix(key);
    let at = -1;
    for (let i = 0; i < entries.length; i++) if (p && prefix(entries[i][0]) === p) at = i;
    if (at < 0) entries.push([key, tr[l]]);
    else entries.splice(at + 1, 0, [key, tr[l]]);
  }
  fs.writeFileSync(file, JSON.stringify(Object.fromEntries(entries), null, 2) + "\n");
}

if (fromPending) inputs.forEach((f) => fs.unlinkSync(f));
console.log(`✓ מוזגו ${Object.keys(additions).length} מפתחות ל-${LOCALES.join(", ")}`);
