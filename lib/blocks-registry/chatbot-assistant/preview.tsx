"use client";

import type { BlockValues } from "../types";

export function Preview({ values }: { values: BlockValues }) {
  const accent = values.accentColor || "#e8a33d";
  const isWidget = values.displayMode !== "fullscreen";
  const position = values.widgetPosition === "left" ? "items-start" : "items-end";

  return (
    <div
      className={`h-full w-full flex ${
        isWidget ? `${position} justify-end` : "items-center justify-center"
      } p-6`}
      style={{ fontFamily: `'${values.fontSelect || "Heebo"}', sans-serif` }}
    >
      <div
        className="rounded-2xl border shadow-2xl overflow-hidden bg-[#181822] border-white/10"
        style={{ width: isWidget ? 300 : 380, minHeight: isWidget ? 380 : 480 }}
      >
        <div
          className="flex items-center gap-2 px-4 py-3"
          style={{ background: accent }}
        >
          <span className="w-7 h-7 rounded-full bg-black/20 flex items-center justify-center text-sm">
            💬
          </span>
          <p className="text-sm font-bold text-black/85">
            {values.titleText || "העוזר החכם"}
          </p>
        </div>
        <div className="p-3 space-y-2">
          <div className="bg-black/25 text-white/80 text-xs rounded-2xl rounded-br-sm px-3 py-2 w-fit max-w-[85%]">
            {values.welcomeMsg || "שלום! איך אפשר לעזור היום?"}
          </div>
        </div>
        <div className="px-3 pb-3 mt-auto">
          <div className="text-[11px] text-white/40 border border-white/10 rounded-full px-3 py-2">
            {values.placeholder || "הקלד הודעה כאן..."}
          </div>
        </div>
      </div>
    </div>
  );
}
