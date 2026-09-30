import type { MetadataRoute } from "next";
import { blocksRegistry } from "@/lib/blocks-registry";
import { METADATA_BASE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const url = (path: string) => new URL(path, METADATA_BASE).toString();
  const now = new Date();
  return [
    { url: url("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: url("/blocks"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    ...blocksRegistry.map((b) => ({
      url: url(`/blocks/${b.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    // תאריך קבוע: עדכנו ידנית כשהמדריך משתנה (לא new Date() - זה היה מסמן "שונה" בכל בנייה)
    { url: url("/blocks/popup/cookies"), lastModified: new Date("2026-09-30"), changeFrequency: "monthly", priority: 0.7 },
    { url: url("/tools"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: url("/tools/inject"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: url("/tools/github"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];
}
