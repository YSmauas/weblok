import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { T } from "@/components/ui/T";
import { DeleteRow, NewProjectButton } from "@/components/dashboard/RowActions";
import { getSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatBytes, PROJECT_QUOTA_BYTES } from "@/lib/projects/files";

export default async function ProjectsPage() {
  const session = await getSession();
  const supabase = await createClient();
  const [{ data }, { data: files }] = await Promise.all([
    supabase.from("projects").select("*").order("updated_at", { ascending: false }),
    supabase.from("project_files").select("project_id, size"),
  ]);
  const projects = data ?? [];
  const stats = new Map<string, { count: number; size: number }>();
  for (const f of files ?? []) {
    const s = stats.get(f.project_id) ?? { count: 0, size: 0 };
    stats.set(f.project_id, { count: s.count + 1, size: s.size + (f.size ?? 0) });
  }
  const usedBytes = (files ?? []).reduce((n, f) => n + (f.size ?? 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold"><T k="projects.title" /></h1>
          <p className="text-ink-secondary mt-1"><T k="projects.subtitle" /></p>
        </div>
        {session && <NewProjectButton userId={session.id} />}
      </div>

      <p className="text-xs text-ink-muted mt-3" dir="ltr">
        {formatBytes(usedBytes)} / {formatBytes(PROJECT_QUOTA_BYTES)} · <T k="projects.quota" />
      </p>

      <div className="mt-6 space-y-3">
        {projects.length === 0 && (
          <Card>
            <p className="text-sm text-ink-secondary"><T k="projects.empty" /></p>
            <ul className="mt-3 text-sm text-ink-secondary space-y-1 list-disc ps-5">
              <li><T k="projects.feature1" /></li>
              <li><T k="projects.feature2" /></li>
              <li><T k="projects.feature3" /></li>
            </ul>
          </Card>
        )}
        {projects.map((p) => {
          const s = stats.get(p.id) ?? { count: 0, size: 0 };
          return (
            <Card key={p.id} className="hover:border-accent/60 transition-colors">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <Link href={`/dashboard/projects/${p.id}`} className="min-w-0 flex-1 group">
                  <h3 className="font-semibold group-hover:text-accent transition-colors truncate">{p.name}</h3>
                  <p className="text-xs text-ink-muted mt-1 flex flex-wrap gap-x-3">
                    <span>{Array.isArray(p.blocks) ? p.blocks.length : 0} <T k="projects.blocks" /></span>
                    <span>{s.count} <T k="projects.files" /> · {formatBytes(s.size)}</span>
                    {p.github_repo && <span dir="ltr">🐙 {p.github_repo}</span>}
                  </p>
                </Link>
                <div className="flex gap-3 items-center">
                  <Link href={`/dashboard/projects/${p.id}`} className="btn-outline btn-sm">
                    <T k="projects.open" />
                  </Link>
                  <DeleteRow table="projects" id={p.id} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
