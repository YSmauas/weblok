"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { Card } from "@/components/ui/Card";
import { GithubError, isValidBranch } from "@/lib/github/client";
import {
  createRepo,
  downloadZipball,
  fetchGitignore,
  isValidRepoName,
  listUserRepos,
  pushEntries,
  rateLimit,
  splitFullName,
  type RepoSummary,
} from "@/lib/github/manager";
import {
  commonRoot,
  isIgnored,
  loadRepoEntries,
  MAX_PUSH_BYTES,
  parseGitignore,
  type RepoEntry,
} from "@/lib/github/files";
import { formatBytes } from "@/lib/projects/files";
import { AppIcon } from "@/components/ui/AppIcon";
import { loadSecret, removeSecret, saveSecret } from "@/lib/ai/key-vault";

type Mode = "commit" | "pr";
type Msg = { kind: "ok" | "error" | "info"; text: string; links?: { href: string; label: string }[] };

const TOKEN_SECRET = "github-token";

interface TreeNode {
  files: { entry: RepoEntry; name: string }[];
  dirs: Map<string, TreeNode>;
}

function buildTree(entries: { entry: RepoEntry; display: string }[]): TreeNode {
  const root: TreeNode = { files: [], dirs: new Map() };
  for (const { entry, display } of entries) {
    const parts = display.split("/");
    let node = root;
    for (const dir of parts.slice(0, -1)) {
      if (!node.dirs.has(dir)) node.dirs.set(dir, { files: [], dirs: new Map() });
      node = node.dirs.get(dir)!;
    }
    node.files.push({ entry, name: parts[parts.length - 1] });
  }
  return root;
}

function collectPaths(node: TreeNode): string[] {
  return [...node.files.map((f) => f.entry.path), ...Array.from(node.dirs.values()).flatMap(collectPaths)];
}

/**
 * כלי "ניהול מאגר GitHub": טעינת הריפוים של המשתמש, יצירת ריפו, הורדה כ-ZIP,
 * ודחיפת קבצים/תיקייה/ZIP כקומיט ישיר או כענף חדש + Pull Request. הכל בדפדפן,
 * עם טוקן אישי שלא נשלח לשרת שלנו (ונשמר - מוצפן - רק אם המשתמש ביקש).
 */
