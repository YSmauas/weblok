import Link from "next/link";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { Card } from "@/components/ui/Card";
import { T } from "@/components/ui/T";
import { blocksRegistry } from "@/lib/blocks-registry";

export default function BlocksCatalogPage() {
  return (
    <SiteChrome>
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-extrabold"><T k="blocks.title" /></h1>
        <p className="text-ink-secondary mt-2"><T k="blocks.subtitle" /></p>

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {blocksRegistry.map((b) => (
            <Link key={b.slug} href={`/blocks/${b.slug}`} className="group">
              <Card className="h-full transition-transform group-hover:-translate-y-0.5">
                <div className="text-3xl" aria-hidden>{b.icon}</div>
                <h2 className="font-semibold text-lg mt-3">{b.name}</h2>
                <p className="text-sm text-ink-secondary mt-1">{b.description}</p>
                <span className="inline-block mt-4 text-sm text-accent group-hover:underline">
                  <T k="blocks.open" />
                </span>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </SiteChrome>
  );
}
