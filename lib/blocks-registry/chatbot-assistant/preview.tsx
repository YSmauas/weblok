"use client";

import type { BlockValues } from "../types";

/** קירוב חזותי מהיר; התצוגה "קוד אמיתי" בעורך מריצה את הצ'אט בפועל. */
export function Preview({ values }: { values: BlockValues }) {
  const accent = values.accentColor || "#e8a33d";
  const isWidget = values.displayMode !== "fullscreen";
  const light = values.themeMode === "light";
  const quick = (values.quickReplies || "").split(",").map((q) => q.trim()).filter(Boolean).slice(0, 4);
  const pal = light
    ? { bg: "#ffffff", panel: "#f4f4f5", text: "#18181b", muted: "#71717a", bot: "#f0f0f3", border: "rgba(0,0,0,.1)" }
    : { bg: "#16161d", panel: "#1f1f29", text: "#f4f4f5", muted: "#a1a1aa", bot: "#2a2a36", border: "rgba(255,255,255,.1)" };

  return (
    <div
      dir="rtl"
      className={`relative h-full w-full flex p-4 sm:p-6 bg-[linear-gradient(135deg,#0f172a,#334155)] ${
        isWidget ? `items-end ${values.widgetPosition === "left" ? "justify-end" : "justify-start"}` : "items-center justify-center"
      }`}
      style={{ fontFamily: `'${values.fontSelect || "Heebo"}', sans-serif` }}
    >
      <div
        className="flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        style={{
          width: isWidget ? 300 : "100%",
          maxWidth: 520,
          height: isWidget ? "calc(100% - 64px)" : "100%",
          maxHeight: 440,
          background: pal.bg,
          color: pal.text,
          border: `1px solid ${pal.border}`,
          marginBottom: isWidget ? 64 : 0,
        }}
      >
        <div className="flex items-center gap-2 px-4 py-3 text-white" style={{ background: accent }}>
          <span className="w-7 h-7 rounded-full bg-black/20 flex items-center justify-center text-sm">🤖</span>
          <p className="text-sm font-bold flex-1 truncate">{values.titleText || "העוזר החכם"}</p>
          {isWidget && <span className="text-xs opacity-80">✕</span>}
        </div>
        <div className="flex-1 p-3 space-y-2 overflow-hidden">
          <div className="text-xs rounded-2xl rounded-ss-sm px-3 py-2 w-fit max-w-[85%]" style={{ background: pal.bot }}>
            {values.welcomeMsg || "שלום! איך אפשר לעזור היום?"}
          </div>
          {quick.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {quick.map((q) => (
                <span key={q} className="text-[11px] rounded-full px-2.5 py-1" style={{ border: `1px solid ${accent}`, color: accent }}>
                  {q}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-1.5 p-2" style={{ background: pal.panel, borderTop: `1px solid ${pal.border}` }}>
          {values.voiceInput !== "no" && (
            <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs" style={{ border: `1px solid ${pal.border}`, color: pal.muted }}>
              🎤
            </span>
          )}
          <span className="flex-1 text-[11px] rounded-full px-3 py-2 truncate" style={{ border: `1px solid ${pal.border}`, color: pal.muted, background: pal.bg }}>
            {values.placeholder || "הקלד הודעה כאן..."}
          </span>
          <span className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs" style={{ background: accent }}>
            ➤
          </span>
        </div>
      </div>
      {isWidget && (
        <div
          className={`absolute bottom-4 ${values.widgetPosition === "left" ? "left-4" : "right-4"} w-12 h-12 rounded-full flex items-center justify-center text-white text-lg shadow-lg`}
          style={{ background: accent }}
        >
          💬
        </div>
      )}
    </div>
  );
}
