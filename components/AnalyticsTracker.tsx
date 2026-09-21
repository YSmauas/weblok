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

/** שולח צפייה בדף + זמן שהייה. מכבד Do Not Track. מזהה הסשן אקראי ונמחק בסגירת הלשונית. */
export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || SKIP.some((p) => pathname.startsWith(p))) return;
    if (navigator.doNotTrack === "1") return;
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
