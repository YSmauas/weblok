"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { GithubError, isValidBranch, githubUrl } from "@/lib/github/client";
import { createRepo, isValidRepoName, listUserRepos, pushEntries, splitFullName, type RepoSummary } from "@/lib/github/manager";
import { loadSecret, removeSecret, saveSecret } from "@/lib/ai/key-vault";
import type { PushEntry } from "@/lib/github/manager";

/** אותו שם סוד כמו בכלי "ניהול מאגר GitHub" - טוקן שנשמר שם זמין גם כאן */
const TOKEN_SECRET = "github-token";

type Target = "new" | "existing";
type Mode = "commit" | "pr";
type Result = { repo: string; commitUrl: string; prUrl?: string };

/** owner/repo → כתובת בטוחה (כל מקטע מקודד; שם לא תקין → דף הבית של GitHub) */
function repoUrl(fullName: string): string {
  const m = fullName.match(/^([A-Za-z0-9-]{1,39})\/([A-Za-z0-9._-]{1,100})$/);
  return m ? `https://github.com/${encodeURIComponent(m[1])}/${encodeURIComponent(m[2])}` : "https://github.com/";
}


const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * דחיפת הפרויקט שנוצר לגיטהאב - ישירות מהדפדפן עם הטוקן של המשתמש.
 * הטוקן לא נשלח לשרת שלנו (ונשמר מוצפן בדפדפן רק אם ביקשו).
 */
