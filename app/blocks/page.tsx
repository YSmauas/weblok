import type { Metadata } from "next";
import Link from "next/link";
import { blocksRegistry } from "@/lib/blocks-registry";
import { Card } from "@/components/ui/Card";
import { T } from "@/components/ui/T";

export const metadata: Metadata = {
  title: "קטלוג בלוקים",
  description: "בוחרים בלוק, מעצבים בעורך חי, ומקבלים קוד עצמאי להטמעה באתר - בלי שרת שלנו.",
  alternates: { canonical: "/blocks" },
  openGraph: { url: "/blocks" },
};

export default function BlocksCatalogPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-extrabold"><T k="blocks.title" /></h1>
      <p className="text-ink-secondary mt-2"><T k="blocks.subtitle" /></p>

      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {blocksRegistry.map((b) => (
          <Link key={b.slug} href={`/blocks/${b.slug}`} className="group">
            <Card className="h-full transition-all group-hover:border-accent/60 group-hover:-translate-y-0.5">
              <div className="flex items-start justify-between gap-3">
                <span className="text-3xl" aria-hidden>{b.icon}</span>
                <span className="chip"><T k={`blocks.cat.${b.category}`} /></span>
              </div>
              <h2 className="font-semibold text-lg mt-3">{b.name}</h2>
              <p className="text-sm text-ink-secondary mt-1 leading-relaxed">{b.description}</p>
              <span className="inline-block mt-4 text-sm text-accent group-hover:underline">
                <T k="blocks.open" /> <span aria-hidden className="inline-block ltr:rotate-180">←</span>
              </span>
            </Card>
          </Link>
        ))}
      </div>

      <Link
        href="/tools/inject"
        className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-card border border-accent/30 bg-accent-soft px-5 py-4 hover:border-accent transition-colors"
      >
        <span>
          <span className="font-semibold block"><T k="blocks.injectCtaTitle" /></span>
          <span className="text-sm text-ink-secondary"><T k="blocks.injectCtaText" /></span>
        </span>
        <span className="btn-primary btn-sm"><T k="inject.title" /></span>
      </Link>
    </div>
  );
}
