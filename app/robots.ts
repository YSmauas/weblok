import type { MetadataRoute } from "next";
import { IS_PRODUCTION_DEPLOY, SITE_URL } from "@/lib/site";

/**
 * robots.txt. שימו לב: קובץ האימות של Search Console (public/google*.html)
 * חייב להישאר נגיש - לכן אין כאן כלל שחוסם קבצי .html או את השורש.
 */
export default function robots(): MetadataRoute.Robots {
  // Vercel Preview: חוסמים הכל (הדומיין הראשי לא מושפע - שם VERCEL_ENV=production)
  if (!IS_PRODUCTION_DEPLOY) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/dashboard", "/admin", "/api/", "/auth/"] }],
    ...(SITE_URL ? { sitemap: `${SITE_URL}/sitemap.xml`, host: SITE_URL } : {}),
  };
}
