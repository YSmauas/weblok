import type { EventConfig } from "./config";

/**
 * העיצוב של דף ההזמנה - מקור אחד שמשמש גם את app/globals.css בפרויקט המיוצא
 * וגם את התצוגה המקדימה בעורך, כך שמה שרואים הוא מה שמקבלים.
 * הערכים הדינמיים היחידים (צבע, גופן, שקיפות, תמונה) נכנסים כמשתני CSS
 * מתוך ערכים שכבר עברו ולידציה (hex, רשימה סגורה, מספר).
 */

/** גופני מערכת בלבד - בלי Google Fonts/CDN, כדי שהפרויקט יעבוד בלי תלות חיצונית ועם CSP הדוק. */
export const FONT_STACKS: Record<EventConfig["font"], string> = {
  sans: 'system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans Hebrew", Arial, sans-serif',
  serif: '"Frank Ruehl CLM", "David Libre", David, "Noto Serif Hebrew", Georgia, "Times New Roman", serif',
  rounded: '"Varela Round", ui-rounded, "Arial Rounded MT Bold", "SF Pro Rounded", system-ui, sans-serif',
  classic: '"Palatino Linotype", Palatino, "Book Antiqua", "Noto Serif Hebrew", Georgia, serif',
};

/** טקסט קריא על צבע המבטא (שחור או לבן לפי בהירות) */
export function onAccent(hex: string): string {
  const n = Number.parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45 ? "#15120e" : "#ffffff";
}

export const THEME_CSS = `/* ערכות עיצוב - נבחרות ע"י data-theme על <html> */
[data-theme="elegant"] { --bg: #f7f1e8; --card: rgba(255, 252, 246, 0.9); --text: #3b2f24; --muted: #7a6a58; --line: #e6d8c3; --field: #fffdf8; color-scheme: light; }
[data-theme="modern"]  { --bg: #0f1115; --card: rgba(22, 25, 32, 0.86); --text: #f2f4f8; --muted: #9aa3b2; --line: #2a2f3a; --field: #151922; color-scheme: dark; }
[data-theme="floral"]  { --bg: #fbf0f2; --card: rgba(255, 255, 255, 0.88); --text: #4a2c35; --muted: #8d6b75; --line: #f0d3da; --field: #ffffff; color-scheme: light; }
[data-theme="night"]   { --bg: #0d1530; --card: rgba(17, 27, 58, 0.84); --text: #eef1ff; --muted: #aab3d6; --line: #26345f; --field: #0f1938; color-scheme: dark; }
[data-theme="minimal"] { --bg: #ffffff; --card: rgba(255, 255, 255, 0.94); --text: #111111; --muted: #666666; --line: #e5e5e5; --field: #ffffff; color-scheme: light; }
[data-theme="festive"] { --bg: #1a1033; --card: rgba(36, 20, 70, 0.84); --text: #fff7ff; --muted: #cdb8f0; --line: #4a2f7a; --field: #221442; color-scheme: dark; }

*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0;
  min-height: 100dvh;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font);
  line-height: 1.6;
}
[data-theme="festive"] body { background: radial-gradient(900px 500px at 80% -10%, color-mix(in srgb, var(--accent) 35%, transparent), transparent 70%), var(--bg); }
[data-theme="floral"] body { background: radial-gradient(700px 420px at 10% 0%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 70%), var(--bg); }

.bg { position: fixed; inset: 0; z-index: -1; background-image: var(--bg-image); background-size: cover; background-position: center; }
.bg::after { content: ""; position: absolute; inset: 0; background: var(--bg); opacity: var(--overlay); }

.page { width: 100%; max-width: 640px; margin-inline: auto; padding: 32px 16px 48px; display: grid; gap: 20px; }
.card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 22px;
  padding: 28px 22px;
  box-shadow: 0 18px 50px -24px rgba(0, 0, 0, 0.35);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
}
.hero { text-align: center; }
.eyebrow { margin: 0; font-size: 0.8rem; letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent); font-weight: 700; }
.title { margin: 10px 0 6px; font-size: clamp(1.9rem, 7vw, 2.8rem); line-height: 1.15; text-wrap: balance; }
.hosts { margin: 0; color: var(--muted); }
.divider { width: 64px; height: 2px; background: var(--accent); border: 0; margin: 20px auto; border-radius: 2px; }
.when { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin: 0; }
.when div { border: 1px solid var(--line); border-radius: 14px; padding: 10px 12px; }
.when dt { font-size: 0.75rem; color: var(--muted); }
.when dd { margin: 2px 0 0; font-weight: 700; }
.details { white-space: pre-line; margin: 18px 0 0; }
.place { margin-top: 18px; display: grid; gap: 4px; }
.place strong { font-size: 1.05rem; }
.place span { color: var(--muted); }
.links { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-top: 14px; }
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  min-height: 44px; padding: 10px 20px; border-radius: 999px; border: 1px solid var(--accent);
  background: var(--accent); color: var(--on-accent); font: inherit; font-weight: 700; text-decoration: none; cursor: pointer;
}
.btn:disabled { opacity: 0.6; cursor: progress; }
.btn.ghost { background: transparent; color: var(--text); border-color: var(--line); }
.btn.ghost:hover { border-color: var(--accent); }
.btn.block { width: 100%; }
h2 { margin: 0 0 4px; font-size: 1.4rem; }
.muted { color: var(--muted); margin: 0; font-size: 0.9rem; }
form { display: grid; gap: 14px; margin-top: 18px; }
label, legend { display: block; font-size: 0.85rem; font-weight: 700; margin-bottom: 6px; }
input, textarea, select {
  width: 100%; font: inherit; color: var(--text); background: var(--field);
  border: 1px solid var(--line); border-radius: 12px; padding: 11px 12px; min-height: 44px;
}
input:focus-visible, textarea:focus-visible, select:focus-visible, .btn:focus-visible, .choice input:focus-visible + span { outline: 2px solid var(--accent); outline-offset: 2px; }
textarea { min-height: 88px; resize: vertical; }
fieldset { border: 0; padding: 0; margin: 0; }
.choices { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px; }
.choice { position: relative; margin: 0; font-weight: 600; }
.choice input { position: absolute; opacity: 0; inset: 0; width: 100%; height: 100%; margin: 0; cursor: pointer; }
.choice span { display: flex; align-items: center; justify-content: center; min-height: 44px; padding: 8px; border: 1px solid var(--line); border-radius: 12px; text-align: center; }
.choice input:checked + span { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 16%, transparent); }
.hp { position: absolute; inset-inline-start: -10000px; width: 1px; height: 1px; overflow: hidden; }
.status { margin: 0; font-weight: 700; }
.status.error { color: #d14b3a; }
.done { text-align: center; padding: 12px 0; }
.foot { text-align: center; font-size: 0.75rem; color: var(--muted); }
.foot a { color: inherit; }
@media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
`;

/** משתני ה-CSS הדינמיים (כבר מסוננים) כאובייקט - לשימוש ב-style של <html>. */
export function themeVars(cfg: EventConfig): Record<string, string> {
  const vars: Record<string, string> = {
    "--accent": cfg.accent,
    "--on-accent": onAccent(cfg.accent),
    "--font": FONT_STACKS[cfg.font],
    "--overlay": String(cfg.overlay / 100),
  };
  if (cfg.background) vars["--bg-image"] = `url(${cfg.background})`;
  return vars;
}
