import type { MetadataRoute } from "next";
import { blocksRegistry } from "@/lib/blocks-registry";
import { structuresRegistry } from "@/lib/structures/catalog";
import { METADATA_BASE } from "@/lib/site";

// תאריך קבוע לדפי המבנים (לא new Date() - שלא "ישתנו" בכל build)
const STRUCTURES_UPDATED = new Date("2026-09-30");

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
    { url: url("/structures"), lastModified: STRUCTURES_UPDATED, changeFrequency: "monthly", priority: 0.9 },
    ...structuresRegistry.map((s) => ({
      url: url(`/structures/${s.slug}`),
      lastModified: STRUCTURES_UPDATED,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { url: url("/tools"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: url("/tools/inject"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: url("/tools/github"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];
}
