import { notFound } from "next/navigation";
import { getBlockDefinition } from "@/lib/blocks-registry";
import { BlockEditorClient } from "@/components/blocks/BlockEditorClient";
import { createClient } from "@/lib/supabase/server";

export default async function BlockEditorPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { design?: string };
}) {
  const block = getBlockDefinition(params.slug);
  if (!block) notFound();

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialValues, initialName, savedId;
  if (user && searchParams.design) {
    const { data } = await supabase
      .from("saved_designs")
      .select("id, name, config")
      .eq("id", searchParams.design)
      .eq("user_id", user.id)
      .single();
    if (data) {
      savedId = data.id;
      initialName = data.name;
      initialValues = data.config as Record<string, string>;
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="mb-6">
        <span className="text-3xl">{block.meta.icon}</span>
        <h1 className="text-2xl font-bold mt-2">{block.meta.name}</h1>
        <p className="text-ink-secondary mt-1">{block.meta.description}</p>
      </div>
      <BlockEditorClient
        block={block}
        userId={user?.id ?? null}
        initialValues={initialValues}
        initialName={initialName}
        savedId={savedId}
      />
    </div>
  );
}
