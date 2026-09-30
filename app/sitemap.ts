import type { MetadataRoute } from "next";
import { blocksRegistry } from "@/lib/blocks-registry";
import { CONTENT_UPDATED, METADATA_BASE } from "@/lib/site";

/**
 * כל דף ציבורי שנוסף/הוסר (בלוק, כלי, מבנה) חייב להופיע כאן. בלוקים נלקחים
 * אוטומטית מהרישום. lastModified קבוע (CONTENT_UPDATED ב-lib/site.ts) ולא
 * new Date() - אחרת כל build "מעדכן" את כל הדפים ו-Google מפסיק לסמוך עליו.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const url = (path: string) => new URL(path, METADATA_BASE).toString();
  const d = (s: string) => new Date(`${s}T00:00:00Z`);
  return [
    { url: url("/"), lastModified: d(CONTENT_UPDATED.home), changeFrequency: "weekly", priority: 1 },
    { url: url("/blocks"), lastModified: d(CONTENT_UPDATED.blocks), changeFrequency: "weekly", priority: 0.9 },
    ...blocksRegistry.map((b) => ({
      url: url(`/blocks/${b.slug}`),
      lastModified: d(CONTENT_UPDATED.blocks),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { url: url("/tools"), lastModified: d(CONTENT_UPDATED.tools), changeFrequency: "monthly", priority: 0.6 },
    { url: url("/tools/inject"), lastModified: d(CONTENT_UPDATED.tools), changeFrequency: "monthly", priority: 0.8 },
    { url: url("/tools/github"), lastModified: d(CONTENT_UPDATED.tools), changeFrequency: "monthly", priority: 0.7 },
  ];
}
