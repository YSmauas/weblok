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
  puzzle: (
    <path d="M10 4.5a2 2 0 1 1 4 0V6h4a1 1 0 0 1 1 1v4h-1.5a2 2 0 1 0 0 4H19v4a1 1 0 0 1-1 1h-4v-1.5a2 2 0 1 0-4 0V20H6a1 1 0 0 1-1-1v-4h1.5a2 2 0 1 0 0-4H5V7a1 1 0 0 1 1-1h4z" />
  ),

  /* ---------- עורך הבלוקים: פעולות, מכשירים וקבוצות הגדרות ---------- */
  palette: (
    <>
      <path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.2 0 1.8-.9 1.8-1.8 0-1.2-1-1.6-1-2.7 0-1 .8-1.7 1.8-1.7h2.1a3.8 3.8 0 0 0 3.8-3.8C20.5 6.6 16.7 3.5 12 3.5z" {...F} />
      <path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.2 0 1.8-.9 1.8-1.8 0-1.2-1-1.6-1-2.7 0-1 .8-1.7 1.8-1.7h2.1a3.8 3.8 0 0 0 3.8-3.8C20.5 6.6 16.7 3.5 12 3.5z" />
      <circle cx="7.8" cy="11" r="1" fill={T} stroke="none" />
      <circle cx="10.5" cy="7.5" r="1" fill={T} stroke="none" />
      <circle cx="15" cy="7.8" r="1" fill={T} stroke="none" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v11m-4.5-4.5L12 15l4.5-4.5" />
      <path d="M4.5 16.5v1.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-1.5" />
    </>
  ),
  sparkles: (
    <>
      <path d="M10 4.5l1.4 3.6 3.6 1.4-3.6 1.4L10 14.5l-1.4-3.6L5 9.5l3.6-1.4z" {...F} />
      <path d="M10 4.5l1.4 3.6 3.6 1.4-3.6 1.4L10 14.5l-1.4-3.6L5 9.5l3.6-1.4z" />
      <path d="M17.5 14.5v5M15 17h5" />
    </>
  ),
  replay: (
    <>
      <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
      <path d="M4.5 4.5v3.8h3.8" />
      <path d="m10.5 9.3 4.2 2.7-4.2 2.7z" fill={T} stroke="none" />
    </>
  ),
  "device-mobile": (
    <>
      <rect x="7" y="3" width="10" height="18" rx="2.2" />
      <path d="M11 17.8h2" />
    </>
  ),
  "device-tablet": (
    <>
      <rect x="4.5" y="3" width="15" height="18" rx="2.2" />
      <path d="M11 17.8h2" />
    </>
  ),
  "device-desktop": (
    <>
      <rect x="3" y="4.5" width="18" height="12" rx="2" />
      <path d="M9 20h6M12 16.5V20" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="3.8" />
      <path d="M12 3v1.8M12 19.2V21M3 12h1.8M19.2 12H21M5.6 5.6l1.3 1.3M17.1 17.1l1.3 1.3M5.6 18.4l1.3-1.3M17.1 6.9l1.3-1.3" />
    </>
  ),
  moon: <path d="M20 14.2A8 8 0 1 1 9.8 4a6.4 6.4 0 0 0 10.2 10.2z" />,
  chevron: <path d="m6.5 9.5 5.5 5.5 5.5-5.5" />,
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.2M12 7.8v.01" />
    </>
  ),
  copy: (
    <>
      <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
      <path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  cookie: (
    <>
      <path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5 3.6 3.6 0 0 1-4.3-3.7A3.6 3.6 0 0 1 12 3.5z" {...F} />
      <path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5 3.6 3.6 0 0 1-4.3-3.7A3.6 3.6 0 0 1 12 3.5z" />
      <path d="M8.5 10.5v.01M12 15v.01M15.5 13.5v.01M8 15.5v.01" strokeWidth={2.4} />
    </>
  ),
  "external-link": (
    <>
      <path d="M13.5 4.5h6v6M19.5 4.5l-8 8" />
      <path d="M17.5 13.5v4a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h4" />
    </>
  ),
  layers: (
    <>
      <path d="M12 4 3.5 8.5 12 13l8.5-4.5z" {...F} />
      <path d="M12 4 3.5 8.5 12 13l8.5-4.5z" />
      <path d="m3.5 12.5 8.5 4.5 8.5-4.5M3.5 16.2 12 20.7l8.5-4.5" />
    </>
  ),
  text: <path d="M5 6.5h14M5 11h14M5 15.5h9M5 20h6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  layout: (
    <>
      <rect x="3.5" y="4" width="17" height="16" rx="2.5" />
      <path d="M3.5 9h17M10 9v11" />
    </>
  ),
  wand: (
    <>
      <path d="m4.5 19.5 10-10M13 8l3 3" />
      <path d="M17 3.5v3M15.5 5h3M20 9.5v2.5M18.8 10.8h2.4M9 3.5v2M8 4.5h2" />
    </>
  ),
  tag: (
    <>
      <path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3a1.5 1.5 0 0 1 0 2.1l-6.6 6.6a1.5 1.5 0 0 1-2.1 0z" />
      <circle cx="8" cy="8" r="1.4" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m15.5 8.5-2 5-5 2 2-5z" {...F} />
      <path d="m15.5 8.5-2 5-5 2 2-5z" />
    </>
  ),
  link: (
    <>
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
    </>
  ),
  send: (
    <>
      <path d="M20.5 3.5 3.5 10.5l7 3 3 7z" {...F} />
      <path d="M20.5 3.5 3.5 10.5l7 3 3 7zM20.5 3.5l-10 10" />
    </>
  ),
  list: <path d="M9 6.5h11M9 12h11M9 17.5h11M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01" />,
  sliders: <path d="M4 7h10M18 7h2M4 17h4M12 17h8M16 5v4M10 15v4" />,
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
