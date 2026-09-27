"use client";

import { useState } from "react";
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
import { GithubError, importRepoFiles, isValidBranch, parseRepo, pushFiles, defaultBranch } from "@/lib/github/client";

type Source = "upload" | "github";

/** קבצי הפרויקט: העלאה (קבצים/תיקייה/ZIP) או ייבוא מגיטהאב, רשימה, מכסה, ZIP ודחיפה. */
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
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [repoInput, setRepoInput] = useState(githubRepo ?? "");
  const [branchInput, setBranchInput] = useState(githubBranch ?? "");
  const [token, setToken] = useState("");
  const [commitMsg, setCommitMsg] = useState("Add blocks via WEblok");
  const [pushUrl, setPushUrl] = useState<string | null>(null);

  const quotaPct = Math.min(100, (usedBytes / PROJECT_QUOTA_BYTES) * 100);
  const thisProjectBytes = files.reduce((n, f) => n + f.size, 0);

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
      setPending(await importRepoFiles(ref, branch, token || undefined, budget));
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
    setMessage({ kind: "ok", text: t("projects.filesSaved").replace("{n}", String(pending.files.length)) });
    setPending(null);
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
    const safeName = projectName.replace(/[^\p{L}\p{N}_-]+/gu, "-").replace(/^-+|-+$/g, "") || "project";
    await downloadAsZip(Object.fromEntries(all.map((f) => [f.path, f.content])), `${safeName}.zip`);
  }

  async function push() {
    const ref = githubRepo ? parseRepo(githubRepo) : null;
    if (!ref || !githubBranch || !token.trim()) return;
    setMessage(null);
    setPushUrl(null);
    setBusy(true);
    try {
      const all = await fetchAllFiles(projectId);
      if (!all) throw new GithubError("failed");
      const { commitUrl } = await pushFiles(ref, githubBranch, token, all, commitMsg.trim() || "Update via WEblok");
      setPushUrl(commitUrl);
      setMessage({ kind: "ok", text: t("github.pushed") });
    } catch (e) {
      ghError(e);
    } finally {
      setBusy(false);
    }
  }

  const tab = (active: boolean) =>
    `text-xs px-4 py-1.5 rounded-full transition-colors ${
      active ? "bg-accent text-base-bg font-semibold" : "text-ink-secondary hover:text-ink-primary"
    }`;

  return (
    <fieldset disabled={disabled} className="space-y-5 disabled:opacity-60">
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
          ⬆️ {t("projects.srcUpload")}
        </button>
        <button role="tab" aria-selected={source === "github"} onClick={() => setSource("github")} className={tab(source === "github")}>
          🐙 {t("projects.srcGithub")}
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
          <div>
            <label htmlFor="gh-token" className="label">{t("github.token")}</label>
            <input
              id="gh-token"
              type="password"
              autoComplete="off"
              dir="ltr"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="github_pat_..."
              className="field font-mono"
            />
            <p className="text-[11px] text-ink-muted mt-1.5 leading-relaxed">
              {t("github.tokenHint")}{" "}
              <a
                href="https://github.com/settings/personal-access-tokens/new"
                target="_blank"
                rel="noreferrer"
                className="text-accent hover:underline"
              >
                {t("github.tokenCreate")}
              </a>
            </p>
          </div>
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
                  <li key={s.path}>
                    {s.path} — {t(`projects.skip.${s.reason}`)}
                  </li>
                ))}
              </ul>
            </details>
          )}
          <div className="flex gap-2">
            <button onClick={commitPending} disabled={busy || pending.files.length === 0} className="btn-primary btn-sm">
              {busy ? t("projects.working") : t("projects.saveFiles")}
            </button>
            <button onClick={() => setPending(null)} className="btn-outline btn-sm">
              {t("inject.cancel")}
            </button>
          </div>
        </div>
      )}

      {message && (
        <p role={message.kind === "error" ? "alert" : "status"} className={`text-sm ${message.kind === "error" ? "text-danger" : "text-success"}`}>
          {message.text}{" "}
          {pushUrl && (
            <a href={pushUrl} target="_blank" rel="noreferrer" className="underline">
              {t("github.viewCommit")}
            </a>
          )}
        </p>
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
                <span className="font-mono truncate">{f.path}</span>
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

      {/* דחיפה לגיטהאב */}
      {githubRepo && githubBranch && files.length > 0 && (
        <div className="rounded-xl border border-base-border bg-base-bg/40 p-4 space-y-3">
          <p className="text-sm font-semibold">
            {t("projects.pushGithub")}{" "}
            <span dir="ltr" className="font-mono text-xs text-ink-muted">
              {githubRepo}@{githubBranch}
            </span>
          </p>
          <input
            value={commitMsg}
            onChange={(e) => setCommitMsg(e.target.value)}
            maxLength={200}
            aria-label={t("github.commitMessage")}
            placeholder={t("github.commitMessage")}
            dir="ltr"
            className="field"
          />
          {source !== "github" && (
            <input
              type="password"
              autoComplete="off"
              dir="ltr"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder={t("github.token")}
              aria-label={t("github.token")}
              className="field font-mono"
            />
          )}
          <button onClick={push} disabled={busy || !token.trim()} className="btn-primary btn-sm">
            {busy ? t("projects.working") : t("github.push")}
          </button>
          <p className="text-[11px] text-ink-muted">{t("github.pushHint")}</p>
        </div>
      )}
    </fieldset>
  );
}
