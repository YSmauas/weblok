/**
 * קבצים לכלי ניהול המאגר: קריאה (קבצים / תיקייה / ZIP) כ-base64 - כולל קבצים
 * בינאריים - וסינון בסגנון .gitignore.
 */

export interface RepoEntry {
  path: string;
  base64: string;
  size: number;
}

/** כמה שמסכימים לשלוח בבת אחת - מעבר לזה הדפדפן והטאב נחנקים */
export const MAX_PUSH_BYTES = 50 * 1024 * 1024;

/** תמיד מסוננים, בלי קשר ל-.gitignore */
export const ALWAYS_IGNORED = [".git/", "__MACOSX/", ".DS_Store", "node_modules/"];

function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...Array.from(bytes.subarray(i, i + 0x8000)));
  }
  return btoa(binary);
}

function normalize(path: string): string | null {
  const clean = path.replace(/\\/g, "/").replace(/^\.?\/+/, "").replace(/\/{2,}/g, "/");
  if (!clean || clean.split("/").some((s) => s === ".." || s === "")) return null;
  return clean;
}

/** שורות .gitignore → רשימת תבניות (בלי הערות ושורות ריקות; שלילה "!" לא נתמכת) */
export function parseGitignore(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && !l.startsWith("!"));
}

const cache = new Map<string, RegExp>();

/** תבנית gitignore → ביטוי רגולרי (תת-קבוצה סבירה: * ** ? / בהתחלה ובסוף) */
function toRegex(pattern: string): RegExp {
  const cached = cache.get(pattern);
  if (cached) return cached;
  let p = pattern;
  const dirOnly = p.endsWith("/");
  if (dirOnly) p = p.slice(0, -1);
  const anchored = p.startsWith("/") || p.includes("/");
  p = p.replace(/^\//, "");
  // "**/" = אפס או יותר תיקיות; "**" בסוף = הכל מתחת; "*" ו-"?" לא חוצים "/"
  let body = "";
  for (let i = 0; i < p.length; i++) {
    if (p.startsWith("**/", i)) {
      body += "(?:.*/)?";
      i += 2;
    } else if (p.startsWith("**", i)) {
      body += ".*";
      i += 1;
    } else if (p[i] === "*") body += "[^/]*";
    else if (p[i] === "?") body += "[^/]";
    else body += p[i].replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  const prefix = anchored ? "^" : "(^|/)";
  const suffix = dirOnly ? "/" : "(/|$)";
  const re = new RegExp(prefix + body + suffix);
  cache.set(pattern, re);
  return re;
}

export function isIgnored(path: string, patterns: string[]): boolean {
  return [...ALWAYS_IGNORED, ...patterns].some((pat) => toRegex(pat).test(path));
}

/** תיקיית-שורש משותפת לכל הקבצים (למשל "my-site/" מתוך ZIP), או "" */
export function commonRoot(paths: string[]): string {
  if (paths.length === 0) return "";
  const first = paths[0].split("/")[0];
  if (!paths.every((p) => p.includes("/") && p.split("/")[0] === first)) return "";
  return `${first}/`;
}

/** קורא את מה שהמשתמש בחר; מחזיר גם את תוכן ה-.gitignore אם נמצא ביניהם. */
export async function loadRepoEntries(list: FileList | File[]): Promise<{ entries: RepoEntry[]; gitignore: string | null }> {
  const entries = new Map<string, RepoEntry>();
  let gitignore: string | null = null;

  const add = (rawPath: string, buf: ArrayBuffer) => {
    const path = normalize(rawPath);
    if (!path) return;
    if (/(^|\/)\.gitignore$/.test(path) && !gitignore) gitignore = new TextDecoder().decode(buf);
    entries.set(path, { path, base64: bufferToBase64(buf), size: buf.byteLength });
  };

  for (const file of Array.from(list)) {
    if (/\.zip$/i.test(file.name) || file.type === "application/zip" || file.type === "application/x-zip-compressed") {
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(file);
      for (const entry of Object.values(zip.files)) {
        if (!entry.dir) add(entry.name, await entry.async("arraybuffer"));
      }
      continue;
    }
    const rel = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
    add(rel, await file.arrayBuffer());
  }
  return { entries: Array.from(entries.values()).sort((a, b) => a.path.localeCompare(b.path)), gitignore };
}
