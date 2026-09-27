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
  if (!block) {
    notFound();
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialValues, initialName, savedId, loadError;

  if (user && searchParams.design) {
    try {
      const { data, error } = await supabase
        .from("saved_designs")
        .select("id, name, config")
        .eq("id", searchParams.design)
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Failed to load saved design:", error);
        loadError = error.message;
      } else if (data) {
        // Validate config is a valid object
        if (typeof data.config === "object" && data.config !== null) {
          savedId = data.id;
          initialName = data.name;
          initialValues = data.config as Record<string, string>;
        } else {
          loadError = "Invalid design configuration format";
        }
      }
    } catch (e) {
      console.error("Unexpected error loading design:", e);
      loadError = "Failed to load design";
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="mb-6">
        <span className="text-3xl">{block.meta.icon}</span>
        <h1 className="text-2xl font-bold mt-2">{block.meta.name}</h1>
        <p className="text-ink-secondary mt-1">{block.meta.description}</p>
      </div>

      {loadError && (
        <div
          className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm"
          role="alert"
        >
          ⚠️ לא הצלחנו לטעון את העיצוב השמור: {loadError}
        </div>
      )}

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
