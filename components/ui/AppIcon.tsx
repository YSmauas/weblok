import type { ReactNode } from "react";

/**
 * אייקוני SVG לבלוקים ולכלים (קו + מילוי עדין, currentColor).
 * הגודל נגזר מ-font-size של ההורה (1em), כך שמחלקות כמו text-3xl ממשיכות לעבוד.
 * שם לא מוכר (למשל אימוג'י ישן) מוצג כטקסט - תאימות לאחור.
 */
const T = "currentColor"; // קו
const F = { fill: "currentColor", fillOpacity: 0.16, stroke: "none" } as const; // מילוי עדין

const ICONS: Record<string, ReactNode> = {
  chatbot: (
    <>
      <path d="M5 4.5h14a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2h-6.5L8 20.5V17H5a2 2 0 0 1-2-2V6.5a2 2 0 0 1 2-2z" />
      <path d="M12 7.6l.95 2.05 2.05.95-2.05.95L12 13.6l-.95-2.05L9 10.6l2.05-.95z" fill={T} stroke="none" />
    </>
  ),
  contact: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m3.8 7.2 7.2 5.4a1.6 1.6 0 0 0 2 0l7.2-5.4" />
    </>
  ),
  header: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="M3 4h18v5H3z" {...F} />
      <path d="M3 9h18M7 13h10M7 16.5h6" />
    </>
  ),
  footer: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="M3 15h18v5H3z" {...F} />
      <path d="M3 15h18M7 8h10M7 11.5h6" />
    </>
  ),
  sidebar: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="M3 4h6.5v16H3z" {...F} />
      <path d="M9.5 4v16M13 9h5M13 12.5h5M13 16h3" />
    </>
  ),
  popup: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2.5" strokeDasharray="2.2 2.4" opacity="0.55" />
      <rect x="6.5" y="8" width="11" height="8.5" rx="1.8" fill="currentColor" fillOpacity="0.16" />
      <path d="M9 11.2h6M9 13.8h3.5" />
    </>
  ),
  inject: (
    <>
      <rect x="4" y="11" width="16" height="9" rx="2.5" />
      <path d="M4 11h16v3H4z" {...F} />
      <path d="M12 3.5v8m-3.3-3.2L12 11.6l3.3-3.3" />
    </>
  ),
  github: (
    <>
      <circle cx="6" cy="18" r="2.7" />
      <circle cx="18" cy="6.5" r="2.7" />
      <path d="M6 3.5v11.8M18 9.2a8.8 8.8 0 0 1-8.8 8.8" />
    </>
  ),
  // מבנה: פרויקט שלם - שכבות מוערמות
  structure: (
    <>
      <path d="M12 3.5 20.5 8 12 12.5 3.5 8z" {...F} />
      <path d="M12 3.5 20.5 8 12 12.5 3.5 8z" />
      <path d="m3.5 12 8.5 4.5 8.5-4.5M3.5 16l8.5 4.5 8.5-4.5" />
    </>
  ),
  // אישורי הגעה: הזמנה במעטפה
  rsvp: (
    <>
      <rect x="3" y="6.5" width="18" height="13" rx="2.5" />
      <path d="M3 6.5h18v4.2L12 15 3 10.7z" {...F} />
      <path d="m3.6 8.2 8.4 5.6 8.4-5.6" />
      <path d="M7.5 3.5h9" opacity="0.55" />
    </>
  ),
  puzzle: (
    <path d="M10 4.5a2 2 0 1 1 4 0V6h4a1 1 0 0 1 1 1v4h-1.5a2 2 0 1 0 0 4H19v4a1 1 0 0 1-1 1h-4v-1.5a2 2 0 1 0-4 0V20H6a1 1 0 0 1-1-1v-4h1.5a2 2 0 1 0 0-4H5V7a1 1 0 0 1 1-1h4z" />
  ),
};

export function AppIcon({ name, className = "" }: { name: string; className?: string }) {
  const body = ICONS[name];
  if (!body) return <span aria-hidden>{name}</span>;
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke={T}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`inline-block align-[-0.125em] text-accent ${className}`.trim()}
    >
      {body}
    </svg>
  );
}
