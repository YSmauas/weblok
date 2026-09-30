import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStructureMeta, structuresRegistry } from "@/lib/structures/catalog";
import { StructureEditorClient } from "@/components/structures/StructureEditorClient";
import { StructureGuide } from "@/components/structures/StructureGuide";
import { T } from "@/components/ui/T";
import { AppIcon } from "@/components/ui/AppIcon";

// רק המבנים הרשומים - כל slug אחר הוא 404
export const dynamicParams = false;

export function generateStaticParams() {
  return structuresRegistry.map((s) => ({ slug: s.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const meta = getStructureMeta(params.slug);
  if (!meta) return {};
  return {
    title: meta.seoTitle,
    description: meta.seoDescription,
    alternates: { canonical: `/structures/${meta.slug}` },
    openGraph: { url: `/structures/${meta.slug}`, title: meta.seoTitle, description: meta.seoDescription },
  };
}

export default function StructureEditorPage({ params }: { params: { slug: string } }) {
  const meta = getStructureMeta(params.slug);
  if (!meta) notFound();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/structures" className="text-sm text-accent hover:underline">
        <span aria-hidden className="inline-block ltr:rotate-180">→</span> <T k="structures.all" />
      </Link>
      <div className="flex items-center gap-4 mt-4 mb-4">
        <span className="text-4xl" aria-hidden>
          <AppIcon name={meta.icon} />
        </span>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">
            <T k={meta.name} />
          </h1>
          <p className="text-ink-secondary mt-1">
            <T k={meta.description} />
          </p>
        </div>
      </div>
      <p className="mb-8 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-xs text-ink-secondary leading-relaxed">
        <strong className="text-ink-primary">🔒 <T k="structures.privacyTitle" /></strong> <T k="structures.privacy" />{" "}
        <a href="#guide" className="text-accent hover:underline">
          <T k="structures.toGuide" />
        </a>
      </p>
      {/* רק slug עובר ללקוח - לעולם לא אובייקט עם פונקציות */}
      <StructureEditorClient slug={meta.slug} />
      <StructureGuide />
    </div>
  );
}
