import type { Metadata } from "next";
import { T } from "@/components/ui/T";
import { GithubManager } from "@/components/tools/GithubManager";

export const metadata: Metadata = {
  title: "ניהול מאגר GitHub",
  description:
    "דחיפת קבצים, תיקייה או ZIP לריפו ב-GitHub כקומיט או כ-Pull Request, יצירת ריפו והורדה כ-ZIP - ישירות מהדפדפן, בלי התקנות.",
  alternates: { canonical: "/tools/github" },
  openGraph: { url: "/tools/github" },
};

export default function GithubToolPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <span className="chip">
        <T k="tools.badge" />
      </span>
      <h1 className="text-3xl font-extrabold mt-3">
        <T k="gh.title" />
      </h1>
      <p className="text-ink-secondary mt-2 max-w-2xl leading-relaxed">
        <T k="gh.subtitle" />
      </p>
      <div className="mt-8">
        <GithubManager />
      </div>
    </div>
  );
}
