import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProjectWorkspace } from "@/components/projects/ProjectWorkspace";
import { parseBlockRefs } from "@/lib/projects/types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ProjectPage({ params }: { params: { id: string } }) {
  if (!UUID.test(params.id)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?redirectedFrom=/dashboard/projects/${params.id}`);

  // RLS מחזיר רק שורות של המשתמש עצמו - פרויקט של מישהו אחר פשוט "לא נמצא"
  // select("*") ולא רשימת עמודות: כך הדף עובד גם לפני שהורץ migration 0004 (github_branch)
  const [{ data: project }, { data: files, error: filesError }, { data: allSizes }, { data: designs }] = await Promise.all([
    supabase.from("projects").select("*").eq("id", params.id).maybeSingle(),
    supabase.from("project_files").select("id, path, size, updated_at").eq("project_id", params.id).order("path"),
    supabase.from("project_files").select("size").eq("user_id", user.id),
    supabase.from("saved_designs").select("id, name, block_slug, config").order("updated_at", { ascending: false }),
  ]);
  if (!project) notFound();

  const usedBytes = (allSizes ?? []).reduce((n, f) => n + (f.size ?? 0), 0);

  return (
    <ProjectWorkspace
      userId={user.id}
      project={{
        id: project.id,
        name: project.name,
        blocks: parseBlockRefs(project.blocks),
        githubRepo: project.github_repo,
        githubBranch: project.github_branch ?? null,
      }}
      filesUnavailable={!!filesError}
      files={files ?? []}
      designs={designs ?? []}
      usedBytes={usedBytes}
    />
  );
}
