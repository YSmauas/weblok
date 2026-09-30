/**
 * סנכרון "פרויקט קטן" חזרה לגיטהאב אחרי ייבוא: דוחפים רק את מה שבאמת השתנה
 * אצלנו, ומזהים אם מישהו שינה את אותם קבצים בגיטהאב מאז הייבוא.
 *
 * הזרימה:
 *   1. בייבוא נשמר ה-SHA של הקומיט שממנו ייבאנו (baseSha) - ב-localStorage,
 *      לפי מזהה הפרויקט (בלי שינוי סכמה ב-DB).
 *   2. בדחיפה: מחשבים לכל קובץ בפרויקט git blob SHA-1 מקומית
 *      (sha1("blob <len>\0<bytes>")), ומשווים לעץ של baseSha. רק קבצים שונים/חדשים
 *      נדחפים. קבצים שנמחקו בפרויקט לא נמחקים בריפו.
 *   3. אם ראש הענף זז מאז baseSha - שואלים את GitHub (compare) אילו קבצים השתנו
 *      שם; חיתוך עם הקבצים שלנו = קונפליקט אפשרי. במצב PR הענף נוצר מ-baseSha,
 *      כך ש-GitHub מציג את הקונפליקטים ב-PR עצמו; קומיט ישיר ידרוס - לכן מזהירים.
 *
 * הרשאות מינימליות לטוקן (Fine-grained PAT, רק הריפו הנבחר):
 *   Contents: Read and write · Pull requests: Read and write · Metadata: Read (אוטומטי).
 * הטוקן נשלח ישירות מהדפדפן ל-GitHub; נשמר (מוצפן, בדפדפן בלבד) רק אם ביקשו.
 */
import { branchHead, gh, repoPath, type RepoRef } from "./client";
import { pushEntries } from "./manager";

export interface ImportBase {
  repo: string;
  branch: string;
  sha: string;
  at: string;
}

const baseKey = (projectId: string) => `weblok-gh-base:${projectId}`;

export function saveImportBase(projectId: string, base: Omit<ImportBase, "at">) {
  try {
    localStorage.setItem(baseKey(projectId), JSON.stringify({ ...base, at: new Date().toISOString() }));
  } catch {
    /* אין אחסון (גלישה פרטית) - הדחיפה תשווה מול ראש הענף ותזהיר */
  }
}

/** בסיס הייבוא, רק אם הוא שייך לאותו ריפו וענף שהפרויקט מחובר אליהם */
export function loadImportBase(projectId: string, repo: string, branch: string): ImportBase | null {
  try {
    const raw = localStorage.getItem(baseKey(projectId));
    if (!raw) return null;
    const b = JSON.parse(raw) as Partial<ImportBase>;
    if (typeof b.sha !== "string" || !/^[0-9a-f]{40}$/.test(b.sha)) return null;
    if (b.repo?.toLowerCase() !== repo.toLowerCase() || b.branch !== branch) return null;
    return { repo: b.repo, branch: b.branch, sha: b.sha, at: typeof b.at === "string" ? b.at : "" };
  } catch {
    return null;
  }
}

/* ---------- git blob SHA-1 ---------- */

const hex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");

/** אותו SHA ש-git נותן לקובץ: sha1("blob " + אורך בבתים + "\0" + התוכן) */
export async function gitBlobSha(content: string | Uint8Array): Promise<string> {
  const bytes = typeof content === "string" ? new TextEncoder().encode(content) : content;
  const header = new TextEncoder().encode(`blob ${bytes.length}\0`);
  const all = new Uint8Array(header.length + bytes.length);
  all.set(header);
  all.set(bytes, header.length);
  return hex(await crypto.subtle.digest("SHA-1", all));
}

export function utf8ToBase64(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...Array.from(bytes.subarray(i, i + 0x8000)));
  return btoa(bin);
}

/* ---------- תכנון הדחיפה ---------- */

export interface SyncFile {
  path: string;
  content: string;
}

