/**
 * "ניהול מאגר GitHub" (כלים מתקדמים): פעולות על ריפו של המשתמש, ישירות מהדפדפן
 * עם הטוקן האישי שלו. שום בקשה לא עוברת בשרת שלנו.
 */
import { branchPath, gh, GithubError, repoPath, type RepoRef } from "./client";

export interface RepoSummary {
  fullName: string;
  private: boolean;
  defaultBranch: string;
  updatedAt: string;
}

export function splitFullName(fullName: string): RepoRef {
  const [owner, repo] = fullName.split("/");
  return { owner, repo };
}

export async function listUserRepos(token: string): Promise<RepoSummary[]> {
  const out: RepoSummary[] = [];
  // עד 300 ריפוים (3 עמודים) - מספיק לכל שימוש סביר, בלי להציף את ה-API
  for (let page = 1; page <= 3; page++) {
    const data = await gh<{ full_name: string; private: boolean; default_branch: string; updated_at: string }[]>(
      `/user/repos?sort=updated&per_page=100&page=${page}`,
      token
    );
    out.push(...data.map((r) => ({ fullName: r.full_name, private: r.private, defaultBranch: r.default_branch, updatedAt: r.updated_at })));
    if (data.length < 100) break;
  }
  return out;
}

export async function createRepo(
  token: string,
  opts: { name: string; description: string; private: boolean }
): Promise<RepoSummary> {
  const r = await gh<{ full_name: string; private: boolean; default_branch: string; updated_at: string }>("/user/repos", token, {
    method: "POST",
    body: JSON.stringify({ name: opts.name, description: opts.description, private: opts.private, auto_init: true }),
  });
  return { fullName: r.full_name, private: r.private, defaultBranch: r.default_branch, updatedAt: r.updated_at };
}

export const isValidRepoName = (name: string) => /^[A-Za-z0-9._-]{1,100}$/.test(name) && !/^\.+$/.test(name);

/** מכסת ה-API שנותרה (לא נספרת כבקשה ע"י GitHub). */
export async function rateLimit(token: string | undefined): Promise<{ remaining: number; limit: number; reset: Date }> {
  const data = await gh<{ resources: { core: { remaining: number; limit: number; reset: number } } }>("/rate_limit", token);
  const core = data.resources.core;
  return { remaining: core.remaining, limit: core.limit, reset: new Date(core.reset * 1000) };
}

/** הריפו כ-ZIP (zipball של הענף). */
export async function downloadZipball(ref: RepoRef, branch: string, token: string): Promise<Blob> {
  let res: Response;
  try {
    res = await fetch(`https://api.github.com${repoPath(ref)}/zipball/${branchPath(branch)}`, {
      headers: { Authorization: `Bearer ${token.trim()}` },
    });
  } catch {
    throw new GithubError("failed");
  }
  if (res.status === 404) throw new GithubError("not_found");
  if (res.status === 401 || res.status === 403) throw new GithubError("unauthorized");
  if (!res.ok) throw new GithubError("failed");
  return res.blob();
}

/** תוכן .gitignore של הריפו, או null אם אין. */
export async function fetchGitignore(ref: RepoRef, branch: string, token: string): Promise<string | null> {
  try {
    const data = await gh<{ content?: string }>(`${repoPath(ref)}/contents/.gitignore?ref=${encodeURIComponent(branch)}`, token);
    if (!data.content) return null;
    const bytes = Uint8Array.from(atob(data.content.replace(/\n/g, "")), (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

export interface PushEntry {
  path: string;
  /** התוכן כ-base64 - עובד גם לקבצים בינאריים (תמונות, פונטים) */
  base64: string;
}

export interface PushOptions {
  token: string;
  ref: RepoRef;
  baseBranch: string;
  /** null = קומיט ישיר ל-baseBranch; אחרת נוצר ענף חדש ונפתח PR */
  newBranch: string | null;
  message: string;
  prTitle?: string;
  files: PushEntry[];
  onProgress?: (done: number, total: number) => void;
  onLog?: (step: string) => void;
}

/**
 * דחיפת קבצים כקומיט אחד: blobs במקביל (5) → tree על בסיס הקיים → commit →
 * עדכון ה-ref (בלי force). במצב PR: קודם נוצר ענף מה-base, ובסוף נפתח PR.
 */
export async function pushEntries(o: PushOptions): Promise<{ commitUrl: string; prUrl?: string; prNumber?: number }> {
  const base = repoPath(o.ref);
  const log = o.onLog ?? (() => {});

  log("base");
  const baseRef = await gh<{ object: { sha: string } }>(`${base}/git/ref/heads/${branchPath(o.baseBranch)}`, o.token);
  const target = o.newBranch ?? o.baseBranch;

  if (o.newBranch) {
    log("branch");
    try {
      await gh(`${base}/git/refs`, o.token, {
        method: "POST",
        body: JSON.stringify({ ref: `refs/heads/${o.newBranch}`, sha: baseRef.object.sha }),
      });
    } catch (e) {
      // ענף שכבר קיים - ממשיכים לדחוף אליו
      if (!(e instanceof GithubError && e.code === "conflict")) throw e;
    }
  }

  const head = o.newBranch
    ? await gh<{ object: { sha: string } }>(`${base}/git/ref/heads/${branchPath(target)}`, o.token)
    : baseRef;
  const parent = await gh<{ tree: { sha: string } }>(`${base}/git/commits/${head.object.sha}`, o.token);

  log("upload");
  const tree: { path: string; mode: string; type: string; sha: string }[] = [];
  const queue = [...o.files];
  let done = 0;
  o.onProgress?.(0, o.files.length);
  await Promise.all(
    Array.from({ length: Math.min(5, queue.length) }, async () => {
      while (queue.length) {
        const f = queue.shift()!;
        const blob = await gh<{ sha: string }>(`${base}/git/blobs`, o.token, {
          method: "POST",
          body: JSON.stringify({ content: f.base64, encoding: "base64" }),
        });
        tree.push({ path: f.path, mode: "100644", type: "blob", sha: blob.sha });
        o.onProgress?.(++done, o.files.length);
      }
    })
  );

  log("commit");
  const newTree = await gh<{ sha: string }>(`${base}/git/trees`, o.token, {
    method: "POST",
    body: JSON.stringify({ base_tree: parent.tree.sha, tree }),
  });
  const commit = await gh<{ sha: string; html_url: string }>(`${base}/git/commits`, o.token, {
    method: "POST",
    body: JSON.stringify({ message: o.message, tree: newTree.sha, parents: [head.object.sha] }),
  });
  await gh(`${base}/git/refs/heads/${branchPath(target)}`, o.token, {
    method: "PATCH",
    body: JSON.stringify({ sha: commit.sha, force: false }),
  });

  if (!o.newBranch) return { commitUrl: commit.html_url };

  log("pr");
  const pr = await gh<{ html_url: string; number: number }>(`${base}/pulls`, o.token, {
    method: "POST",
    body: JSON.stringify({ title: o.prTitle || o.message, head: o.newBranch, base: o.baseBranch, body: "Created with WEblok" }),
  });
  return { commitUrl: commit.html_url, prUrl: pr.html_url, prNumber: pr.number };
}
