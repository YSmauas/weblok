import { notFound } from "next/navigation";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { BlockEditor } from "@/components/blocks/BlockEditor";
import { blocksRegistry } from "@/lib/blocks-registry";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function BlockEditorPage(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ design?: string }>;
}) {
  const { slug } = await props.params;
  const { design } = await props.searchParams;
  if (!blocksRegistry.some((b) => b.slug === slug)) notFound();

  return (
    <SiteChrome>
      <BlockEditor slug={slug} designId={design && UUID.test(design) ? design : null} />
    </SiteChrome>
  );
}
