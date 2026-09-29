import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { T } from "@/components/ui/T";
import { AppIcon } from "@/components/ui/AppIcon";

export const metadata: Metadata = {
  title: "כלים מתקדמים",
  description: "כלים מתקדמים של WEblok: הזרקת בלוקים לפרויקט קיים עם AI וניהול מאגר GitHub - ישירות בדפדפן.",
  alternates: { canonical: "/tools" },
};

const TOOLS = [
  { href: "/tools/inject", icon: "inject", k: "inject" },
  { href: "/tools/github", icon: "github", k: "gh" },
];

export default function ToolsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-extrabold">
        <T k="tools.title" />
      </h1>
      <p className="text-ink-secondary mt-2">
        <T k="tools.subtitle" />
      </p>
      <div className="mt-8 grid sm:grid-cols-2 gap-4">
        {TOOLS.map((tool) => (
          <Link key={tool.href} href={tool.href} className="group">
            <Card className="h-full transition-colors group-hover:border-accent/60">
              <div className="text-3xl" aria-hidden>
                <AppIcon name={tool.icon} />
              </div>
              <h2 className="font-semibold text-lg mt-2">
                <T k={`${tool.k}.title`} />
              </h2>
              <p className="text-sm text-ink-secondary mt-1">
                <T k={`${tool.k}.subtitle`} />
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
