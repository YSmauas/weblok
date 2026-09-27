/**
 * כללי הקבצים של "פרויקטים קטנים" - משותפים להעלאה, לייבוא מגיטהאב ולבדיקות.
 * המכסה נאכפת גם ב-DB (טריגר ב-migration 0004); כאן זו בדיקה מוקדמת כדי
 * לתת למשתמש הודעה ברורה לפני שמנסים לשמור.
 */

/** מכסה כוללת לכל הפרויקטים של משתמש אחד */
export const PROJECT_QUOTA_BYTES = 5 * 1024 * 1024;
export const MAX_FILES_PER_IMPORT = 300;

const TEXT_EXTENSIONS = new Set([
  "html", "htm", "css", "scss", "sass", "less", "js", "mjs", "cjs", "jsx", "ts", "tsx",
  "json", "md", "mdx", "txt", "svg", "xml", "vue", "svelte", "astro", "php", "yml", "yaml",
  "toml", "csv", "webmanifest", "gitignore", "htaccess",
]);

/** תיקיות שאין סיבה להעלות (תלויות, תוצרי build, מטא של git) */
const SKIP_DIRS = /(^|\/)(node_modules|\.git|\.next|dist|build|out|coverage|\.vercel|\.cache|vendor)(\/|$)/i;
/** קבצים שעלולים להכיל סודות - לעולם לא מעלים */
const SECRET_FILES = /(^|\/)(\.env(\..*)?|.*\.pem|.*\.key|id_rsa.*|\.npmrc)$/i;

export type SkipReason = "binary" | "secret" | "ignored_dir" | "too_many" | "bad_path";

export function normalizePath(path: string): string | null {
  const clean = path.replace(/\\/g, "/").replace(/^\.?\/+/, "").replace(/\/{2,}/g, "/").trim();
  if (!clean || clean.length > 300 || clean.split("/").some((seg) => seg === ".." || seg === "")) return null;
  return clean;
}

export function extensionOf(path: string): string {
  const name = path.split("/").pop() ?? "";
  if (name.startsWith(".") && !name.slice(1).includes(".")) return name.slice(1).toLowerCase();
  return name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
}

export function classifyPath(path: string): SkipReason | null {
  if (SKIP_DIRS.test(path)) return "ignored_dir";
  if (SECRET_FILES.test(path)) return "secret";
  if (!TEXT_EXTENSIONS.has(extensionOf(path))) return "binary";
  return null;
}

export const isHtmlPath = (path: string) => /\.html?$/i.test(path);

export function byteSize(content: string): number {
  return new TextEncoder().encode(content).length;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
}

export interface LoadedFile {
  path: string;
  content: string;
  size: number;
}

export interface LoadResult {
  files: LoadedFile[];
  skipped: { path: string; reason: SkipReason }[];
}

/** מסיר תיקיית-שורש משותפת (למשל "my-site/") כשכל הקבצים יושבים תחתיה. */
function stripCommonRoot(files: LoadedFile[]): LoadedFile[] {
  if (files.length === 0) return files;
  const first = files[0].path.split("/")[0];
  if (!files.every((f) => f.path.includes("/") && f.path.split("/")[0] === first)) return files;
  return files.map((f) => ({ ...f, path: f.path.slice(first.length + 1) }));
}

async function pushText(result: LoadResult, rawPath: string, read: () => Promise<string>) {
  const path = normalizePath(rawPath);
  if (!path) return result.skipped.push({ path: rawPath, reason: "bad_path" });
  const reason = classifyPath(path);
  if (reason) return result.skipped.push({ path, reason });
  if (result.files.length >= MAX_FILES_PER_IMPORT) return result.skipped.push({ path, reason: "too_many" });
  const content = await read();
  // קובץ "טקסט" עם תו NUL הוא בפועל בינארי (ו-Postgres text לא מקבל אותו)
  if (content.includes("\u0000")) return result.skipped.push({ path, reason: "binary" });
  result.files.push({ path, content, size: byteSize(content) });
}

/**
 * קורא קבצים שהמשתמש בחר (קבצים בודדים, תיקייה שלמה, או ZIP) - הכל בדפדפן.
 * קבצים בינאריים (תמונות, פונטים) ותיקיות תלויות מדולגים ומדווחים.
 */
export async function loadUploadedFiles(list: FileList | File[]): Promise<LoadResult> {
  const result: LoadResult = { files: [], skipped: [] };
  for (const file of Array.from(list)) {
    if (/\.zip$/i.test(file.name)) {
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(file);
      const entries = Object.values(zip.files).filter((e) => !e.dir);
      for (const entry of entries) await pushText(result, entry.name, () => entry.async("string"));
      continue;
    }
    const rel = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
    await pushText(result, rel, () => file.text());
  }
  result.files = stripCommonRoot(result.files);
  return result;
}
