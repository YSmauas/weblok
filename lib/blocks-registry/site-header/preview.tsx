"use client";

import type { BlockValues } from "../types";
import { clip, parseLinks, previewTheme } from "../_shared/util";

/** קירוב חזותי לתצוגה החיה - לא מריץ את הקוד המיוצא. */
export function Preview({ values }: { values: BlockValues }) {
  const { t, accent, font, dir } = previewTheme(values);
  const links = parseLinks(values.navLinks, 4);
  const cta = clip(values.ctaText, 40);
  const center = values.headerLayout === "center";

  return (
    <div className="h-full w-full overflow-auto" style={{ background: "#64748b22", fontFamily: `'${font}', sans-serif` }} dir={dir}>
      <div style={{ background: t.bg, color: t.text, borderBottom: `1px solid ${t.border}` }}>
        <div className={`flex items-center gap-3 px-4 py-3 ${center ? "flex-col" : "justify-between"}`}>
          <div className="flex items-center gap-2 min-w-0">
            {values.logoUrl?.trim() ? (
              <span className="w-7 h-7 rounded-md shrink-0" style={{ background: accent }} />
            ) : null}
            <span className="font-extrabold truncate">{clip(values.brandText, 60) || "האתר שלי"}</span>
          </div>
          <div className="flex items-center gap-1 text-xs flex-wrap justify-center">
            {links.map((l) => (
              <span key={l.label} className="px-2 py-1 rounded-md opacity-90">
                {l.label}
              </span>
            ))}
            {cta ? (
              <span className="px-3 py-1.5 rounded-lg font-bold text-white ms-2" style={{ background: accent }}>
                {cta}
              </span>
            ) : null}
          </div>
        </div>
      </div>
      <div className="p-4 text-xs opacity-50" style={{ color: "#94a3b8" }}>
        {"תוכן העמוד..."}
      </div>
    </div>
  );
}
