"use client";

import type { BlockValues } from "../types";
import { clip, parseLinks, previewTheme } from "../_shared/util";

/** קירוב חזותי לתצוגה החיה - לא מריץ את הקוד המיוצא. */
export function Preview({ values }: { values: BlockValues }) {
  const { t, accent, font, dir } = previewTheme(values);
  const layout = values.footerLayout || "columns";
  const columns = layout === "columns";
  const col1 = parseLinks(values.col1Links, 4);
  const col2 = columns ? parseLinks(values.col2Links, 4) : [];
  const social = parseLinks(values.socialLinks, 4);
  const icons = values.socialStyle !== "pills";
  const copy = clip(values.copyrightText, 120).split("{year}").join(String(new Date().getFullYear()));

  return (
    <div className="h-full w-full flex flex-col justify-end overflow-auto" style={{ background: "#64748b22", fontFamily: font }} dir={dir}>
      <div className="p-4 space-y-2" aria-hidden="true">
        {[85, 70, 90].map((w) => (
          <div key={w} className="h-2.5 rounded-full" style={{ width: `${w}%`, background: "#94a3b833" }} />
        ))}
      </div>
      <div
        style={{
          background: t.bg,
          color: t.text,
          borderTop: values.footerDecor === "none" ? `1px solid ${t.border}` : `2px solid ${accent}`,
        }}
      >
        <div
          className={`p-5 gap-6 ${
            columns ? "grid grid-cols-2 sm:grid-cols-3" : layout === "split" ? "flex flex-wrap items-center justify-between" : "flex flex-col items-center text-center"
          }`}
        >
          <div className={columns ? "col-span-2 sm:col-span-1" : ""}>
            <div className="font-extrabold">{clip(values.brandText, 60) || "האתר שלי"}</div>
            <p className="text-xs opacity-80 mt-1 line-clamp-2">{values.tagline}</p>
            {social.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {social.map((l) => (
                  <span
                    key={l.label}
                    className={icons ? "w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold" : "text-[10px] px-2 py-0.5 rounded-full"}
                    style={{ border: `1px solid ${t.border}` }}
                  >
                    {icons ? l.label.slice(0, 1) : l.label}
                  </span>
                ))}
              </div>
            )}
          </div>
          {[col1, col2].map((items, i) =>
            items.length ? (
              <div key={i} className={columns ? "" : "flex flex-wrap justify-center gap-x-3"}>
                {columns && (
                  <div className="text-xs font-bold mb-1.5" style={{ color: accent }}>
                    {clip(i === 0 ? values.col1Title : values.col2Title, 40)}
                  </div>
                )}
                {items.map((l) => (
                  <div key={l.label} className="text-xs opacity-80 mb-1">
                    {l.label}
                  </div>
                ))}
              </div>
            ) : null
          )}
        </div>
        {copy && (
          <div className="text-center text-[11px] opacity-70 py-3" style={{ borderTop: `1px solid ${t.border}` }}>
            {copy}
          </div>
        )}
      </div>
    </div>
  );
}
