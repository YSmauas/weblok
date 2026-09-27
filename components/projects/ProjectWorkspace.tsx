"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/i18n/locale-provider";
import { Card } from "@/components/ui/Card";
import { designToInjectBlock, defaultInjectBlocks } from "@/lib/inject/options";
import type { InjectBlock } from "@/lib/inject/core";
import { updateProject, type ProjectBlockRef, type ProjectFileMeta } from "@/lib/projects/db";
import { ProjectBlocks } from "./ProjectBlocks";
import { ProjectFiles } from "./ProjectFiles";
import { ProjectInject } from "./ProjectInject";

export interface SavedDesignRow {
  id: string;
  name: string;
  block_slug: string;
  config: unknown;
}

export interface ProjectInfo {
  id: string;
  name: string;
  blocks: ProjectBlockRef[];
  githubRepo: string | null;
  githubBranch: string | null;
}

/**
 * מסך פרויקט קטן: (1) אילו בלוקים שייכים לפרויקט, (2) קבצי הפרויקט - העלאה או
 * ייבוא מגיטהאב, ייצוא ZIP ודחיפה חזרה, (3) הזרקת הבלוקים לקובץ HTML עם AI.
 */
export function ProjectWorkspace({
  userId,
  project,
  files,
  designs,
  usedBytes,
  filesUnavailable,
}: {
  userId: string;
  project: ProjectInfo;
  files: ProjectFileMeta[];
  designs: SavedDesignRow[];
  usedBytes: number;
  filesUnavailable: boolean;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [name, setName] = useState(project.name);
  const [nameState, setNameState] = useState<"idle" | "saved" | "error">("idle");

  // כל הבלוקים שאפשר לשייך: עיצובים שמורים + בלוקי הקטלוג בברירת מחדל
  const available = useMemo<InjectBlock[]>(
    () => [
      ...designs.map(designToInjectBlock).filter((b): b is InjectBlock => !!b),
      ...defaultInjectBlocks(),
    ],
    [designs]
  );

  // הבלוקים של הפרויקט עם הערכים העדכניים (עיצוב שנערך מאז - נלקח במצבו החדש)
  const projectBlocks = useMemo<InjectBlock[]>(
    () =>
      project.blocks
        .map((ref) => available.find((a) => a.key === ref.key))
        .filter((b): b is InjectBlock => !!b),
    [project.blocks, available]
  );

  async function saveName() {
    const clean = name.trim();
    if (!clean || clean === project.name) return;
    const ok = await updateProject(project.id, { name: clean.slice(0, 120) });
    setNameState(ok ? "saved" : "error");
    if (ok) router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/projects" className="text-sm text-accent hover:underline">
          <span aria-hidden className="inline-block ltr:rotate-180">→</span> {t("projects.back")}
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setNameState("idle");
            }}
            onBlur={saveName}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            maxLength={120}
            aria-label={t("projects.nameLabel")}
            className="text-2xl font-bold bg-transparent border-b border-transparent hover:border-base-border focus:border-accent outline-none min-w-0 flex-1 py-1"
          />
          {nameState === "saved" && <span className="text-xs text-success">{t("common.saved")}</span>}
          {nameState === "error" && <span className="text-xs text-danger">{t("common.error")}</span>}
        </div>
        <p className="text-ink-secondary mt-1 text-sm">{t("projects.workspaceSubtitle")}</p>
      </div>

      {filesUnavailable && (
        <p role="alert" className="rounded-card border border-danger/40 bg-danger/10 px-4 py-3 text-sm">
          {t("projects.migrationNeeded")}
        </p>
      )}

      <Card title={`1. ${t("projects.blocksTitle")}`} description={t("projects.blocksDesc")}>
        <ProjectBlocks projectId={project.id} refs={project.blocks} available={available} />
      </Card>

      <Card title={`2. ${t("projects.filesTitle")}`} description={t("projects.filesDesc")}>
        <ProjectFiles
          userId={userId}
          projectId={project.id}
          projectName={project.name}
          files={files}
          usedBytes={usedBytes}
          githubRepo={project.githubRepo}
          githubBranch={project.githubBranch}
          disabled={filesUnavailable}
        />
      </Card>

      <Card title={`3. ${t("projects.injectTitle")}`} description={t("projects.injectDesc")}>
        <ProjectInject files={files} blocks={projectBlocks} />
      </Card>
    </div>
  );
}
