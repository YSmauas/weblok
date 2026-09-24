import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { T } from "@/components/ui/T";
import { DeleteRow } from "@/components/dashboard/RowActions";
import { createClient } from "@/lib/supabase/server";

export default async function SavedDesignsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("saved_designs")
    .select("id, block_slug, name, config, updated_at")
    .order("updated_at", { ascending: false });
  const items = data ?? [];
  const usedKb = items.reduce((n, i) => n + JSON.stringify(i.config).length, 0) / 1024;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold"><T k="saved.title" /></h1>
          <p className="text-ink-secondary mt-1"><T k="saved.subtitle" /></p>
        </div>
        <span className="text-xs text-ink-muted">
          {(usedKb / 1024).toFixed(2)}MB <T k="saved.usageSuffix" />
        </span>
      </div>

      <div className="mt-6 grid sm:grid-cols-2 gap-4">
        {items.map((item) => (
          <Card key={item.id}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold truncate">{item.name}</h3>
                <p className="text-xs text-ink-muted mt-1">
                  <T k="saved.updated" /> {new Date(item.updated_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-3 shrink-0">
                <Link href={`/blocks/${encodeURIComponent(item.block_slug)}?design=${item.id}`} className="text-xs text-accent hover:underline">
                  <T k="common.edit" />
                </Link>
                <DeleteRow table="saved_designs" id={item.id} />
              </div>
            </div>
          </Card>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-ink-muted"><T k="saved.empty" /></p>
        )}
      </div>
    </div>
  );
}
