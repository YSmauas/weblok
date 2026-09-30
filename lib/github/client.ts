/**
 * גישה ל-GitHub ישירות מהדפדפן: ייבוא קבצי טקסט מריפו (הדחיפה חזרה - sync.ts / manager.ts).
 * הטוקן (אם יש) נשלח ישירות מהדפדפן ל-GitHub ולא עובר בשרת שלנו; נשמר (מוצפן,
 * בדפדפן בלבד) רק אם המשתמש ביקש.
 */
import { classifyPath, MAX_FILES_PER_IMPORT, PROJECT_QUOTA_BYTES, type LoadResult } from "@/lib/projects/files";

const API = "https://api.github.com";

/**
 * unauthorized = טוקן שגוי/פג תוקף (401). forbidden_scope = הטוקן תקין אבל חסרה לו
 * הרשאה לפעולה/לריפו (403 "Resource not accessible..."). pr_exists = כבר פתוח PR
 * מאותו ענף.
 */
export type GithubErrorCode =
  | "not_found"
  | "unauthorized"
  | "forbidden_scope"
  | "rate_limited"
  | "conflict"
  | "pr_exists"
  | "failed";

export class GithubError extends Error {
  constructor(public code: GithubErrorCode) {
    super(code);
    this.name = "GithubError";
  }
}

export interface RepoRef {
  owner: string;
  repo: string;
}

/** מקבל "owner/repo" או כתובת מלאה של הריפו. */
export function parseRepo(input: string): RepoRef | null {
  const cleaned = input
    .trim()
    .replace(/^https?:\/\/(www\.)?github\.com\//i, "")
    .replace(/\.git$/i, "")
    .replace(/\/+$/, "");
  const m = cleaned.match(/^([A-Za-z0-9-]{1,39})\/([A-Za-z0-9._-]{1,100})$/);
  return m ? { owner: m[1], repo: m[2] } : null;
}

export const isValidBranch = (b: string) => /^[A-Za-z0-9._/-]{1,200}$/.test(b) && !b.includes("..");

export async function gh<T>(path: string, token: string | undefined, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      ...init,
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(token ? { Authorization: `Bearer ${token.trim()}` } : {}),
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
      },
    });
  } catch {
    throw new GithubError("failed");
  }
  if (res.ok) return (await res.json()) as T;
  // הודעת השגיאה של GitHub נבדקת רק מול תבניות ידועות - לא מוצגת למשתמש
  const body = await res.text().catch(() => "");
  throw new GithubError(classifyGithubError(res.status, body, res.headers.get("x-ratelimit-remaining")));
}

export function classifyGithubError(status: number, body: string, rateRemaining: string | null): GithubErrorCode {
  if (status === 404) return "not_found";
  if (status === 401) return "unauthorized";
  if (status === 429 || (status === 403 && (rateRemaining === "0" || /rate limit/i.test(body)))) return "rate_limited";
  if (status === 403) return "forbidden_scope";
  if (status === 422 && /pull request already exists/i.test(body)) return "pr_exists";
  if (status === 409 || status === 422) return "conflict";
  return "failed";
}

export const branchPath = (b: string) => b.split("/").map(encodeURIComponent).join("/");
export const repoPath = ({ owner, repo }: RepoRef) => `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;

export async function defaultBranch(ref: RepoRef, token?: string): Promise<string> {
  const data = await gh<{ default_branch: string }>(repoPath(ref), token);
  return data.default_branch;
}

function decodeBase64Utf8(b64: string): string {
  const bin = atob(b64.replace(/\n/g, ""));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  // ignoreBOM: שומרים BOM אם יש - אחרת הקובץ "ישתנה" (ה-SHA שלו) בלי שנגענו בו
  return new TextDecoder("utf-8", { ignoreBOM: true }).decode(bytes);
}

/** ה-SHA של הקומיט שבראש הענף כרגע */
export async function branchHead(ref: RepoRef, branch: string, token?: string): Promise<string> {
  const data = await gh<{ object: { sha: string } }>(`${repoPath(ref)}/git/ref/heads/${branchPath(branch)}`, token);
  return data.object.sha;
}

/**
 * מייבא את קבצי הטקסט מהריפו (עד המכסה). בלי טוקן עובד רק לריפו ציבורי,
 * ו-GitHub מגביל ל-60 בקשות בשעה - לכן בוחרים מראש רק קבצים רלוונטיים.
 * `branch` יכול להיות גם SHA של קומיט (ראו importRepoSnapshot).
 */
export async function importRepoFiles(
  ref: RepoRef,
  branch: string,
  token: string | undefined,
  budgetBytes: number = PROJECT_QUOTA_BYTES
): Promise<LoadResult> {
  const tree = await gh<{ tree: { path: string; type: string; sha: string; size?: number }[]; truncated: boolean }>(
    `${repoPath(ref)}/git/trees/${branchPath(branch)}?recursive=1`,
    token
  );

  const result: LoadResult = { files: [], skipped: [] };
  const wanted: { path: string; sha: string }[] = [];
  let planned = 0;
  for (const item of tree.tree) {
    if (item.type !== "blob") continue;
    const reason = classifyPath(item.path);
    if (reason) {
      result.skipped.push({ path: item.path, reason });
      continue;
    }
    if (wanted.length >= MAX_FILES_PER_IMPORT || planned + (item.size ?? 0) > budgetBytes) {
      result.skipped.push({ path: item.path, reason: "too_many" });
      continue;
    }
    planned += item.size ?? 0;
    wanted.push({ path: item.path, sha: item.sha });
  }

  // מקביליות מוגבלת - לא להציף את GitHub
  const queue = [...wanted];
  const workers = Array.from({ length: 6 }, async () => {
    while (queue.length) {
      const next = queue.shift()!;
      const blob = await gh<{ content: string; encoding: string }>(`${repoPath(ref)}/git/blobs/${next.sha}`, token);
      const content = blob.encoding === "base64" ? decodeBase64Utf8(blob.content) : blob.content;
      if (content.includes("\u0000")) {
        result.skipped.push({ path: next.path, reason: "binary" });
        continue;
      }
      result.files.push({ path: next.path, content, size: new TextEncoder().encode(content).length });
    }
  });
  await Promise.all(workers);
  result.files.sort((a, b) => a.path.localeCompare(b.path));
  return result;
}

/**
 * ייבוא "תמונת מצב": קודם נקבע הקומיט שבראש הענף, ואז הקבצים נקראים מהקומיט
 * הזה בדיוק. את ה-SHA שומרים (baseSha) כדי שבדחיפה חזרה נדע מה השתנה אצלנו
 * ומה השתנה בגיטהאב מאז.
 */
export async function importRepoSnapshot(
  ref: RepoRef,
  branch: string,
  token: string | undefined,
  budgetBytes: number = PROJECT_QUOTA_BYTES
): Promise<{ result: LoadResult; baseSha: string }> {
  const baseSha = await branchHead(ref, branch, token);
  return { result: await importRepoFiles(ref, baseSha, token, budgetBytes), baseSha };
}
