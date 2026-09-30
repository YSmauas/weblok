import type { Metadata } from "next";
import Link from "next/link";
import { structuresRegistry } from "@/lib/structures/catalog";
import { Card } from "@/components/ui/Card";
import { T } from "@/components/ui/T";
import { AppIcon } from "@/components/ui/AppIcon";

export const metadata: Metadata = {
  title: "מבנים - פרויקטים מלאים מוכנים לפריסה",
  description:
    "מבנים של WEblok: פרויקטים שלמים (Next.js + Supabase) שמעצבים בעורך חי ומייצאים לגיטהאב או כ-ZIP, לפריסה ב-Vercel שלכם. הנתונים נשארים אצלכם.",
  alternates: { canonical: "/structures" },
  openGraph: { url: "/structures" },
};

export default function StructuresCatalogPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-extrabold flex items-center gap-3">
        <AppIcon name="structure" />
        <T k="structures.title" />
      </h1>
      <p className="text-ink-secondary mt-2 max-w-2xl leading-relaxed">
        <T k="structures.subtitle" />
      </p>

      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {structuresRegistry.map((s) => (
          <Link key={s.slug} href={`/structures/${s.slug}`} className="group">
            <Card className="h-full transition-all group-hover:border-accent/60 group-hover:-translate-y-0.5">
              <div className="flex items-start justify-between gap-3">
                <span className="text-3xl" aria-hidden>
                  <AppIcon name={s.icon} />
                </span>
                <span className="chip">
                  <T k="structures.chip" />
                </span>
              </div>
              <h2 className="font-semibold text-lg mt-3">
                <T k={s.name} />
              </h2>
              <p className="text-sm text-ink-secondary mt-1 leading-relaxed">
                <T k={s.description} />
              </p>
              <span className="inline-block mt-4 text-sm text-accent group-hover:underline">
                <T k="structures.open" /> <span aria-hidden className="inline-block ltr:rotate-180">←</span>
              </span>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-10 grid sm:grid-cols-3 gap-4">
        {(["own", "safe", "fast"] as const).map((k) => (
          <div key={k} className="rounded-card border border-base-border bg-base-panel/60 p-4">
            <p className="font-semibold text-sm">
              <T k={`structures.why.${k}.title`} />
            </p>
            <p className="text-xs text-ink-secondary mt-1 leading-relaxed">
              <T k={`structures.why.${k}.text`} />
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
