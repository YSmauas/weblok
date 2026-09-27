import Link from "next/link";
import { blocksRegistry } from "@/lib/blocks-registry";
import { Card } from "@/components/ui/Card";

export default function BlocksCatalogPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <h1 className="text-2xl font-bold">קטלוג בלוקים</h1>
      <p className="text-ink-secondary mt-1">בוחרים בלוק, מעצבים בעורך חי, ומקבלים קוד עצמאי - בלי שרת שלנו.</p>

      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {blocksRegistry.map((b) => (
          <Link key={b.slug} href={`/blocks/${b.slug}`}>
            <Card className="h-full hover:border-accent/60 transition-colors">
              <div className="text-3xl mb-2">{b.icon}</div>
              <h3 className="font-semibold">{b.name}</h3>
              <p className="text-sm text-ink-secondary mt-1">{b.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
