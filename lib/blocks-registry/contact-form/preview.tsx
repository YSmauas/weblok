"use client";

import type { BlockValues } from "../types";
import { getTheme } from "./themes";
import { fontStack } from "../_shared/util";

const Svg = ({ d, size = 14 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

/**
 * קירוב חזותי לתצוגה החיה בעורך - לא מריץ את ה-HTML/CSS/JS המיוצא בפועל
 * (זה קורה ב-iframe נפרד בעמוד העורך). responsive: נשען על יחידות יחסיות
 * ו-flex/wrap כדי להיראות טוב גם בפאנל צר במובייל.
 */
export function Preview({ values }: { values: BlockValues }) {
  const theme = getTheme(values.themeSelect, values.accentColor || "#38bdf8");
  const t = values.defaultThemeMode === "light" ? theme.light : theme.dark;
  const isWidget = values.displayMode === "widget";

  return (
    <div
      className={`relative h-full w-full flex p-4 sm:p-6 overflow-auto ${
        isWidget ? "items-end" : "items-center"
      } ${isWidget && values.widgetPosition === "left" ? "justify-start" : "justify-end"} ${
        !isWidget ? "justify-center" : ""
      }`}
      style={{ background: t.bg, fontFamily: fontStack(values.fontSelect) }}
    >
      {!isWidget && values.sectionTitle?.trim() && (
        <div className="absolute top-4 left-0 right-0 text-center px-4">
          <h3 className="font-extrabold text-lg" style={{ color: t.text }}>
            {values.sectionTitle}
          </h3>
        </div>
      )}

      <div
        className="w-full max-w-[360px] overflow-hidden"
        style={{ background: t.panel, border: `1px solid ${t.border}`, color: t.text }}
      >
        <div
          className="px-4 pt-4 pb-3 flex items-start justify-between gap-2"
          style={{ borderBottom: `1px solid ${t.border}` }}
        >
          <div className="min-w-0">
            <h3 className="font-bold text-sm sm:text-base truncate">{values.formTitle || "צור עמנו קשר"}</h3>
            <p className="text-xs opacity-80 mt-1 line-clamp-2">{values.formSubtitle}</p>
          </div>
          <div className="flex gap-1.5 shrink-0">
            {values.allowThemeToggle === "yes" && (
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs"
                style={{ background: "rgba(128,128,128,.2)" }}
              >
                <Svg d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />
              </span>
            )}
            {isWidget && (
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs"
                style={{ background: "rgba(128,128,128,.2)" }}
              >
                <Svg d="m18 6-12 12M6 6l12 12" />
              </span>
            )}
          </div>
        </div>

        <div className="p-4 space-y-2.5">
          {["שם", "מייל", ...(values.showPhone !== "hidden" ? ["טלפון"] : []), ...(values.showSubject !== "hidden" ? ["נושא"] : [])].map(
            (label) => (
              <div
                key={label}
                className="h-9 rounded-lg px-3 flex items-center text-xs opacity-60"
                style={{ background: t.inputBg, border: `1px solid ${t.border}` }}
              >
                {label}
              </div>
            )
          )}
          <div
            className="h-14 rounded-lg px-3 pt-2 text-xs opacity-60"
            style={{ background: t.inputBg, border: `1px solid ${t.border}` }}
          >
            הודעה
          </div>
          <div
            className="h-10 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{ background: values.accentColor || "#38bdf8", color: "#fff" }}
          >
            {values.btnText || "שלח הודעה"}
          </div>
        </div>
      </div>

      {isWidget && (
        <div
          className={`absolute bottom-4 ${values.widgetPosition === "left" ? "left-4" : "right-4"} w-12 h-12 rounded-full flex items-center justify-center text-lg`}
          style={{ background: values.accentColor || "#38bdf8", color: "#fff" }}
        >
          <Svg d="M3 6h18v12H3zM3 7l9 6 9-6" size={20} />
        </div>
      )}
    </div>
  );
}
