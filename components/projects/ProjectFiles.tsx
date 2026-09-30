"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/i18n/locale-provider";
import { downloadAsZip } from "@/lib/download-zip";
import {
  formatBytes,
  loadUploadedFiles,
  PROJECT_QUOTA_BYTES,
  type LoadResult,
} from "@/lib/projects/files";
import {
  deleteFile,
  fetchAllFiles,
  updateProject,
  upsertFiles,
  type ProjectFileMeta,
} from "@/lib/projects/db";
import { GithubError, importRepoSnapshot, isValidBranch, parseRepo, defaultBranch } from "@/lib/github/client";
import {
  defaultPushBranch,
  directPushRisky,
  executeProjectPush,
  loadImportBase,
  planProjectPush,
  saveImportBase,
  type PushPlan,
} from "@/lib/github/sync";
import { loadSecret, removeSecret, saveSecret } from "@/lib/ai/key-vault";
import { AppIcon } from "@/components/ui/AppIcon";

type Source = "upload" | "github";
type PushMode = "pr" | "direct";
type Msg = { kind: "ok" | "error" | "info"; text: string; links?: { href: string; label: string }[] };

/** אותו שם סוד כמו בכלי "ניהול מאגר GitHub" - טוקן שנשמר שם זמין גם כאן */
const TOKEN_SECRET = "github-token";
const TOKEN_PERMS_URL = "https://github.com/settings/personal-access-tokens/new";

