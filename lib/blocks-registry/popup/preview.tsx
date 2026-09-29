"use client";

import type { BlockValues } from "../types";
import { clip, previewTheme } from "../_shared/util";

/** קירוב חזותי לתצוגה החיה - מציג את הפופאפ פתוח, בלי טריגרים. */
export function Preview({ values }: { values: BlockValues }) {
  const { t, accent, font, dir } = previewTheme(values);
  const type = values.popupType || "promo";
  const isCookie = type === "cookie";
  const isMsg = type === "message";
  const layout = isCookie ? values.cookieLayout || "bar" : values.layout || "modal";
  const left = values.cornerSide === "left";

  const title = isCookie ? values.cookieTitle : isMsg ? values.msgTitle : values.promoTitle;
  const body = isCookie ? values.cookieBody : isMsg ? values.msgBody : values.promoBody;
  const code = !isCookie && !isMsg ? clip(values.promoCode, 30) : "";
  const primary = isCookie ? values.acceptText : isMsg ? values.msgBtnText : values.ctaText;

  const place =
    layout === "bar"
      ? "left-0 right-0 bottom-0 flex flex-wrap items-center gap-3"
      : layout === "corner"
        ? `bottom-3 ${left ? "left-3" : "right-3"} w-[78%] max-w-[320px]`
        : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[86%] max-w-[380px]";

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: "#64748b33", fontFamily: `'${font}', sans-serif` }} dir={dir}>
      {layout === "modal" && <div className="absolute inset-0" style={{ background: "rgba(0,0,0,.55)" }} />}
      <div
        className={`absolute p-4 ${layout === "bar" ? "" : "rounded-2xl"} ${place}`}
        style={{ background: t.bg, color: t.text, border: `1px solid ${t.border}`, boxShadow: "0 8px 30px rgba(0,0,0,.35)" }}
      >
        {!isCookie && (
          <span className="absolute top-2 end-2 w-6 h-6 rounded-full flex items-center justify-center text-xs opacity-70">{"✕"}</span>
        )}
        <div className={layout === "bar" ? "flex-1 min-w-[180px]" : ""}>
          <div className="font-extrabold text-base pe-6">{clip(title, 80)}</div>
          <p className="text-xs opacity-90 mt-1 line-clamp-3">{body}</p>
          {code && (
            <div className="inline-flex items-center gap-2 mt-3 ps-3 pe-1 py-1 rounded-lg text-xs" style={{ border: `2px dashed ${accent}` }}>
              <code className="font-extrabold tracking-wider">{code}</code>
              <span className="px-2 py-1 rounded-md text-white font-bold" style={{ background: accent }}>
                {"העתק"}
              </span>
            </div>
          )}
        </div>
        <div className={`flex gap-2 ${layout === "bar" ? "" : "mt-3"}`}>
          {isCookie && (
            <span className="px-3 py-2 rounded-lg text-xs font-bold" style={{ border: `1px solid ${t.border}` }}>
              {clip(values.declineText, 30) || "דחייה"}
            </span>
          )}
          {primary?.trim() && (
            <span className="px-4 py-2 rounded-lg text-xs font-bold text-white" style={{ background: accent }}>
              {primary}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
