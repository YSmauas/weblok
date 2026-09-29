"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/i18n/locale-provider";
import { getBlockDefinition } from "@/lib/blocks-registry";
import type { InjectBlock } from "@/lib/inject/core";
import { updateProject, type ProjectBlockRef } from "@/lib/projects/db";
import { AppIcon } from "@/components/ui/AppIcon";

/** שיוך בלוקים לפרויקט: עיצובים שמורים או בלוקי קטלוג בברירת מחדל. */
export function ProjectBlocks({
  projectId,
  refs,
  available,
}: {
  projectId: string;
  refs: ProjectBlockRef[];
  available: InjectBlock[];
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [choice, setChoice] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const addable = available.filter((a) => !refs.some((r) => r.key === a.key));
  const saved = addable.filter((a) => a.key.startsWith("design:"));
  const defaults = addable.filter((a) => a.key.startsWith("default:"));

  async function save(next: ProjectBlockRef[]) {
    setBusy(true);
    setError(false);
    const ok = await updateProject(projectId, { blocks: next });
    setBusy(false);
    if (!ok) return setError(true);
    setChoice("");
    router.refresh();
  }

  function add() {
    const block = available.find((a) => a.key === choice);
    if (!block) return;
    const ref: ProjectBlockRef = { key: block.key, slug: block.slug, name: block.name };
    if (block.key.startsWith("design:")) ref.designId = block.key.slice("design:".length);
    save([...refs, ref]);
  }

  return (
    <div className="space-y-4">
      {refs.length === 0 ? (
        <p className="text-sm text-ink-muted">{t("projects.noBlocks")}</p>
      ) : (
        <ul className="space-y-2">
          {refs.map((ref) => {
            const def = getBlockDefinition(ref.slug);
            const missing = !available.some((a) => a.key === ref.key);
            return (
              <li
                key={ref.key}
                className="flex items-center justify-between gap-3 rounded-xl border border-base-border bg-base-bg/40 px-3 py-2.5"
              >
                <span className="flex items-center gap-3 min-w-0">
                  <span className="text-xl" aria-hidden>
                    <AppIcon name={def?.meta.icon ?? "puzzle"} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium truncate">{ref.name}</span>
                    <span className="text-[11px] text-ink-muted">
                      {missing ? t("projects.blockMissing") : def?.meta.name}
                    </span>
                  </span>
                </span>
                <span className="flex items-center gap-3 shrink-0">
                  {ref.designId && !missing && (
                    <Link
                      href={`/blocks/${encodeURIComponent(ref.slug)}?design=${ref.designId}`}
                      className="text-xs text-accent hover:underline"
                    >
                      {t("common.edit")}
                    </Link>
                  )}
                  <button
                    onClick={() => save(refs.filter((r) => r.key !== ref.key))}
                    disabled={busy}
                    className="text-xs text-danger hover:underline disabled:opacity-60"
                  >
                    {t("projects.removeBlock")}
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {addable.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <select
            value={choice}
            onChange={(e) => setChoice(e.target.value)}
            aria-label={t("projects.addBlock")}
            className="field sm:w-auto flex-1 min-w-[200px]"
          >
            <option value="">{t("projects.chooseBlock")}</option>
            {saved.length > 0 && (
              <optgroup label={t("inject.fromSaved")}>
                {saved.map((b) => (
                  <option key={b.key} value={b.key}>
                    {b.name}
                  </option>
                ))}
              </optgroup>
            )}
            {defaults.length > 0 && (
              <optgroup label={t("inject.fromDefault")}>
                {defaults.map((b) => (
                  <option key={b.key} value={b.key}>
                    {b.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          <button onClick={add} disabled={!choice || busy} className="btn-primary">
            {t("projects.addBlock")}
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="text-xs text-danger">
          {t("common.error")}
        </p>
      )}
      <p className="text-[11px] text-ink-muted">
        {t("projects.blocksTip")}{" "}
        <Link href="/blocks" className="text-accent hover:underline">
          {t("sidebar.allBlocks")}
        </Link>
      </p>
    </div>
  );
}
