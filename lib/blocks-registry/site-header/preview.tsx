"use client";

import type { BlockValues } from "../types";
import { clip, parseLinks, previewTheme } from "../_shared/util";

/** קירוב חזותי לתצוגה החיה - לא מריץ את הקוד המיוצא. */
export function Preview({ values }: { values: BlockValues }) {
  const { t, accent, font, dir } = previewTheme(values);
  const links = parseLinks(values.navLinks, 4);
  const cta = clip(values.ctaText, 40);
  const center = values.headerLayout === "center";
  const split = values.headerLayout === "logo-center";
  const floating = values.headerStyle === "floating";

  const brand = (
    <div className="flex items-center gap-2 min-w-0">
      {values.logoUrl?.trim() ? <span className="w-7 h-7 rounded-md shrink-0" style={{ background: accent }} /> : null}
      <span className="font-extrabold truncate">{clip(values.brandText, 60) || "האתר שלי"}</span>
    </div>
  );
  const nav = (
    <div className="flex items-center gap-1 text-xs flex-wrap justify-center">
      {links.map((l) => (
        <span key={l.label} className="px-2 py-1 rounded-md opacity-90">
          {l.label}
        </span>
      ))}
    </div>
  );
  const button = cta ? (
    <span className="px-3 py-1.5 rounded-lg font-bold text-white text-xs" style={{ background: accent }}>
      {cta}
    </span>
  ) : null;

  return (
    <div className="h-full w-full overflow-auto" style={{ background: "#64748b22", fontFamily: font }} dir={dir}>
      <div className={floating ? "p-2" : ""}>
        <div
          style={{ background: t.bg, color: t.text, borderBottom: `1px solid ${t.border}`, border: floating ? `1px solid ${t.border}` : undefined }}
          className={floating ? "rounded-2xl shadow-lg" : ""}
        >
          {split ? (
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3">
              {nav}
              {brand}
              <div className="justify-self-end">{button}</div>
            </div>
          ) : (
            <div className={`flex items-center gap-3 px-4 py-3 ${center ? "flex-col" : "justify-between"}`}>
              {brand}
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {nav}
                {button}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="p-4 space-y-2" aria-hidden="true">
        {[80, 95, 70].map((w) => (
          <div key={w} className="h-2.5 rounded-full" style={{ width: `${w}%`, background: "#94a3b833" }} />
        ))}
      </div>
    </div>
  );
}
