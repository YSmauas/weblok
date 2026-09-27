/**
 * גישה ל-GitHub ישירות מהדפדפן: ייבוא קבצי טקסט מריפו, ודחיפת הקבצים בחזרה
 * כקומיט אחד. הטוקן (אם יש) מוזן ע"י המשתמש לפעולה הזו בלבד ולא נשמר -
 * לא אצלנו בשרת ולא בדפדפן.
 */
import { classifyPath, MAX_FILES_PER_IMPORT, PROJECT_QUOTA_BYTES, type LoadedFile, type LoadResult } from "@/lib/projects/files";

const API = "https://api.github.com";

export type GithubErrorCode = "not_found" | "unauthorized" | "rate_limited" | "conflict" | "failed";

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

async function gh<T>(path: string, token: string | undefined, init?: RequestInit): Promise<T> {
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
  if (res.status === 404) throw new GithubError("not_found");
  if (res.status === 401) throw new GithubError("unauthorized");
  if (res.status === 403 || res.status === 429) {
    throw new GithubError(res.headers.get("x-ratelimit-remaining") === "0" ? "rate_limited" : "unauthorized");
  }
  if (res.status === 409 || res.status === 422) throw new GithubError("conflict");
  throw new GithubError("failed");
}

const branchPath = (b: string) => b.split("/").map(encodeURIComponent).join("/");
const repoPath = ({ owner, repo }: RepoRef) => `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;

export async function defaultBranch(ref: RepoRef, token?: string): Promise<string> {
  const data = await gh<{ default_branch: string }>(repoPath(ref), token);
  return data.default_branch;
}

function decodeBase64Utf8(b64: string): string {
  const bin = atob(b64.replace(/\n/g, ""));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/**
 * מייבא את קבצי הטקסט מהריפו (עד המכסה). בלי טוקן עובד רק לריפו ציבורי,
 * ו-GitHub מגביל ל-60 בקשות בשעה - לכן בוחרים מראש רק קבצים רלוונטיים.
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
 * דוחף את הקבצים כקומיט אחד על הענף (base_tree = המצב הקיים, כך שקבצים
 * שלא נגענו בהם נשארים כמו שהם). דורש טוקן עם הרשאת Contents: write.
 */
export async function pushFiles(
  ref: RepoRef,
  branch: string,
  token: string,
  files: LoadedFile[],
  message: string
): Promise<{ commitUrl: string }> {
  const base = repoPath(ref);
  const head = await gh<{ object: { sha: string } }>(`${base}/git/ref/heads/${branchPath(branch)}`, token);
  const parent = await gh<{ tree: { sha: string } }>(`${base}/git/commits/${head.object.sha}`, token);
  const tree = await gh<{ sha: string }>(`${base}/git/trees`, token, {
    method: "POST",
    body: JSON.stringify({
      base_tree: parent.tree.sha,
      tree: files.map((f) => ({ path: f.path, mode: "100644", type: "blob", content: f.content })),
    }),
  });
  const commit = await gh<{ sha: string; html_url: string }>(`${base}/git/commits`, token, {
    method: "POST",
    body: JSON.stringify({ message, tree: tree.sha, parents: [head.object.sha] }),
  });
  await gh(`${base}/git/refs/heads/${branchPath(branch)}`, token, {
    method: "PATCH",
    body: JSON.stringify({ sha: commit.sha }),
  });
  return { commitUrl: commit.html_url };
}
