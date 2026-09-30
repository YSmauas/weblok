"use client";

import type { BlockValues } from "../types";
import { clip, previewTheme } from "../_shared/util";
import { STRINGS, type Lang } from "./strings";
import { PROVIDER_INFO, onAccent, type ProviderId } from "./config.schema";

const SYSTEM_FONT = `system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans Hebrew", Arial, sans-serif`;
const SAMPLE: Record<Lang, { q: string; a: string }> = {
  he: { q: "מה שעות הפעילות?", a: "אנחנו זמינים בימים א'-ה' בין 9:00 ל-18:00. אפשר גם להשאיר פרטים ונחזור אליכם." },
  en: { q: "What are your opening hours?", a: "We're available Sunday-Thursday, 9:00-18:00. You can also leave your details and we'll get back to you." },
  es: { q: "¿Cuál es el horario?", a: "Atendemos de domingo a jueves, de 9:00 a 18:00. También puedes dejar tus datos y te contactamos." },
};

/** קירוב חזותי (מצב "דמו") - הצ'אט פתוח עם שיחה לדוגמה. התצוגה "חיה" מריצה את הקוד האמיתי. */
export function Preview({ values }: { values: BlockValues }) {
  const { t, accent, dir } = previewTheme(values);
  const lang: Lang = values.widgetLang === "en" || values.widgetLang === "es" ? values.widgetLang : "he";
  const S = STRINGS[lang];
  const font = ["Assistant", "Heebo", "Rubik", "Varela Round"].includes(values.fontSelect) ? `'${values.fontSelect}', ${SYSTEM_FONT}` : SYSTEM_FONT;
  const pos = values.widgetPosition;
  const right = pos === "right" || pos === "left" ? pos === "right" : (pos === "start") === (dir === "rtl");
  const name = clip(values.titleText, 60) || S.defaultName;
  const quick = (values.quickReplies || "").split(/[,،]/).map((q) => q.trim()).filter(Boolean).slice(0, 4);
  const mode = values.providerMode as ProviderId | "choice";
  const provName = mode === "choice" ? PROVIDER_INFO.gemini.name + " / …" : (PROVIDER_INFO[mode as ProviderId] ?? PROVIDER_INFO.gemini).name;
  const pill = values.launcherStyle === "pill";
  const sample = SAMPLE[lang];
  const fg = /^#[0-9a-fA-F]{6}$/.test(accent) ? onAccent(accent) : "#fff";

  return (
    <div
      dir={dir}
      lang={lang}
      className="relative h-full w-full overflow-hidden bg-[linear-gradient(135deg,#0f172a,#334155)]"
      style={{ fontFamily: font }}
    >
      <div
        className={`absolute top-4 bottom-20 ${right ? "right-4" : "left-4"} flex w-[min(330px,calc(100%-32px))] flex-col overflow-hidden rounded-2xl shadow-2xl`}
        style={{ background: t.bg, color: t.text, border: `1px solid ${t.border}` }}
      >
        <div className="flex items-center gap-2 px-3 py-2.5" style={{ background: accent, color: fg }}>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/15 text-sm" aria-hidden>
            {"🤖"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{name}</p>
            <p className="truncate text-[10px] opacity-85">{provName}</p>
          </div>
          <span className="text-xs opacity-80" aria-hidden>
            {"🔑 🗑 ✕"}
          </span>
        </div>
        <div className="flex-1 space-y-2 overflow-hidden p-3 text-xs leading-relaxed">
          {values.welcomeMsg?.trim() && (
            <div className="w-fit max-w-[88%] rounded-2xl rounded-ss-sm px-3 py-2" style={{ background: t.panel, border: `1px solid ${t.border}` }}>
              {clip(values.welcomeMsg, 200)}
            </div>
          )}
          <div className="ms-auto w-fit max-w-[88%] rounded-2xl rounded-se-sm px-3 py-2" style={{ background: accent, color: fg }}>
            {sample.q}
          </div>
          <div className="w-fit max-w-[88%] rounded-2xl rounded-ss-sm px-3 py-2" style={{ background: t.panel, border: `1px solid ${t.border}` }}>
            {sample.a}
          </div>
          {quick.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {quick.map((q) => (
                <span key={q} className="rounded-full px-2.5 py-1 text-[11px]" style={{ border: `1px solid ${accent}` }}>
                  {q}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 p-2" style={{ background: t.panel, borderTop: `1px solid ${t.border}` }}>
          <span className="flex-1 truncate rounded-full px-3 py-2 text-[11px] opacity-70" style={{ border: `1px solid ${t.border}`, background: t.inputBg }}>
            {clip(values.placeholder, 80) || S.placeholder}
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full text-xs" style={{ background: accent, color: fg }} aria-hidden>
            {"➤"}
          </span>
        </div>
      </div>
      <div
        className={`absolute bottom-4 ${right ? "right-4" : "left-4"} flex h-12 items-center justify-center gap-2 rounded-full text-sm font-bold shadow-lg ${pill ? "px-4" : "w-12"} ${
          values.launcherPulse === "yes" ? "motion-safe:animate-pulse" : ""
        }`}
        style={{ background: accent, color: fg }}
      >
        <span aria-hidden>{"💬"}</span>
        {pill && <span>{clip(values.launcherLabel, 30) || S.open}</span>}
      </div>
    </div>
  );
}