export interface PushPlan {
  /** הקומיט שמולו השווינו (בסיס הייבוא, או ראש הענף אם אין בסיס שמור) */
  baseSha: string;
  headSha: string;
  /** לא נשמר בסיס ייבוא (פרויקט ישן / אחסון נמחק) - ההשוואה מול ראש הענף הנוכחי */
  baseUnknown: boolean;
  /** ראש הענף זז מאז הייבוא */
  baseMoved: boolean;
  /** קבצים שהשתנו אצלנו (או חדשים) - רק אותם נדחוף */
  changed: SyncFile[];
  /** מתוך changed: קבצים שהשתנו גם בגיטהאב מאז הבסיס (קונפליקט אפשרי) */
  conflicts: string[];
  /** GitHub מחזיר עד 300 קבצים בהשוואה - אם יותר, הרשימה חלקית */
  compareTruncated: boolean;
}

async function treeShas(ref: RepoRef, commitSha: string, token: string): Promise<Map<string, string>> {
  const tree = await gh<{ tree: { path: string; type: string; sha: string }[] }>(
    `${repoPath(ref)}/git/trees/${commitSha}?recursive=1`,
    token
  );
  return new Map(tree.tree.filter((i) => i.type === "blob").map((i) => [i.path, i.sha]));
}

export async function planProjectPush({
  ref,
  branch,
  token,
  files,
  baseSha,
}: {
  ref: RepoRef;
  branch: string;
  token: string;
  files: SyncFile[];
  baseSha: string | null;
}): Promise<PushPlan> {
  const headSha = await branchHead(ref, branch, token);
  let base = baseSha ?? headSha;
  let baseUnknown = !baseSha;

  let baseTree: Map<string, string>;
  try {
    baseTree = await treeShas(ref, base, token);
  } catch {
    // קומיט הבסיס כבר לא קיים (force-push בריפו) - אין מול מה להשוות חוץ מהראש
    base = headSha;
    baseUnknown = true;
    baseTree = await treeShas(ref, headSha, token);
  }

  const changed: SyncFile[] = [];
  for (const f of files) {
    if (baseTree.get(f.path) !== (await gitBlobSha(f.content))) changed.push(f);
  }

  const baseMoved = base !== headSha;
  let conflicts: string[] = [];
  let compareTruncated = false;
  if (baseMoved && changed.length) {
    const cmp = await gh<{ files?: { filename: string; previous_filename?: string }[] }>(
      `${repoPath(ref)}/compare/${base}...${headSha}`,
      token
    );
    const remote = new Set((cmp.files ?? []).flatMap((f) => [f.filename, f.previous_filename ?? ""]).filter(Boolean));
    compareTruncated = (cmp.files?.length ?? 0) >= 300;
    conflicts = changed.map((f) => f.path).filter((p) => remote.has(p));
  }

  return { baseSha: base, headSha, baseUnknown, baseMoved, changed, conflicts, compareTruncated };
}

/** האם קומיט ישיר עלול לדרוס שינויים שנעשו בגיטהאב - דורש אישור מפורש */
export const directPushRisky = (plan: PushPlan) => plan.baseUnknown || plan.conflicts.length > 0 || plan.compareTruncated;

export async function executeProjectPush({
  plan,
  ref,
  branch,
  token,
  mode,
  newBranch,
  message,
  onLog,
}: {
  plan: PushPlan;
  ref: RepoRef;
  branch: string;
  token: string;
  mode: "pr" | "direct";
  newBranch: string;
  message: string;
  onLog?: (step: string) => void;
}) {
  return pushEntries({
    token,
    ref,
    baseBranch: branch,
    newBranch: mode === "pr" ? newBranch : null,
    // PR: הענף נוצר מקומיט הבסיס, כך ש-GitHub מחשב קונפליקטים אמיתיים מול מה שהשתנה מאז
    baseSha: mode === "pr" ? plan.baseSha : undefined,
    message,
    prTitle: message,
    prBody: `Created with WEblok · ${plan.changed.length} file(s) changed:\n${plan.changed
      .slice(0, 50)
      .map((f) => `- \`${f.path.replace(/`/g, "")}\``)
      .join("\n")}`,
    files: plan.changed.map((f) => ({ path: f.path, base64: utf8ToBase64(f.content) })),
    onLog,
  });
}

/** שם ענף ברירת מחדל: weblok/<שם-הפרויקט>-<תאריך-שעה> */
export function defaultPushBranch(projectName: string, now = new Date()): string {
  const slug =
    projectName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 30) || "project";
  const stamp = now.toISOString().slice(0, 16).replace(/-|:|T/g, "").replace(/^(\d{8})(\d{4})$/, "$1-$2");
  return `weblok/${slug}-${stamp}`;
}