/** קבצי הפרויקט: העלאה (קבצים/תיקייה/ZIP) או ייבוא מגיטהאב, רשימה, מכסה, ZIP ודחיפה חזרה. */
export function ProjectFiles({
  userId,
  projectId,
  projectName,
  files,
  usedBytes,
  githubRepo,
  githubBranch,
  disabled,
}: {
  userId: string;
  projectId: string;
  projectName: string;
  files: ProjectFileMeta[];
  usedBytes: number;
  githubRepo: string | null;
  githubBranch: string | null;
  disabled: boolean;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [source, setSource] = useState<Source>(githubRepo ? "github" : "upload");
  const [pending, setPending] = useState<LoadResult | null>(null);
  /** בסיס הייבוא של ה-pending (נשמר רק כשהקבצים נשמרים בפרויקט) */
  const [pendingBase, setPendingBase] = useState<{ repo: string; branch: string; sha: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Msg | null>(null);
  const [repoInput, setRepoInput] = useState(githubRepo ?? "");
  const [branchInput, setBranchInput] = useState(githubBranch ?? "");
  const [token, setToken] = useState("");
  const [remember, setRemember] = useState(false);
  const [commitMsg, setCommitMsg] = useState("Add blocks via WEblok");
  const [pushMode, setPushMode] = useState<PushMode>("pr");
  const [newBranch, setNewBranch] = useState(() => defaultPushBranch(projectName));
  const [plan, setPlan] = useState<PushPlan | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const quotaPct = Math.min(100, (usedBytes / PROJECT_QUOTA_BYTES) * 100);
  const thisProjectBytes = files.reduce((n, f) => n + f.size, 0);

  // טוקן שנשמר (מוצפן, בדפדפן בלבד) בביקור קודם
  useEffect(() => {
    loadSecret(TOKEN_SECRET).then((saved) => {
      if (saved) {
        setToken((cur) => cur || saved);
        setRemember(true);
      }
    });
  }, []);

  useEffect(() => {
    if (!remember || token.trim().length < 10) return;
    const timer = setTimeout(() => saveSecret(TOKEN_SECRET, token.trim()), 600);
    return () => clearTimeout(timer);
  }, [remember, token]);

  const ghError = (e: unknown) =>
    setMessage({ kind: "error", text: t(`github.err.${e instanceof GithubError ? e.code : "failed"}`) });

  /** בודק מכסה מראש: קבצים עם אותו נתיב מחליפים את הקיימים, לא מתווספים */
  function fitsQuota(result: LoadResult) {
    const replaced = files.filter((f) => result.files.some((n) => n.path === f.path)).reduce((n, f) => n + f.size, 0);
    const incoming = result.files.reduce((n, f) => n + f.size, 0);
    return usedBytes - replaced + incoming <= PROJECT_QUOTA_BYTES;
  }

  async function onPick(list: FileList | null) {
    if (!list?.length) return;
    setMessage(null);
    setBusy(true);
    try {
      setPending(await loadUploadedFiles(list));
      setPendingBase(null);
    } catch {
      setMessage({ kind: "error", text: t("projects.readFailed") });
    } finally {
      setBusy(false);
    }
  }

  async function importGithub() {
    const ref = parseRepo(repoInput);
    if (!ref) return setMessage({ kind: "error", text: t("github.badRepo") });
    if (branchInput && !isValidBranch(branchInput)) return setMessage({ kind: "error", text: t("github.badBranch") });
    setMessage(null);
    setBusy(true);
    try {
      const branch = branchInput || (await defaultBranch(ref, token || undefined));
      setBranchInput(branch);
      const budget = PROJECT_QUOTA_BYTES - usedBytes + thisProjectBytes;
      const snap = await importRepoSnapshot(ref, branch, token || undefined, budget);
      setPending(snap.result);
      setPendingBase({ repo: `${ref.owner}/${ref.repo}`, branch, sha: snap.baseSha });
      await updateProject(projectId, { github_repo: `${ref.owner}/${ref.repo}`, github_branch: branch });
    } catch (e) {
      ghError(e);
    } finally {
      setBusy(false);
    }
  }

  async function commitPending() {
    if (!pending || pending.files.length === 0) return;
    if (!fitsQuota(pending)) return setMessage({ kind: "error", text: t("projects.quotaExceeded") });
    setBusy(true);
    const err = await upsertFiles(projectId, userId, pending.files);
    setBusy(false);
    if (err) return setMessage({ kind: "error", text: t(err === "quota_exceeded" ? "projects.quotaExceeded" : "common.error") });
    // הקבצים בפרויקט = הקומיט שממנו ייבאנו → זה הבסיס להשוואה בדחיפה חזרה
    if (pendingBase) saveImportBase(projectId, pendingBase);
    setMessage({ kind: "ok", text: t("projects.filesSaved").replace("{n}", String(pending.files.length)) });
    setPending(null);
    setPendingBase(null);
    router.refresh();
  }

  async function remove(file: ProjectFileMeta) {
    if (!window.confirm(t("projects.deleteFileConfirm").replace("{path}", file.path))) return;
    if (await deleteFile(file.id)) router.refresh();
    else setMessage({ kind: "error", text: t("common.error") });
  }

  async function exportZip() {
    setBusy(true);
    const all = await fetchAllFiles(projectId);
    setBusy(false);
    if (!all) return setMessage({ kind: "error", text: t("common.error") });
    const folder = projectName.replace(/[^\p{L}\p{N}_-]+/gu, "-").replace(/^-+|-+$/g, "") || "project";
    const ascii = folder.replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
    await downloadAsZip(
      Object.fromEntries(all.map((f) => [f.path, f.content])),
      `${ascii || `weblok-project-${projectId.slice(0, 8)}`}.zip`,
      folder
    );
  }

  const repoRef = githubRepo ? parseRepo(githubRepo) : null;
  const branchOk = pushMode === "direct" || isValidBranch(newBranch.trim());
  const canPush = !busy && !!repoRef && !!githubBranch && !!token.trim() && branchOk;

  /** שלב 1: מה השתנה אצלנו ומה השתנה בגיטהאב. אם בטוח - ממשיכים לדחיפה מיד. */
  async function push() {
    if (!canPush || !repoRef || !githubBranch) return;
    setMessage(null);
    setPlan(null);
    setLog([]);
    setBusy(true);
    try {
      const all = await fetchAllFiles(projectId);
      if (!all) {
        setMessage({ kind: "error", text: t("projects.gh.readFailed") });
        return;
      }
      const base = loadImportBase(projectId, githubRepo!, githubBranch);
      const p = await planProjectPush({
        ref: repoRef,
        branch: githubBranch,
        token,
        files: all.map((f) => ({ path: f.path, content: f.content })),
        baseSha: base?.sha ?? null,
      });
      if (p.changed.length === 0) {
        setMessage({ kind: "info", text: t("projects.gh.noChanges") });
        return;
      }
      // קומיט ישיר שעלול לדרוס שינויים מגיטהאב - עוצרים ומבקשים החלטה מפורשת
      if (pushMode === "direct" && directPushRisky(p)) {
        setPlan(p);
        return;
      }
      await doPush(p, pushMode);
    } catch (e) {
      ghError(e);
    } finally {
      setBusy(false);
    }
  }

  /** שלב 2: הדחיפה עצמה (ענף חדש + PR, או קומיט ישיר) */
  async function doPush(p: PushPlan, mode: PushMode) {
    if (!repoRef || !githubBranch) return;
    setBusy(true);
    setPlan(null);
    try {
      const res = await executeProjectPush({
        plan: p,
        ref: repoRef,
        branch: githubBranch,
        token,
        mode,
        newBranch: newBranch.trim(),
        message: commitMsg.trim() || "Update via WEblok",
        onLog: (step) => setLog((prev) => [...prev, t(`gh.step.${step}`)]),
      });
      // קומיט ישיר על ענף שלא זז: הפרויקט זהה עכשיו לקומיט החדש → הוא הבסיס הבא
      if (mode === "direct" && !p.baseMoved && !p.baseUnknown) {
        saveImportBase(projectId, { repo: githubRepo!, branch: githubBranch, sha: res.commitSha });
      }
      const links = [{ href: res.commitUrl, label: t("github.viewCommit") }];
      if (res.prUrl) links.unshift({ href: res.prUrl, label: t("projects.gh.viewPr").replace("{n}", String(res.prNumber)) });
      const text =
        mode === "pr"
          ? t(p.conflicts.length ? "projects.gh.prOpenedConflicts" : "projects.gh.prOpened").replace("{n}", String(p.changed.length))
          : t("projects.gh.committed").replace("{n}", String(p.changed.length));
      setMessage({ kind: "ok", text, links });
      if (mode === "pr") setNewBranch(defaultPushBranch(projectName));
    } catch (e) {
      ghError(e);
    } finally {
      setBusy(false);
    }
  }

  const tab = (active: boolean) =>
    `inline-flex items-center gap-1.5 text-xs px-4 py-1.5 rounded-full transition-colors ${
      active ? "bg-accent text-base-bg font-semibold" : "text-ink-secondary hover:text-ink-primary"
    }`;

  const tokenField = (id: string) => (
    <div>
      <label htmlFor={id} className="label">
        {t("projects.gh.tokenLabel")}
      </label>
      <input
        id={id}
        type="password"
        autoComplete="off"
        spellCheck={false}
        dir="ltr"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="github_pat_..."
        className="field font-mono"
      />
      <label className="mt-2 flex items-center gap-2 text-xs text-ink-secondary cursor-pointer w-fit">
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
      <p className="text-[11px] text-ink-muted mt-1.5 leading-relaxed">
        {t("github.tokenPerms")}{" "}
        <a href={TOKEN_PERMS_URL} target="_blank" rel="noreferrer" className="text-accent hover:underline">
          {t("github.tokenCreate")}
        </a>
      </p>
    </div>
  );

  return (
    <fieldset disabled={disabled} className="space-y-5 disabled:opacity-60 min-w-0">
      {/* מכסה */}
      <div>
        <div className="flex justify-between text-xs text-ink-muted mb-1">
          <span>{t("projects.quota")}</span>
          <span dir="ltr">
            {formatBytes(usedBytes)} / {formatBytes(PROJECT_QUOTA_BYTES)}
          </span>
        </div>
        <div className="h-2 rounded-full bg-base-bg overflow-hidden border border-base-border">
          <div
            className={`h-full rounded-full transition-all ${quotaPct > 90 ? "bg-danger" : "bg-accent"}`}
            style={{ width: `${quotaPct}%` }}
          />
        </div>
      </div>

      <div className="flex gap-1 bg-base-panel2 rounded-full p-1 border border-base-border w-fit" role="tablist">
        <button role="tab" aria-selected={source === "upload"} onClick={() => setSource("upload")} className={tab(source === "upload")}>
          <AppIcon name="upload" className="!text-current" />
          {t("projects.srcUpload")}
        </button>
        <button role="tab" aria-selected={source === "github"} onClick={() => setSource("github")} className={tab(source === "github")}>
          <AppIcon name="github" className="!text-current" />
          {t("projects.srcGithub")}
        </button>
      </div>

      {source === "upload" ? (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <label className="btn-outline cursor-pointer">
              {t("projects.pickFiles")}
              <input
                type="file"
                multiple
                className="sr-only"
                onChange={(e) => {
                  onPick(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
            <label className="btn-outline cursor-pointer">
              {t("projects.pickFolder")}
              <input
                type="file"
                multiple
                className="sr-only"
                // תיקייה שלמה (Chrome/Edge/Firefox/Safari תומכים)
                {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
                onChange={(e) => {
                  onPick(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          <p className="text-[11px] text-ink-muted leading-relaxed">{t("projects.uploadHint")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid sm:grid-cols-[1fr_160px] gap-2">
            <div>
              <label htmlFor="gh-repo" className="label">{t("github.repo")}</label>
              <input id="gh-repo" dir="ltr" value={repoInput} onChange={(e) => setRepoInput(e.target.value)} placeholder="owner/repo" className="field font-mono" />
            </div>
            <div>
              <label htmlFor="gh-branch" className="label">{t("github.branch")}</label>
              <input id="gh-branch" dir="ltr" value={branchInput} onChange={(e) => setBranchInput(e.target.value)} placeholder="main" className="field font-mono" />
            </div>
          </div>
          {tokenField("gh-token")}
          <button onClick={importGithub} disabled={busy || !repoInput.trim()} className="btn-outline">
            {busy ? t("projects.working") : t("github.import")}
          </button>
        </div>
      )}

      {pending && (
        <div className="rounded-xl border border-accent/40 bg-accent-soft p-4 space-y-2 animate-fadeInUp">
          <p className="text-sm font-medium">
            {t("projects.readyToSave")
              .replace("{n}", String(pending.files.length))
              .replace("{size}", formatBytes(pending.files.reduce((n, f) => n + f.size, 0)))}
          </p>
          {pending.skipped.length > 0 && (
            <details className="text-xs text-ink-secondary">
              <summary className="cursor-pointer">
                {t("projects.skipped").replace("{n}", String(pending.skipped.length))}
              </summary>
              <ul dir="ltr" className="mt-2 max-h-40 overflow-y-auto space-y-0.5 font-mono text-[11px] text-start">
                {pending.skipped.slice(0, 200).map((s) => (
                  <li key={s.path} className="break-all">
                    {s.path} — {t(`projects.skip.${s.reason}`)}
                  </li>
                ))}
              </ul>
            </details>
          )}
          <div className="flex flex-wrap gap-2">
            <button onClick={commitPending} disabled={busy || pending.files.length === 0} className="btn-primary btn-sm">
              {busy ? t("projects.working") : t("projects.saveFiles")}
            </button>
            <button
              onClick={() => {
                setPending(null);
                setPendingBase(null);
                setMessage(null);
              }}
              className="btn-outline btn-sm"
            >
              {t("inject.cancel")}
            </button>
          </div>
        </div>
      )}

      {message && (
        <div
          role={message.kind === "error" ? "alert" : "status"}
          className={`text-sm break-words ${message.kind === "error" ? "text-danger" : message.kind === "ok" ? "text-success" : "text-ink-secondary"}`}
        >
          {message.text}
          {message.links && (
            <span className="ms-2 inline-flex flex-wrap gap-3">
              {message.links.map((l) => (
                <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="underline">
                  {l.label}
                </a>
              ))}
            </span>
          )}
        </div>
      )}

      {/* רשימת הקבצים */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <p className="text-xs font-semibold text-ink-muted">
            {t("projects.fileCount").replace("{n}", String(files.length)).replace("{size}", formatBytes(thisProjectBytes))}
          </p>
          {files.length > 0 && (
            <button onClick={exportZip} disabled={busy} className="btn-outline btn-sm">
              {t("projects.exportZip")}
            </button>
          )}
        </div>
        {files.length === 0 ? (
          <p className="text-sm text-ink-muted">{t("projects.noFiles")}</p>
        ) : (
          <ul dir="ltr" className="max-h-72 overflow-y-auto rounded-xl border border-base-border divide-y divide-base-border">
            {files.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
                <span className="font-mono truncate min-w-0">{f.path}</span>
                <span className="flex items-center gap-3 shrink-0 text-ink-muted">
                  {formatBytes(f.size)}
                  <button onClick={() => remove(f)} className="text-danger hover:underline">
                    {t("common.delete")}
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* דחיפה חזרה לגיטהאב */}
      {githubRepo && githubBranch && files.length > 0 && (
        <div className="rounded-xl border border-base-border bg-base-bg/40 p-4 space-y-3 min-w-0">
          <p className="text-sm font-semibold flex flex-wrap items-center gap-x-2 gap-y-1">
            <AppIcon name="github" />
            {t("projects.pushGithub")}
            <span dir="ltr" className="font-mono text-xs text-ink-muted break-all">
              {githubRepo}@{githubBranch}
            </span>
          </p>

          <div className="flex gap-1 bg-base-panel2 rounded-full p-1 border border-base-border w-fit max-w-full flex-wrap" role="tablist">
            <button role="tab" aria-selected={pushMode === "pr"} onClick={() => { setPushMode("pr"); setPlan(null); }} className={tab(pushMode === "pr")}>
              <AppIcon name="pullRequest" className="!text-current" />
              {t("projects.gh.modePr")}
            </button>
            <button role="tab" aria-selected={pushMode === "direct"} onClick={() => { setPushMode("direct"); setPlan(null); }} className={tab(pushMode === "direct")}>
              {t("projects.gh.modeDirect")}
            </button>
          </div>
          <p className="text-[11px] text-ink-muted leading-relaxed">
            {t(pushMode === "pr" ? "projects.gh.modePrHint" : "projects.gh.modeDirectHint")}
          </p>

          <div className={`grid gap-2 ${pushMode === "pr" ? "sm:grid-cols-2" : ""}`}>
            <div>
              <label htmlFor="gh-msg" className="label">{t("github.commitMessage")}</label>
              <input
                id="gh-msg"
                value={commitMsg}
                onChange={(e) => setCommitMsg(e.target.value)}
                maxLength={200}
                dir="ltr"
                className="field"
              />
            </div>
            {pushMode === "pr" && (
              <div>
                <label htmlFor="gh-new-branch" className="label">{t("gh.newBranch")}</label>
                <input
                  id="gh-new-branch"
                  value={newBranch}
                  onChange={(e) => setNewBranch(e.target.value)}
                  maxLength={200}
                  dir="ltr"
                  className="field font-mono"
                  aria-invalid={!branchOk}
                />
                {!branchOk && <p className="text-xs text-danger mt-1">{t("github.badBranch")}</p>}
              </div>
            )}
          </div>

          {source !== "github" && tokenField("gh-token-push")}

          {plan && (
            <div role="alert" className="rounded-xl border border-danger/40 bg-danger/10 p-3 space-y-2 text-xs text-ink-secondary">
              <p className="flex gap-2 text-sm text-ink-primary">
                <AppIcon name="warning" className="shrink-0 mt-0.5 !text-danger" />
                <span className="min-w-0">
                  {plan.baseUnknown
                    ? t("projects.gh.warnNoBase")
                    : t("projects.gh.warnConflicts").replace("{n}", String(plan.conflicts.length))}
                </span>
              </p>
              {plan.conflicts.length > 0 && (
                <ul dir="ltr" className="max-h-32 overflow-y-auto font-mono text-[11px] text-start space-y-0.5">
                  {plan.conflicts.map((p) => (
                    <li key={p} className="break-all">{p}</li>
                  ))}
                </ul>
              )}
              {plan.compareTruncated && <p>{t("projects.gh.warnTruncated")}</p>}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => {
                    setPushMode("pr");
                    doPush(plan, "pr");
                  }}
                  disabled={busy || !isValidBranch(newBranch.trim())}
                  className="btn-primary btn-sm"
                >
                  {t("projects.gh.switchToPr")}
                </button>
                <button onClick={() => doPush(plan, "direct")} disabled={busy} className="btn-outline btn-sm">
                  {t("projects.gh.commitAnyway")}
                </button>
                <button onClick={() => setPlan(null)} disabled={busy} className="btn-outline btn-sm">
                  {t("inject.cancel")}
                </button>
              </div>
            </div>
          )}

          {!plan && (
            <button onClick={push} disabled={!canPush} className="btn-primary btn-sm">
              {busy ? t("projects.working") : t(pushMode === "pr" ? "projects.gh.pushPr" : "projects.gh.pushDirect")}
            </button>
          )}
          {busy && log.length > 0 && (
            <ul className="text-[11px] text-ink-muted space-y-0.5" aria-live="polite">
              {log.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
          )}
          <p className="text-[11px] text-ink-muted leading-relaxed">{t("projects.gh.pushHint")}</p>
        </div>
      )}
    </fieldset>
  );
}
