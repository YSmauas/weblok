"use client";

import type { BlockValues } from "../types";
import { clip, parseLinks, previewTheme } from "../_shared/util";

/** קירוב חזותי לתצוגה החיה (המגירה מוצגת פתוחה) - לא מריץ את הקוד המיוצא. */
export function Preview({ values }: { values: BlockValues }) {
  const { t, accent, font, dir } = previewTheme(values);
  const left = values.drawerSide === "left";
  const links = parseLinks(values.navLinks, 5);
  const cta = clip(values.ctaText, 40);
  const note = clip(values.noteText, 240);
  const w = values.drawerWidth === "narrow" ? "w-[55%]" : values.drawerWidth === "wide" ? "w-[80%]" : "w-[68%]";

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: "#64748b33", fontFamily: `'${font}', sans-serif` }} dir={dir}>
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,.45)" }} />
      <div
        className={`absolute top-0 bottom-0 ${w} max-w-[340px] flex flex-col ${left ? "left-0" : "right-0"}`}
        style={{ background: t.bg, color: t.text, [left ? "borderRight" : "borderLeft"]: `1px solid ${t.border}` }}
      >
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${t.border}` }}>
          <span className="font-extrabold">{clip(values.drawerTitle, 60) || "תפריט"}</span>
          <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs" style={{ border: `1px solid ${t.border}` }}>
            {"✕"}
          </span>
        </div>
        <div className="flex-1 p-2 space-y-0.5 overflow-hidden">
          {links.map((l, i) => (
            <div key={l.label} className="px-3 py-2 rounded-lg text-sm font-semibold" style={i === 0 ? { background: `${accent}2e`, color: accent } : undefined}>
              {l.label}
            </div>
          ))}
          {cta && (
            <div className="mt-3 mx-2 py-2 rounded-lg text-center text-sm font-bold text-white" style={{ background: accent }}>
              {cta}
            </div>
          )}
        </div>
        {note && (
          <div className="px-4 py-3 text-xs opacity-80" style={{ borderTop: `1px solid ${t.border}` }}>
            {note}
          </div>
        )}
      </div>
    </div>
  );
}
