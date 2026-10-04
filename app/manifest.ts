import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

/** מניפסט PWA: מאפשר "הוספה למסך הבית" באנדרואיד/אייפון עם שם ואייקון נכונים. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} - בלוקים חכמים לאתר שלך`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    scope: "/",
    display: "standalone",
    lang: "he",
    dir: "rtl",
    background_color: "#0a0d0a",
    theme_color: "#0a0d0a",
    categories: ["productivity", "developer tools"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
