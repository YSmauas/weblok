import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlockDefinition } from "@/lib/blocks-registry";
import type { BlockValues } from "@/lib/blocks-registry/types";
import { BlockEditorClient } from "@/components/blocks/BlockEditorClient";
import { T } from "@/components/ui/T";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const block = getBlockDefinition(params.slug);
  if (!block) return {};
  return {
    title: block.meta.name,
    description: block.meta.description,
    alternates: { canonical: `/blocks/${block.meta.slug}` },
    openGraph: { url: `/blocks/${block.meta.slug}`, title: block.meta.name, description: block.meta.description },
  };
}

export default async function BlockEditorPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { design?: string };
}) {
  const block = getBlockDefinition(params.slug);
  if (!block) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialValues: BlockValues | undefined;
  let initialName: string | undefined;
  let savedId: string | undefined;
  let designMissing = false;

  if (searchParams.design) {
    const { data } =
      user && UUID.test(searchParams.design)
        ? await supabase
            .from("saved_designs")
            .select("id, name, config")
            .eq("id", searchParams.design)
            .eq("user_id", user.id)
            .eq("block_slug", block.meta.slug)
            .maybeSingle()
        : { data: null };
    if (data) {
      savedId = data.id;
      initialName = data.name;
      // מיזוג עם ברירות המחדל: עיצוב שנשמר לפני שנוסף שדה חדש לבלוק עדיין ייטען תקין
      const config = (data.config ?? {}) as Record<string, unknown>;
      initialValues = block.defaultValues();
      for (const f of block.fields) {
        if (typeof config[f.id] === "string") initialValues[f.id] = config[f.id] as string;
      }
    } else {
      designMissing = true;
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/blocks" className="text-sm text-accent hover:underline">
        <span aria-hidden className="inline-block ltr:rotate-180">→</span> <T k="blocks.all" />
      </Link>
      <div className="flex items-center gap-4 mt-4 mb-8">
        <span className="text-4xl" aria-hidden>{block.meta.icon}</span>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">{block.meta.name}</h1>
          <p className="text-ink-secondary mt-1">{block.meta.description}</p>
        </div>
      </div>
      {designMissing && (
        <p role="status" className="mb-6 rounded-card border border-danger/40 bg-danger/10 px-4 py-3 text-sm">
          <T k="blocks.designNotFound" />
        </p>
      )}
      <BlockEditorClient
        slug={block.meta.slug}
        userId={user?.id ?? null}
        initialValues={initialValues}
        initialName={initialName}
        savedId={savedId}
      />
    </div>
  );
}