export function GithubManager() {
  const { t } = useLocale();
  const [token, setToken] = useState("");
  const [remember, setRemember] = useState(false);
  const [limit, setLimit] = useState<{ remaining: number; limit: number } | null>(null);
  const [repos, setRepos] = useState<RepoSummary[]>([]);
  const [repo, setRepo] = useState("");
  const [baseBranch, setBaseBranch] = useState("main");
  const [creating, setCreating] = useState(false);
  const [newRepo, setNewRepo] = useState({ name: "", description: "", private: true });
  const [mode, setMode] = useState<Mode>("commit");
  const [newBranch, setNewBranch] = useState("");
  const [message, setMessage] = useState("");
  const [prTitle, setPrTitle] = useState("");
  const [prefix, setPrefix] = useState("");
  const [ignoreText, setIgnoreText] = useState("");
  const [entries, setEntries] = useState<RepoEntry[]>([]);
  const [unchecked, setUnchecked] = useState<Set<string>>(new Set());
  const [stripRoot, setStripRoot] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState<null | "repos" | "create" | "zip" | "read" | "push">(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [msg, setMsg] = useState<Msg | null>(null);

  // טוקן ששמרתם (מוצפן) בביקור קודם
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

  const fail = (e: unknown) =>
    setMsg({ kind: "error", text: t(`github.err.${e instanceof GithubError ? e.code : "failed"}`) });

  const patterns = useMemo(() => parseGitignore(ignoreText.replace(/,/g, "\n")), [ignoreText]);
  const root = useMemo(() => (stripRoot ? commonRoot(entries.map((e) => e.path)) : ""), [entries, stripRoot]);
  const cleanPrefix = prefix.trim().replace(/^\/+|\/+$/g, "");

  const visible = useMemo(
    () =>
      entries
        .map((entry) => ({ entry, display: root && entry.path.startsWith(root) ? entry.path.slice(root.length) : entry.path }))
        .filter(({ display }) => !isIgnored(display, patterns)),
    [entries, root, patterns]
  );
  const chosen = visible.filter(({ entry }) => !unchecked.has(entry.path));
  const chosenBytes = chosen.reduce((n, c) => n + c.entry.size, 0);
  const tree = useMemo(() => buildTree(visible), [visible]);

  async function refreshLimit(tok = token) {
    try {
      const r = await rateLimit(tok.trim() || undefined);
      setLimit({ remaining: r.remaining, limit: r.limit });
    } catch {
      /* לא קריטי */
    }
  }

  async function loadRepos(select?: string) {
    if (!token.trim()) return setMsg({ kind: "error", text: t("gh.needToken") });
    setBusy("repos");
    setMsg(null);
    try {
      const list = await listUserRepos(token);
      setRepos(list);
      const pick = select ?? (list.some((r) => r.fullName === repo) ? repo : list[0]?.fullName ?? "");
      await chooseRepo(pick, list);
      setMsg({ kind: "info", text: t("gh.reposLoaded").replace("{n}", String(list.length)) });
    } catch (e) {
      fail(e);
    } finally {
      setBusy(null);
      refreshLimit();
    }
  }

  async function chooseRepo(fullName: string, list = repos) {
    setRepo(fullName);
    const info = list.find((r) => r.fullName === fullName);
    if (!info) return;
    setBaseBranch(info.defaultBranch);
    const gi = await fetchGitignore(splitFullName(fullName), info.defaultBranch, token);
    if (gi) {
      setIgnoreText(parseGitignore(gi).join(", "));
      setMsg({ kind: "info", text: t("gh.gitignoreFromRepo") });
    }
  }

  async function submitNewRepo() {
    if (!isValidRepoName(newRepo.name)) return setMsg({ kind: "error", text: t("gh.badRepoName") });
    setBusy("create");
    setMsg(null);
    try {
      const created = await createRepo(token, newRepo);
      setCreating(false);
      setNewRepo({ name: "", description: "", private: true });
      setMsg({ kind: "ok", text: t("gh.repoCreated").replace("{name}", created.fullName) });
      setBusy(null);
      await loadRepos(created.fullName);
    } catch (e) {
      fail(e);
    } finally {
      setBusy(null);
    }
  }

  async function downloadZip() {
    if (!repo) return;
    setBusy("zip");
    setMsg(null);
    try {
      const blob = await downloadZipball(splitFullName(repo), baseBranch, token);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${repo.replace("/", "-")}-${baseBranch.replace(/\//g, "-")}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      fail(e);
    } finally {
      setBusy(null);
      refreshLimit();
    }
  }

  async function pick(list: FileList | null) {
    if (!list?.length) return;
    setBusy("read");
    setMsg(null);
    try {
      const { entries: loaded, gitignore } = await loadRepoEntries(list);
      setEntries((prev) => {
        const map = new Map(prev.map((e) => [e.path, e]));
        loaded.forEach((e) => map.set(e.path, e));
        return Array.from(map.values()).sort((a, b) => a.path.localeCompare(b.path));
      });
      if (gitignore) {
        setIgnoreText(parseGitignore(gitignore).join(", "));
        setMsg({ kind: "info", text: t("gh.gitignoreFromFiles") });
      }
    } catch {
      setMsg({ kind: "error", text: t("projects.readFailed") });
    } finally {
      setBusy(null);
    }
  }

  const toggle = (paths: string[], on: boolean) =>
    setUnchecked((prev) => {
      const next = new Set(prev);
      paths.forEach((p) => (on ? next.delete(p) : next.add(p)));
      return next;
    });

  const branchOk = mode === "commit" || (newBranch.trim() && isValidBranch(newBranch.trim()));
  const canPush =
    !busy && !!token.trim() && !!repo && chosen.length > 0 && chosenBytes <= MAX_PUSH_BYTES && !!branchOk && isValidBranch(baseBranch);

  async function push() {
    if (!canPush) return;
    setBusy("push");
    setMsg(null);
    setLog([]);
    try {
      const result = await pushEntries({
        token,
        ref: splitFullName(repo),
        baseBranch,
        newBranch: mode === "pr" ? newBranch.trim() : null,
        message: message.trim() || t("gh.defaultMessage"),
        prTitle: prTitle.trim() || undefined,
        files: chosen.map(({ entry, display }) => ({
          path: cleanPrefix ? `${cleanPrefix}/${display}` : display,
          base64: entry.base64,
        })),
        onProgress: (done, total) => setProgress({ done, total }),
        onLog: (step) => setLog((prev) => [...prev, t(`gh.step.${step}`)]),
      });
      const links = [{ href: result.commitUrl, label: t("github.viewCommit") }];
      if (result.prUrl) links.push({ href: result.prUrl, label: `Pull Request #${result.prNumber}` });
      setMsg({ kind: "ok", text: t("gh.pushed").replace("{n}", String(chosen.length)), links });
    } catch (e) {
      fail(e);
    } finally {
      setBusy(null);
      setProgress(null);
      refreshLimit();
    }
  }

  const tabClass = (active: boolean) =>
    `text-xs px-4 py-1.5 rounded-full transition-colors ${
      active ? "bg-accent text-base-bg font-semibold" : "text-ink-secondary hover:text-ink-primary"
    }`;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-xs text-ink-secondary leading-relaxed">
        <strong className="text-ink-primary inline-flex items-center gap-1">
          <AppIcon name="lock" />
          {t("inject.privacyTitle")}
        </strong>{" "}
        {t("gh.privacy")}
      </div>

      {/* 1. חיבור וריפו */}
      <Card title={`1. ${t("gh.connectTitle")}`}>
        <div className="space-y-4">
          <div className="grid sm:grid-cols-[1fr_auto] gap-2 items-end">
            <div>
              <label htmlFor="gh-pat" className="label">{t("gh.token")}</label>
              <input
                id="gh-pat"
                type="password"
                autoComplete="off"
                spellCheck={false}
                dir="ltr"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadRepos()}
                placeholder="github_pat_... / ghp_..."
                className="field font-mono"
              />
            </div>
            <button onClick={() => loadRepos()} disabled={!!busy || !token.trim()} className="btn-primary">
              {busy === "repos" ? t("projects.working") : t("gh.loadRepos")}
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink-muted">
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
            <span dir="ltr">
              API: {limit ? `${limit.remaining}/${limit.limit}` : "—"}
            </span>
          </div>
          <p className="text-[11px] text-ink-muted leading-relaxed">
            {t("github.tokenPerms")} {t("gh.tokenHintExtra")}{" "}
            <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer" className="text-accent hover:underline">
              {t("github.tokenCreate")}
            </a>
          </p>

          {repos.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-base-border">
              <div className="grid sm:grid-cols-[1fr_180px] gap-2">
                <div>
                  <label htmlFor="gh-repo-select" className="label">{t("gh.repo")}</label>
                  <select
                    id="gh-repo-select"
                    dir="ltr"
                    value={repo}
                    onChange={(e) => chooseRepo(e.target.value)}
                    className="field font-mono"
                  >
                    {repos.map((r) => (
                      <option key={r.fullName} value={r.fullName}>
                        {r.fullName}{r.private ? ` · ${t("gh.private")}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="gh-base" className="label">{t("gh.baseBranch")}</label>
                  <input id="gh-base" dir="ltr" value={baseBranch} onChange={(e) => setBaseBranch(e.target.value)} className="field font-mono" />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setCreating((v) => !v)} className="btn-outline btn-sm" aria-expanded={creating}>
                  ＋ {t("gh.newRepo")}
                </button>
                <button onClick={downloadZip} disabled={!!busy || !repo} className="btn-outline btn-sm">
                  ⬇️ {busy === "zip" ? t("projects.working") : t("gh.downloadZip")}
                </button>
              </div>
            </div>
          )}

          {repos.length === 0 && token.trim() && (
            <button onClick={() => setCreating((v) => !v)} className="text-xs text-accent hover:underline" aria-expanded={creating}>
              ＋ {t("gh.newRepo")}
            </button>
          )}

          {creating && (
            <div className="rounded-xl border border-accent/40 bg-accent-soft p-4 space-y-3 animate-fadeInUp">
              <div className="grid sm:grid-cols-2 gap-2">
                <div>
                  <label htmlFor="gh-new-name" className="label">{t("gh.newRepoName")}</label>
                  <input
                    id="gh-new-name"
                    dir="ltr"
                    value={newRepo.name}
                    onChange={(e) => setNewRepo((r) => ({ ...r, name: e.target.value }))}
                    placeholder="my-site"
                    className="field font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="gh-new-desc" className="label">{t("gh.newRepoDesc")}</label>
                  <input
                    id="gh-new-desc"
                    value={newRepo.description}
                    maxLength={300}
                    onChange={(e) => setNewRepo((r) => ({ ...r, description: e.target.value }))}
                    className="field"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-ink-secondary cursor-pointer w-fit">
                <input
                  type="checkbox"
                  checked={newRepo.private}
                  onChange={(e) => setNewRepo((r) => ({ ...r, private: e.target.checked }))}
                  className="accent-[var(--accent)]"
                />
                {t("gh.private")}
              </label>
              <div className="flex gap-2">
                <button onClick={submitNewRepo} disabled={!!busy || !newRepo.name.trim()} className="btn-primary btn-sm">
                  {busy === "create" ? t("projects.working") : t("gh.createRepo")}
                </button>
                <button onClick={() => setCreating(false)} className="btn-outline btn-sm">
                  {t("inject.cancel")}
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* 2. קבצים */}
      <Card title={`2. ${t("gh.filesTitle")}`}>
        <div className="space-y-4">
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              pick(e.dataTransfer.files);
            }}
            className={`flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-7 text-center cursor-pointer transition-colors ${
              dragging ? "border-accent bg-accent-soft" : "border-base-border hover:border-accent/60"
            }`}
          >
            <AppIcon name="archive" className="text-3xl" />
            <span className="text-sm font-medium">
              {busy === "read"
                ? t("projects.working")
                : entries.length
                  ? t("gh.filesCount").replace("{n}", String(entries.length))
                  : t("gh.dropHere")}
            </span>
            <span className="text-xs text-ink-muted">{t("gh.dropHint")}</span>
            <input
              type="file"
              multiple
              className="sr-only"
              onChange={(e) => {
                pick(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
          <label className="btn-outline btn-sm cursor-pointer w-fit">
            <AppIcon name="folder" className="me-1" />
            {t("projects.pickFolder")}
            <input
              type="file"
              multiple
              className="sr-only"
              {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
              onChange={(e) => {
                pick(e.target.files);
                e.target.value = "";
              }}
            />
          </label>

          <div>
            <label htmlFor="gh-ignore" className="label">{t("gh.ignore")}</label>
            <input
              id="gh-ignore"
              dir="ltr"
              value={ignoreText}
              onChange={(e) => setIgnoreText(e.target.value)}
              placeholder="dist/, *.log, .env"
              className="field font-mono"
            />
            <p className="text-[11px] text-ink-muted mt-1">{t("gh.ignoreHint")}</p>
          </div>

          {entries.length > 0 && (
            <>
              {commonRoot(entries.map((e) => e.path)) && (
                <label className="flex items-center gap-2 text-xs text-ink-secondary cursor-pointer w-fit">
                  <input type="checkbox" checked={stripRoot} onChange={(e) => setStripRoot(e.target.checked)} className="accent-[var(--accent)]" />
                  {t("gh.stripRoot").replace("{root}", commonRoot(entries.map((e) => e.path)))}
                </label>
              )}
              <div dir="ltr" className="max-h-80 overflow-auto rounded-xl border border-base-border bg-base-bg/40 p-3 text-xs font-mono text-start">
                {visible.length === 0 ? (
                  <p className="text-ink-muted">{t("gh.allFiltered")}</p>
                ) : (
                  <TreeView node={tree} unchecked={unchecked} onToggle={toggle} />
                )}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className={chosenBytes > MAX_PUSH_BYTES ? "text-danger" : "text-ink-muted"}>
                  {t("gh.selected")
                    .replace("{n}", String(chosen.length))
                    .replace("{size}", formatBytes(chosenBytes))}
                  {chosenBytes > MAX_PUSH_BYTES && ` · ${t("gh.tooBig").replace("{max}", formatBytes(MAX_PUSH_BYTES))}`}
                </span>
                <button
                  onClick={() => {
                    setEntries([]);
                    setUnchecked(new Set());
                  }}
                  className="text-danger hover:underline"
                >
                  {t("gh.clear")}
                </button>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* 3. קומיט */}
      <Card title={`3. ${t("gh.commitTitle")}`}>
        <div className="space-y-4">
          <div className="flex gap-1 bg-base-panel2 rounded-full p-1 border border-base-border w-fit" role="tablist">
            <button role="tab" aria-selected={mode === "commit"} onClick={() => setMode("commit")} className={tabClass(mode === "commit")}>
              {t("gh.modeCommit")}
            </button>
            <button role="tab" aria-selected={mode === "pr"} onClick={() => setMode("pr")} className={tabClass(mode === "pr")}>
              {t("gh.modePr")}
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {mode === "pr" && (
              <div>
                <label htmlFor="gh-new-branch" className="label">{t("gh.newBranch")}</label>
                <input id="gh-new-branch" dir="ltr" value={newBranch} onChange={(e) => setNewBranch(e.target.value)} placeholder="update-from-weblok" className="field font-mono" />
              </div>
            )}
            {mode === "pr" && (
              <div>
                <label htmlFor="gh-pr-title" className="label">{t("gh.prTitle")}</label>
                <input id="gh-pr-title" value={prTitle} maxLength={200} onChange={(e) => setPrTitle(e.target.value)} className="field" />
              </div>
            )}
            <div>
              <label htmlFor="gh-msg" className="label">{t("github.commitMessage")}</label>
              <input id="gh-msg" value={message} maxLength={500} onChange={(e) => setMessage(e.target.value)} placeholder={t("gh.defaultMessage")} className="field" />
            </div>
            <div>
              <label htmlFor="gh-prefix" className="label">{t("gh.prefix")}</label>
              <input id="gh-prefix" dir="ltr" value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="src/" className="field font-mono" />
            </div>
          </div>

          <button onClick={push} disabled={!canPush} className="btn-primary w-full sm:w-auto">
            {busy === "push" ? t("projects.working") : mode === "pr" ? t("gh.pushPr") : t("gh.push")}
          </button>
          {!repo && <p className="text-xs text-ink-muted">{t("gh.needRepo")}</p>}

          {progress && (
            <div>
              <div className="flex justify-between text-xs text-ink-muted mb-1">
                <span>{t("gh.step.upload")}</span>
                <span dir="ltr">
                  {progress.done}/{progress.total}
                </span>
              </div>
              <div className="h-2 rounded-full bg-base-bg overflow-hidden border border-base-border">
                <div
                  className="h-full bg-accent transition-all"
                  style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}
          {log.length > 0 && (
            <ol className="text-xs text-ink-secondary space-y-0.5 list-decimal ps-5">
              {log.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ol>
          )}
        </div>
      </Card>

      {msg && (
        <p
          role={msg.kind === "error" ? "alert" : "status"}
          className={`text-sm ${msg.kind === "error" ? "text-danger" : msg.kind === "ok" ? "text-success" : "text-ink-secondary"}`}
        >
          {msg.text}{" "}
          {msg.links?.map((l) => (
            <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="underline me-3">
              {l.label}
            </a>
          ))}
        </p>
      )}
    </div>
  );
}

function TreeView({
  node,
  unchecked,
  onToggle,
}: {
  node: TreeNode;
  unchecked: Set<string>;
  onToggle: (paths: string[], on: boolean) => void;
}) {
  return (
    <ul className="space-y-0.5">
      {Array.from(node.dirs.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, child]) => {
          const paths = collectPaths(child);
          const allOn = paths.every((p) => !unchecked.has(p));
          return (
            <li key={name}>
              <label className="flex items-center gap-2 cursor-pointer text-ink-primary">
                <input type="checkbox" checked={allOn} onChange={(e) => onToggle(paths, e.target.checked)} className="accent-[var(--accent)]" />
                <AppIcon name="folder" className="shrink-0" />
                <span className="truncate">{name}/</span>
              </label>
              <div className="ps-5 border-s border-base-border ms-1.5">
                <TreeView node={child} unchecked={unchecked} onToggle={onToggle} />
              </div>
            </li>
          );
        })}
      {node.files.map(({ entry, name }) => (
        <li key={entry.path}>
          <label className="flex items-center gap-2 cursor-pointer text-ink-secondary">
            <input
              type="checkbox"
              checked={!unchecked.has(entry.path)}
              onChange={(e) => onToggle([entry.path], e.target.checked)}
              className="accent-[var(--accent)]"
            />
            <AppIcon name="file" className="shrink-0 !text-ink-muted" />
            <span className="truncate">{name}</span>
            <span className="ms-auto text-ink-muted shrink-0">{formatBytes(entry.size)}</span>
          </label>
        </li>
      ))}
    </ul>
  );
}
