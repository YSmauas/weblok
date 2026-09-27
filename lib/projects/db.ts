"use client";

import { createClient } from "@/lib/supabase/client";
import type { LoadedFile } from "./files";

/**
 * פעולות ה-DB של פרויקטים מהדפדפן. כולן עוברות RLS (משתמש רואה/כותב רק את
 * שלו), והמכסה נאכפת בטריגר ב-DB - כאן רק מתרגמים שגיאות להודעה ברורה.
 */

/** בלוק ששויך לפרויקט (נשמר ב-projects.blocks כ-jsonb) */
export interface ProjectBlockRef {
  key: string;
  slug: string;
  name: string;
  designId?: string;
}

export interface ProjectFileMeta {
  id: string;
  path: string;
  size: number;
  updated_at: string;
}

export type SaveError = "quota_exceeded" | "failed";

const BATCH_BYTES = 900 * 1024;

export function parseBlockRefs(raw: unknown): ProjectBlockRef[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (b): b is ProjectBlockRef =>
      !!b && typeof b === "object" && typeof b.key === "string" && typeof b.slug === "string" && typeof b.name === "string"
  );
}

export async function updateProject(
  id: string,
  patch: Partial<{ name: string; blocks: ProjectBlockRef[]; github_repo: string | null; github_branch: string | null }>
): Promise<boolean> {
  const { error } = await createClient()
    .from("projects")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  return !error;
}

/** שומר (מוסיף או מחליף לפי נתיב) קבצים בפרויקט, במנות כדי לא לחרוג מגודל בקשה. */
export async function upsertFiles(
  projectId: string,
  userId: string,
  files: Pick<LoadedFile, "path" | "content" | "size">[]
): Promise<SaveError | null> {
  const supabase = createClient();
  let batch: typeof files = [];
  let batchBytes = 0;

  const flush = async () => {
    if (batch.length === 0) return null;
    const { error } = await supabase.from("project_files").upsert(
      batch.map((f) => ({ project_id: projectId, user_id: userId, path: f.path, content: f.content })),
      { onConflict: "project_id,path" }
    );
    batch = [];
    batchBytes = 0;
    if (error) return /quota_exceeded/.test(error.message) ? "quota_exceeded" : "failed";
    return null;
  };

  for (const f of files) {
    if (batchBytes + f.size > BATCH_BYTES) {
      const err = await flush();
      if (err) return err;
    }
    batch.push(f);
    batchBytes += f.size;
  }
  return flush();
}

export async function fetchFileContent(fileId: string): Promise<string | null> {
  const { data } = await createClient().from("project_files").select("content").eq("id", fileId).maybeSingle();
  return data?.content ?? null;
}

export async function fetchAllFiles(projectId: string): Promise<LoadedFile[] | null> {
  const { data, error } = await createClient()
    .from("project_files")
    .select("path, content, size")
    .eq("project_id", projectId)
    .order("path");
  if (error) return null;
  return data ?? [];
}

export async function saveFileContent(fileId: string, content: string): Promise<SaveError | null> {
  const { error } = await createClient().from("project_files").update({ content }).eq("id", fileId);
  if (!error) return null;
  return /quota_exceeded/.test(error.message) ? "quota_exceeded" : "failed";
}

export async function deleteFile(fileId: string): Promise<boolean> {
  const { error } = await createClient().from("project_files").delete().eq("id", fileId);
  return !error;
}