export function StructureGithubPush({
  buildEntries,
  defaultRepoName,
  defaultMessage,
}: {
  /** נקרא רק ברגע הדחיפה - כדי לא לקודד base64 בכל הקשה */
  buildEntries: () => PushEntry[];
  defaultRepoName: string;
  defaultMessage: string;
}) {
  const { t } = useLocale();
  const [token, setToken] = useState("");
  const [remember, setRemember] = useState(false);
  const [target, setTarget] = useState<Target>("new");
  const [repoName, setRepoName] = useState(defaultRepoName);
  const [isPrivate, setIsPrivate] = useState(true);
  const [repos, setRepos] = useState<RepoSummary[]>([]);
  const [repo, setRepo] = useState("");
  const [mode, setMode] = useState<Mode>("commit");
  const [branch, setBranch] = useState("weblok-rsvp");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<null | "repos" | "push">(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    loadSecret(TOKEN_SECRET).then((saved) => {
      if (saved) {
        setToken(saved);
        setRemember(true);
      }
    });
  }, []);

  useEffect(() => {
    if (!remember || token.trim().length < 10) return;
    const timer = setTimeout(() => saveSecret(TOKEN_SECRET, token.trim()), 600);
    return () => clearTimeout(timer);
  }, [remember, token]);

  const fail = (e: unknown) => setError(t(`github.err.${e instanceof GithubError ? e.code : "failed"}`));

  async function loadRepos() {
    if (!token.trim()) return;
    setBusy("repos");
    setError("");
    try {
      const list = await listUserRepos(token);
      setRepos(list);
      if (!list.some((r) => r.fullName === repo)) setRepo(list[0]?.fullName ?? "");
    } catch (e) {
      fail(e);
    } finally {
      setBusy(null);
    }
  }

  const canPush =
    !busy &&
    !!token.trim() &&
    (target === "new" ? isValidRepoName(repoName.trim()) : !!repo && (mode === "commit" || isValidBranch(branch.trim())));

  async function push() {
    if (!canPush) return;
    setBusy("push");
    setError("");
    setResult(null);
    let created: RepoSummary | null = null;
    try {
      const files = buildEntries();
      const msg = message.trim() || defaultMessage;
      let fullName: string;
      let baseBranch: string;
      let newBranch: string | null = null;

      if (target === "new") {
        created = await createRepo(token, { name: repoName.trim(), description: defaultMessage, private: isPrivate });
        fullName = created.fullName;
        baseBranch = created.defaultBranch;
      } else {
        const info = repos.find((r) => r.fullName === repo);
        fullName = repo;
        baseBranch = info?.defaultBranch ?? "main";
        if (mode === "pr") newBranch = branch.trim();
      }

      const run = () =>
        pushEntries({
          token,
          ref: splitFullName(fullName),
          baseBranch,
          newBranch,
          message: msg,
          prTitle: msg,
          files,
          onProgress: (done, total) => setProgress({ done, total }),
        });
      let out: Awaited<ReturnType<typeof pushEntries>>;
      try {
        out = await run();
      } catch (e) {
        // ריפו שנוצר הרגע לפעמים עוד לא "מוכן" ב-API של GitHub - ניסיון חוזר אחד
        if (target !== "new") throw e;
        await sleep(2500);
        out = await run();
      }
      setResult({ repo: fullName, commitUrl: githubUrl(out.commitUrl) ?? "", prUrl: githubUrl(out.prUrl) });
    } catch (e) {
      fail(e);
      // הריפו כבר נוצר - ניסיון נוסף ידחוף אליו במקום לנסות ליצור אותו שוב
      if (created) {
        setRepos([created]);
        setRepo(created.fullName);
        setMode("commit");
        setTarget("existing");
      }
    } finally {
      setBusy(null);
      setProgress(null);
    }
  }

  const tabClass = (active: boolean) =>
    `text-xs px-3 py-1.5 rounded-full transition-colors ${
      active ? "bg-accent text-base-bg font-semibold" : "text-ink-secondary hover:text-ink-primary"
    }`;

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="sg-token" className="label">
          {t("gh.token")}
        </label>
        <input
          id="sg-token"
          type="password"
          autoComplete="off"
          spellCheck={false}
          dir="ltr"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="github_pat_... / ghp_..."
          className="field font-mono"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-ink-secondary">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => {
                setRemember(e.target.checked);
                if (!e.target.checked) removeSecret(TOKEN_SECRET);
              }}
              className="accent-[var(--accent)]"
            />
            {t("gh.remember")}
          </label>
          <a
            href="https://github.com/settings/personal-access-tokens/new"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-accent hover:underline"
          >
            {t("github.tokenCreate")}
          </a>
        </div>
        <p className="text-[11px] text-ink-muted mt-1 leading-relaxed">{t("gh.tokenHint")}</p>
      </div>

      <div className="flex flex-wrap max-w-full gap-1 bg-base-panel2 rounded-2xl p-1 border border-base-border w-fit" role="tablist">
        <button role="tab" aria-selected={target === "new"} onClick={() => setTarget("new")} className={tabClass(target === "new")}>
          {t("structures.gh.newRepo")}
        </button>
        <button
          role="tab"
          aria-selected={target === "existing"}
          onClick={() => {
            setTarget("existing");
            if (!repos.length && token.trim()) loadRepos();
          }}
          className={tabClass(target === "existing")}
        >
          {t("structures.gh.existingRepo")}
        </button>
      </div>

      {target === "new" ? (
        <div className="space-y-2">
          <label htmlFor="sg-name" className="label">
            {t("structures.gh.repoName")}
          </label>
          <input
            id="sg-name"
            dir="ltr"
            value={repoName}
            maxLength={100}
            onChange={(e) => setRepoName(e.target.value)}
            className="field font-mono"
          />
          {repoName.trim() && !isValidRepoName(repoName.trim()) && (
            <p className="text-xs text-danger">{t("structures.gh.badName")}</p>
          )}
          <label className="flex items-center gap-2 text-xs text-ink-secondary cursor-pointer w-fit">
            <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} className="accent-[var(--accent)]" />
            {t("gh.private")}
          </label>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2 items-end">
            <div className="flex-1 min-w-0">
              <label htmlFor="sg-repo" className="label">
                {t("structures.gh.repo")}
              </label>
              <select id="sg-repo" dir="ltr" value={repo} onChange={(e) => setRepo(e.target.value)} className="field font-mono" disabled={!repos.length}>
                {repos.map((r) => (
                  <option key={r.fullName} value={r.fullName}>
                    {r.fullName}
                    {r.private ? " (private)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <button type="button" onClick={loadRepos} disabled={!!busy || !token.trim()} className="btn-outline btn-sm shrink-0">
              {busy === "repos" ? t("projects.working") : t("structures.gh.loadRepos")}
            </button>
          </div>
          <div className="flex flex-wrap max-w-full gap-1 bg-base-panel2 rounded-2xl p-1 border border-base-border w-fit" role="tablist">
            <button role="tab" aria-selected={mode === "commit"} onClick={() => setMode("commit")} className={tabClass(mode === "commit")}>
              {t("structures.gh.modeCommit")}
            </button>
            <button role="tab" aria-selected={mode === "pr"} onClick={() => setMode("pr")} className={tabClass(mode === "pr")}>
              {t("structures.gh.modePr")}
            </button>
          </div>
          {mode === "pr" && (
            <div>
              <label htmlFor="sg-branch" className="label">
                {t("structures.gh.branch")}
              </label>
              <input id="sg-branch" dir="ltr" value={branch} onChange={(e) => setBranch(e.target.value)} className="field font-mono" />
            </div>
          )}
          <p className="text-[11px] text-ink-muted leading-relaxed">{t("structures.gh.existingNote")}</p>
        </div>
      )}

      <div>
        <label htmlFor="sg-msg" className="label">
          {t("structures.gh.message")}
        </label>
        <input
          id="sg-msg"
          value={message}
          maxLength={200}
          placeholder={defaultMessage}
          onChange={(e) => setMessage(e.target.value)}
          className="field"
        />
      </div>

      <button type="button" onClick={push} disabled={!canPush} className="btn-primary w-full sm:w-auto">
        {busy === "push" ? t("projects.working") : t("structures.gh.push")}
      </button>

      {progress && (
        <div>
          <div className="flex justify-between text-xs text-ink-muted mb-1">
            <span>{t("structures.gh.uploading")}</span>
            <span dir="ltr">
              {progress.done}/{progress.total}
            </span>
          </div>
          <div className="h-2 rounded-full bg-base-bg overflow-hidden border border-base-border">
            <div className="h-full bg-accent transition-all" style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} />
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      {result && (
        <div role="status" className="rounded-xl border border-accent/40 bg-accent-soft p-3 text-sm space-y-2">
          <p className="font-semibold text-success">{t("structures.gh.done")}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <a href={repoUrl(result.repo)} target="_blank" rel="noreferrer" className="text-accent underline" dir="ltr">
              {result.repo}
            </a>
            {githubUrl(result.commitUrl) && (
              <a href={githubUrl(result.commitUrl)} target="_blank" rel="noreferrer" className="text-accent underline">
                {t("github.viewCommit")}
              </a>
            )}
            {result.prUrl && (
              <a href={githubUrl(result.prUrl)} target="_blank" rel="noreferrer" className="text-accent underline">
                Pull Request
              </a>
            )}
          </div>
          <p className="text-xs text-ink-secondary">
            {t("structures.gh.next")}{" "}
            <a href="https://vercel.com/new" target="_blank" rel="noreferrer" className="text-accent underline">
              vercel.com/new
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
