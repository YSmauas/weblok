"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const SKIP = ["/admin", "/auth/callback"];

function getSid(): string | null {
  try {
    let sid = sessionStorage.getItem("weblok-sid");
    if (!sid) {
      sid = crypto.randomUUID().replace(/-/g, "");
      sessionStorage.setItem("weblok-sid", sid);
    }
    return sid;
  } catch {
    return null;
  }
}

/**
 * האם הגולש ביקש לא לעקוב אחריו. החלטה (ראו דוח/README): מכבדים גם Do Not Track
 * וגם Global Privacy Control - גולש כזה לא נספר בכלל, גם לא במונה הביקורים
 * הציבורי. המחיר: המונה נמוך מעט מהמציאות. כדי לספור גם אותם (ספירה אנונימית
 * בלבד, בלי מזהה) צריך לשנות כאן במודע - לא בשקט.
 */
function optedOut(): boolean {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean; msDoNotTrack?: string };
  const w = window as Window & { doNotTrack?: string };
  return nav.doNotTrack === "1" || w.doNotTrack === "1" || nav.msDoNotTrack === "1" || nav.globalPrivacyControl === true;
}

/**
 * שולח צפייה בדף + זמן שהייה, לכל גולש (רשום או לא). מזהה הסשן אקראי, נשמר
 * ב-sessionStorage ונמחק בסגירת הלשונית. "ביקור" = סשן כזה (ראו migration 0006).
 */
export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || SKIP.some((p) => pathname.startsWith(p))) return;
    if (optedOut()) return;
    const sid = getSid();
    if (!sid) return;

    const post = (payload: object) =>
      fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});

    post({ kind: "view", sid, path: pathname });

    let start = Date.now();
    const flush = () => {
      const ms = Date.now() - start;
      start = Date.now();
      if (ms > 500) post({ kind: "duration", sid, path: pathname, ms });
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
      else start = Date.now();
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      if (document.visibilityState === "visible") flush();
    };
  }, [pathname]);

  return null;
}
