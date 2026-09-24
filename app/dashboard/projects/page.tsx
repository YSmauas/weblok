import { Card } from "@/components/ui/Card";
import { T } from "@/components/ui/T";
import { DeleteRow, NewProjectButton } from "@/components/dashboard/RowActions";
import { getSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function ProjectsPage() {
  const session = await getSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("id, name, blocks")
    .order("updated_at", { ascending: false });
  const projects = data ?? [];

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold"><T k="projects.title" /></h1>
          <p className="text-ink-secondary mt-1"><T k="projects.subtitle" /></p>
        </div>
        {session && <NewProjectButton userId={session.id} />}
      </div>

      <div className="mt-6 space-y-3">
        {projects.length === 0 && (
          <p className="text-sm text-ink-muted"><T k="projects.empty" /></p>
        )}
        {projects.map((p) => (
          <Card key={p.id}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="font-semibold">{p.name}</h3>
                <p className="text-xs text-ink-muted mt-1">
                  {Array.isArray(p.blocks) ? p.blocks.length : 0} <T k="projects.blocks" />
                </p>
              </div>
              <div className="flex gap-2 items-center">
                {/* ייצוא ZIP ודחיפה ל-GitHub טרם נבנו */}
                <button disabled title="soon" className="text-xs border border-base-border rounded-full px-4 py-1.5 text-ink-muted cursor-not-allowed">
                  <T k="projects.exportZip" />
                </button>
                <button disabled title="soon" className="text-xs border border-base-border rounded-full px-4 py-1.5 text-ink-muted cursor-not-allowed">
                  <T k="projects.pushGithub" />
                </button>
                <DeleteRow table="projects" id={p.id} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
