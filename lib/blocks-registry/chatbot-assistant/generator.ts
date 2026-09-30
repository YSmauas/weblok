import type { BlockValues } from "../types";
import type { BlockOutput } from "../export-types";
import { toUnifiedHtml } from "../export";
import { GEMINI_ENDPOINT, GEMINI_MODELS } from "@/lib/ai/models";
import { fields, DEFAULT_MODELS, PROVIDER_IDS, PROVIDER_INFO as PROVIDERS, onAccent, type ProviderId } from "./config.schema";
import { TRAP_JS, clip, designCss, esc, makePick, sanitizeDesign } from "../_shared/util";
import { STRINGS, type Lang } from "./strings";

const pick = makePick(fields);

/** מזהה מודל: אותיות, ספרות ו-._:/@- בלבד (בלי רווחים/מרכאות) - אחרת ברירת המחדל */
const MODEL_OK = /^[A-Za-z0-9][A-Za-z0-9._:/@~-]{0,99}$/;
const modelOr = (v: string | undefined, fallback: string) => {
  const s = (v ?? "").trim();
  return MODEL_OK.test(s) ? s : fallback;
};


const LENGTH = { short: { words: 80, tokens: 400 }, medium: { words: 200, tokens: 900 }, long: { words: 500, tokens: 2000 } };
const LANG_NAME: Record<Lang, string> = { he: "Hebrew", en: "English", es: "Spanish" };

const SYSTEM_FONT = `system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans Hebrew", Arial, sans-serif`;
const GOOGLE_FONTS = ["Assistant", "Heebo", "Rubik", "Varela Round"];


const ICON = {
  chat: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4.5h14a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2h-6.5L8 20.5V17H5a2 2 0 0 1-2-2V6.5a2 2 0 0 1 2-2z"/><path d="M12 7.6l.95 2.05 2.05.95-2.05.95L12 13.6l-.95-2.05L9 10.6l2.05-.95z" fill="currentColor" stroke="none"/></svg>',
  close: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m18 6-12 12M6 6l12 12"/></svg>',
  send: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>',
  stop: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>',
  key: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.8-9.8M17 6l3 3M14.5 8.5l2 2"/></svg>',
  trash: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>',
  bot: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 4v4M9 13h.01M15 13h.01"/></svg>',
};

/**
 * "העוזר החכם" - ווידג'ט AI עצמאי לגמרי (HTML+CSS+JS), בלי שום שרת שלנו.
 * המבקר באתר מדביק מפתח API משלו; המפתח נשמר רק בדפדפן שלו ונשלח בכותרת
 * (לעולם לא ב-URL) ישירות לספק שנבחר. בקוד המיוצא אין שום מפתח.
 * תשובות המודל מוצגות דרך createElement/textContent בלבד - אף פעם לא innerHTML.
 */
export function toOutput(raw: BlockValues): BlockOutput {
  // תאימות לעיצובים ישנים: themeMode הישן → defaultThemeMode
  const legacy: BlockValues = { ...raw };
  if (!raw.defaultThemeMode && (raw.themeMode === "light" || raw.themeMode === "dark")) legacy.defaultThemeMode = raw.themeMode;
  const d = sanitizeDesign(legacy);
  const lang = pick(raw, "widgetLang") as Lang;
  const S = STRINGS[lang];
  const dir = d.dir === "ltr" ? "ltr" : "rtl";

  const mode = pick(raw, "providerMode");
  const allowed: ProviderId[] = mode === "choice" ? [...PROVIDER_IDS] : [mode as ProviderId];

  // Gemini: המודל שהיוצר ביקש (אם יש) ואחריו שרשרת הגיבוי המרכזית
  const gemUser = (raw.geminiModel ?? "").trim();
  const gemChain = Array.from(new Set([...(MODEL_OK.test(gemUser) ? [gemUser] : []), ...GEMINI_MODELS])).slice(0, 8);

  const providers = allowed.map((id) => ({
    id,
    name: PROVIDERS[id].name,
    keyUrl: PROVIDERS[id].keyUrl,
    keyHint: PROVIDERS[id].keyHint,
    models: id === "gemini" ? gemChain : [modelOr(raw[`${id}Model`], DEFAULT_MODELS[id])],
  }));

  const len = LENGTH[pick(raw, "maxLength") as keyof typeof LENGTH] ?? LENGTH.medium;
  const knowledge = clip(raw.knowledge, 6000);
  const system = [
    knowledge,
    `Reply in ${LANG_NAME[lang]} unless the user writes in another language - then reply in the user's language.`,
    `Keep every answer under about ${len.words} words. Use short paragraphs; simple lists are fine; no tables and no HTML.`,
    "Never ask the user for passwords, API keys or payment details.",
  ]
    .filter(Boolean)
    .join("\n\n");

  const name = clip(raw.titleText, 60) || S.defaultName;
  const quick = (raw.quickReplies ?? "")
    .split(/[,،]/)
    .map((q) => q.trim().slice(0, 80))
    .filter(Boolean)
    .slice(0, 6);

  // הגדרות לכל מופע - JSON בתוך <script type="application/json"> (לא מורץ). jsStr/escape של "<" מונע סגירת תגית.
  const config = {
    name,
    welcome: clip(raw.welcomeMsg, 500),
    quick,
    system,
    temperature: Number(pick(raw, "temperature")) || 0.5,
    maxTokens: len.tokens,
    chatMemory: pick(raw, "chatMemory"),
    geminiEndpoint: GEMINI_ENDPOINT,
    providers,
    t: S,
  };
  const configJson = JSON.stringify(config).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");

  // מיקום: start/end לוגיים; ערכים ישנים right/left נשמרים כצד פיזי
  const posRaw = raw.widgetPosition;
  const side =
    posRaw === "right" || posRaw === "left"
      ? posRaw
      : (pick(raw, "widgetPosition") === "start") === (dir === "rtl")
        ? "right"
        : "left";
  const pill = pick(raw, "launcherStyle") === "pill";
  const pulse = pick(raw, "launcherPulse") === "yes";
  const launcherLabel = clip(raw.launcherLabel, 30) || S.open;
  const placeholder = clip(raw.placeholder, 80) || S.placeholder;
  const single = providers.length === 1;

  const html = `<div class="wbai" data-wb-ai dir="${dir}" lang="${lang}">
  <script type="application/json" data-wb-ai-cfg>${configJson}</script>
  <button class="wbai-launch${pill ? " wbai-pill" : ""}${pulse ? " wbai-pulse" : ""}" type="button" aria-haspopup="dialog" aria-expanded="false" aria-label="${esc(pill ? launcherLabel : S.open)}" data-wb-launch>${ICON.chat}${pill ? `<span>${esc(launcherLabel)}</span>` : ""}</button>
  <div class="wbai-panel" role="dialog" aria-modal="true" aria-label="${esc(name)}" tabindex="-1" hidden data-wb-panel>
    <div class="wbai-head">
      <span class="wbai-avatar" aria-hidden="true">${ICON.bot}</span>
      <div class="wbai-title">
        <h2>${esc(name)}</h2>
        <span class="wbai-sub" data-wb-sub></span>
      </div>
      <button class="wbai-icon" type="button" aria-label="${esc(S.keySettings)}" title="${esc(S.keySettings)}" data-wb-keybtn>${ICON.key}</button>
      <button class="wbai-icon" type="button" aria-label="${esc(S.clear)}" title="${esc(S.clear)}" data-wb-clear>${ICON.trash}</button>
      <button class="wbai-icon" type="button" aria-label="${esc(S.close)}" title="${esc(S.close)}" data-wb-close>${ICON.close}</button>
    </div>
    <div class="wbai-chat" data-wb-chatview>
      <div class="wbai-log" role="log" aria-live="polite" aria-relevant="additions" data-wb-log></div>
      <div class="wbai-status" role="status" aria-live="polite" data-wb-status></div>
      <form class="wbai-form" data-wb-form>
        <textarea class="wbai-input" rows="1" maxlength="2000" placeholder="${esc(placeholder)}" aria-label="${esc(placeholder)}" data-wb-input></textarea>
        <button class="wbai-btn wbai-stop" type="button" aria-label="${esc(S.stop)}" title="${esc(S.stop)}" hidden data-wb-stop>${ICON.stop}</button>
        <button class="wbai-btn" type="submit" aria-label="${esc(S.send)}" title="${esc(S.send)}" data-wb-send>${ICON.send}</button>
      </form>
    </div>
    <form class="wbai-setup" hidden data-wb-setup novalidate>
      <h3>${esc(S.setupTitle)}</h3>
      <p class="wbai-muted">${esc(S.setupIntro)}</p>
      <label class="wbai-field"${single ? " hidden" : ""}>
        <span>${esc(S.provider)}</span>
        <select data-wb-prov>${providers.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join("")}</select>
      </label>
      <label class="wbai-field">
        <span data-wb-keylabel>${esc(S.apiKey)}</span>
        <input type="password" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="300" dir="ltr" data-wb-keyin>
      </label>
      <a class="wbai-link" target="_blank" rel="noopener noreferrer" data-wb-keylink></a>
      <label class="wbai-check"><input type="checkbox" data-wb-remember> <span>${esc(S.remember)}</span></label>
      <p class="wbai-muted wbai-small">${esc(S.rememberHint)}</p>
      <div class="wbai-risk">
        <strong>${esc(S.riskTitle)}</strong>
        <ul><li>${esc(S.risk1)}</li><li>${esc(S.risk2)}</li><li>${esc(S.risk3)}</li></ul>
      </div>
      <p class="wbai-err" role="alert" data-wb-seterr></p>
      <div class="wbai-actions">
        <button class="wbai-primary" type="submit">${esc(S.save)}</button>
        <button class="wbai-ghost" type="button" hidden data-wb-back>${esc(S.back)}</button>
        <button class="wbai-ghost wbai-danger" type="button" hidden data-wb-forget>${esc(S.forget)}</button>
      </div>
    </form>
  </div>
</div>`;

  const { css: vars, panelCss } = designCss(".wbai", d);
  const google = GOOGLE_FONTS.includes(raw.fontSelect ?? "") ? (raw.fontSelect as string) : "";
  const fontCss = google
    ? `@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(google).replace(/%20/g, "+")}:wght@400;600;700&display=swap');\n`
    : "";
  const fontFamily = google ? `'${google}', ${SYSTEM_FONT}` : SYSTEM_FONT;
  const fg = onAccent(d.accentColor);

  const css = `${fontCss}${vars}
.wbai { --wbai-on: ${fg}; font-family: ${fontFamily}; font-size: 15px; line-height: 1.5; }
.wbai [hidden] { display: none !important; }
.wbai button, .wbai input, .wbai select, .wbai textarea { font: inherit; color: inherit; }
.wbai-launch { position: fixed; z-index: 2147483000; bottom: calc(16px + env(safe-area-inset-bottom)); ${side}: calc(16px + env(safe-area-inset-${side})); display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-width: 56px; height: 56px; padding: 0 16px; border: 0; border-radius: 999px; background: var(--wb-accent); color: var(--wbai-on); cursor: pointer; box-shadow: 0 10px 28px -6px rgba(0,0,0,.45); transition: transform .2s; }
.wbai-launch:not(.wbai-pill) { width: 56px; padding: 0; }
.wbai-launch span { font-weight: 700; font-size: .95rem; white-space: nowrap; }
.wbai-launch:hover { transform: translateY(-2px); }
.wbai-launch:focus-visible, .wbai-panel button:focus-visible, .wbai-panel a:focus-visible, .wbai-panel select:focus-visible, .wbai-panel input:focus-visible, .wbai-panel textarea:focus-visible { outline: 2px solid var(--wb-accent); outline-offset: 2px; }
.wbai-pulse { animation: wbai-pulse 2.4s ease-out infinite; }
@keyframes wbai-pulse { 0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--wb-accent) 55%, transparent), 0 10px 28px -6px rgba(0,0,0,.45); } 70%, 100% { box-shadow: 0 0 0 14px transparent, 0 10px 28px -6px rgba(0,0,0,.45); } }
.wbai-open .wbai-launch { display: none; }
.wbai-panel { position: fixed; z-index: 2147483001; bottom: calc(16px + env(safe-area-inset-bottom)); ${side}: 16px; width: min(390px, calc(100vw - 32px)); height: min(620px, calc(100dvh - 32px)); display: flex; flex-direction: column; overflow: hidden; background: var(--wb-bg); color: var(--wb-text); border: 1px solid var(--wb-border); outline: none; ${panelCss} }
.wbai-open .wbai-panel { animation: wbai-in .22s ease-out; }
@keyframes wbai-in { from { opacity: 0; transform: translateY(12px) scale(.98); } to { opacity: 1; transform: none; } }
.wbai-head { display: flex; align-items: center; gap: 8px; padding: 12px 12px 12px 14px; background: var(--wb-accent); color: var(--wbai-on); flex-shrink: 0; }
.wbai-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,.14); flex-shrink: 0; }
.wbai-title { flex: 1; min-width: 0; }
.wbai-title h2 { margin: 0; font-size: 1rem; font-weight: 700; line-height: 1.25; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: inherit; }
.wbai-sub { display: block; font-size: .75rem; opacity: .85; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.wbai-icon { width: 36px; height: 36px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border: 0; border-radius: 50%; background: transparent; color: inherit; cursor: pointer; }
.wbai-icon:hover { background: rgba(0,0,0,.15); }
.wbai-chat { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.wbai-log { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 16px 14px; display: flex; flex-direction: column; gap: 10px; }
.wbai-msg { max-width: 88%; padding: 9px 13px; border-radius: 16px; word-wrap: break-word; overflow-wrap: anywhere; animation: wbai-msg .2s ease-out; }
@keyframes wbai-msg { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
.wbai-bot { align-self: flex-start; background: var(--wb-panel); border: 1px solid var(--wb-border); border-start-start-radius: 4px; }
.wbai-user { align-self: flex-end; background: var(--wb-accent); color: var(--wbai-on); border-start-end-radius: 4px; white-space: pre-wrap; }
.wbai-msg p { margin: 0 0 .5em; } .wbai-msg p:last-child { margin-bottom: 0; }
.wbai-msg ul, .wbai-msg ol { margin: 0 0 .5em; padding-inline-start: 1.3em; } .wbai-msg li { margin: .15em 0; }
.wbai-msg code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .88em; padding: 1px 5px; border-radius: 5px; background: rgba(127,127,127,.18); }
.wbai-msg a { color: var(--wb-accent); text-decoration: underline; }
.wbai-user a { color: inherit; }
.wbai-note { display: block; margin-top: 6px; font-size: .8rem; opacity: .75; }
.wbai-error { align-self: stretch; max-width: none; background: color-mix(in srgb, #ef4444 12%, var(--wb-bg)); border: 1px solid color-mix(in srgb, #ef4444 45%, transparent); }
.wbai-error button { margin-top: 8px; padding: 6px 12px; border-radius: 8px; border: 1px solid var(--wb-border); background: var(--wb-bg); cursor: pointer; font-size: .85rem; font-weight: 600; }
.wbai-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.wbai-typing { display: inline-flex; gap: 4px; padding: 4px 0; }
.wbai-typing i { width: 7px; height: 7px; border-radius: 50%; background: currentColor; opacity: .35; animation: wbai-dot 1.1s infinite; }
.wbai-typing i:nth-child(2) { animation-delay: .15s; } .wbai-typing i:nth-child(3) { animation-delay: .3s; }
@keyframes wbai-dot { 0%, 80%, 100% { opacity: .25; } 40% { opacity: .9; } }
.wbai-quick { display: flex; flex-wrap: wrap; gap: 6px; }
.wbai-quick button { padding: 6px 12px; border: 1px solid var(--wb-accent); border-radius: 999px; background: transparent; color: var(--wb-text); font-size: .85rem; cursor: pointer; }
.wbai-quick button:hover { background: color-mix(in srgb, var(--wb-accent) 18%, transparent); }
.wbai-status:empty { display: none; }
.wbai-status { padding: 0 14px 6px; font-size: .8rem; opacity: .75; }
.wbai-form { display: flex; align-items: flex-end; gap: 8px; padding: 10px 10px calc(10px + env(safe-area-inset-bottom)); border-top: 1px solid var(--wb-border); background: var(--wb-panel); flex-shrink: 0; }
.wbai-input { flex: 1; min-width: 0; min-height: 42px; max-height: 140px; resize: none; padding: 10px 14px; border: 1px solid var(--wb-border); border-radius: 21px; background: var(--wb-input); color: var(--wb-text); font-size: 16px; line-height: 1.35; }
.wbai-btn { width: 42px; height: 42px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border: 0; border-radius: 50%; background: var(--wb-accent); color: var(--wbai-on); cursor: pointer; }
.wbai-btn:disabled { opacity: .45; cursor: not-allowed; }
.wbai-stop { background: var(--wb-text); color: var(--wb-bg); }
.wbai-setup { flex: 1; min-height: 0; overflow-y: auto; padding: 18px 16px calc(18px + env(safe-area-inset-bottom)); display: flex; flex-direction: column; gap: 10px; margin: 0; }
.wbai-setup h3 { margin: 0; font-size: 1.05rem; font-weight: 700; }
.wbai-muted { margin: 0; font-size: .88rem; opacity: .85; }
.wbai-small { font-size: .78rem; margin-top: -4px; }
.wbai-field { display: flex; flex-direction: column; gap: 4px; font-size: .85rem; font-weight: 600; }
.wbai-field select, .wbai-field input { width: 100%; padding: 10px 12px; border: 1px solid var(--wb-border); border-radius: 10px; background: var(--wb-input); color: var(--wb-text); font-size: 16px; font-weight: 400; }
.wbai-field input { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.wbai-link { color: var(--wb-accent); font-size: .85rem; font-weight: 600; }
.wbai-check { display: flex; align-items: center; gap: 8px; font-size: .88rem; cursor: pointer; }
.wbai-check input { width: 18px; height: 18px; accent-color: var(--wb-accent); }
.wbai-risk { padding: 10px 12px; border-radius: 10px; border: 1px solid color-mix(in srgb, #f59e0b 50%, transparent); background: color-mix(in srgb, #f59e0b 10%, transparent); font-size: .8rem; }
.wbai-risk ul { margin: 4px 0 0; padding-inline-start: 1.2em; } .wbai-risk li { margin: 2px 0; }
.wbai-err { margin: 0; color: #ef4444; font-size: .85rem; font-weight: 600; }
.wbai-err:empty { display: none; }
.wbai-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.wbai-primary, .wbai-ghost { padding: 10px 16px; border-radius: 10px; font-weight: 700; font-size: .9rem; cursor: pointer; }
.wbai-primary { border: 0; background: var(--wb-accent); color: var(--wbai-on); }
.wbai-ghost { border: 1px solid var(--wb-border); background: transparent; color: var(--wb-text); }
.wbai-danger { color: #ef4444; border-color: color-mix(in srgb, #ef4444 50%, transparent); }
@media (max-width: 520px) {
  .wbai-panel { inset: 0; width: 100%; height: 100vh; height: 100dvh; max-height: none; border-radius: 0 !important; border: 0; padding-top: env(safe-area-inset-top); }
  .wbai-head { padding-inline: max(12px, env(safe-area-inset-left)) max(12px, env(safe-area-inset-right)); }
}
@media (prefers-reduced-motion: reduce) { .wbai-pulse, .wbai-panel, .wbai-msg, .wbai-typing i { animation: none !important; } }`;

  const js = `(function () {
  ${TRAP_JS}
  var MODEL_GONE = /no longer available|not found for API version|is not supported for generateContent|models\\/[^ ]+ is not found/i;

  // אחסון בטוח: בדפדפן פרטי / iframe מבודד הגישה ל-storage זורקת שגיאה - נופלים לזיכרון
  var mem = {};
  function store(kind) { try { var s = window[kind]; s.getItem('x'); return s; } catch (e) { return null; } }
  function sGet(kind, k) { var s = store(kind); try { return s ? s.getItem(k) : (mem[kind + k] || null); } catch (e) { return null; } }
  function sSet(kind, k, v) { var s = store(kind); try { if (s) s.setItem(k, v); else mem[kind + k] = v; } catch (e) { mem[kind + k] = v; } }
  function sDel(kind, k) { var s = store(kind); try { if (s) s.removeItem(k); } catch (e) {} delete mem[kind + k]; }

  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function fmt(s, p) { return String(s).replace('{p}', p); }

  // markdown מצומצם, בונה DOM בלבד (textContent) - אף פעם לא innerHTML עם פלט של מודל
  function inline(parent, text) {
    var re = /(\\*\\*[^*\\n]+\\*\\*|\`[^\`\\n]+\`|\\[[^\\]\\n]+\\]\\(https?:\\/\\/[^\\s)]+\\)|https?:\\/\\/[^\\s<>()]+[^\\s<>().,;:!?'"])/g;
    var last = 0, m;
    while ((m = re.exec(text))) {
      if (m.index > last) parent.appendChild(document.createTextNode(text.slice(last, m.index)));
      var t = m[0];
      if (t.slice(0, 2) === '**') parent.appendChild(el('strong', '', t.slice(2, -2)));
      else if (t.charAt(0) === '\`') parent.appendChild(el('code', '', t.slice(1, -1)));
      else {
        var label = t, href = t;
        if (t.charAt(0) === '[') { var i = t.indexOf(']('); label = t.slice(1, i); href = t.slice(i + 2, -1); }
        var a = el('a', '', label);
        a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer nofollow';
        parent.appendChild(a);
      }
      last = m.index + t.length;
    }
    if (last < text.length) parent.appendChild(document.createTextNode(text.slice(last)));
  }
  function renderMd(box, text) {
    var lines = String(text).replace(/\\r/g, '').split('\\n');
    var list = null, para = null;
    lines.forEach(function (raw) {
      var line = raw.replace(/^#{1,6}\\s+/, '');
      var ul = /^\\s*[-*•]\\s+(.*)$/.exec(line), ol = /^\\s*\\d+[.)]\\s+(.*)$/.exec(line);
      if (ul || ol) {
        var tag = ul ? 'UL' : 'OL';
        if (!list || list.tagName !== tag) { list = el(tag.toLowerCase()); box.appendChild(list); }
        para = null;
        var li = el('li'); inline(li, (ul || ol)[1]); list.appendChild(li);
      } else if (!line.trim()) { list = null; para = null; }
      else {
        list = null;
        if (!para) { para = el('p'); box.appendChild(para); } else para.appendChild(el('br'));
        inline(para, line);
      }
    });
  }

  function httpErr(status, body) {
    var e = new Error('http'); e.status = status; e.body = String(body || '').slice(0, 4000); return e;
  }
  function classify(err) {
    if (err && err.name === 'AbortError') return err.timeout ? 'timeout' : 'aborted';
    if (err && err.code) return err.code;
    var st = err && err.status, b = (err && err.body) || '';
    if (!st) return 'network';
    if (/API_KEY_INVALID|API key not valid|API_KEY_EXPIRED|invalid_api_key|authentication_error|Invalid API Key/i.test(b)) return 'invalidKey';
    if (st === 401 || st === 403) return 'invalidKey';
    if (st === 402 || /credit balance|insufficient.{0,20}(credit|fund|balance)/i.test(b)) return 'credit';
    if (st === 429) return /per ?day|PerDay|daily|free_tier/i.test(b) ? 'quotaDay' : 'rate';
    if (st === 404) return 'model';
    if (st === 400 && /SAFETY|blocked|content.?filter|moderation/i.test(b)) return 'blocked';
    if (st === 529 || st === 503 || st === 502 || st === 500) return 'overloaded';
    return 'failed';
  }

  function post(url, headers, body, signal) {
    return fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(body), signal: signal, credentials: 'omit', referrerPolicy: 'strict-origin-when-cross-origin' })
      .then(function (r) {
        return r.text().then(function (t) {
          if (!r.ok) throw httpErr(r.status, t);
          try { return JSON.parse(t); } catch (e) { var x = new Error('json'); x.code = 'failed'; throw x; }
        });
      });
  }
  function fail(code) { var e = new Error(code); e.code = code; return e; }

  // --- ספקים: כל אחד מקבל היסטוריה [{role:'user'|'assistant', text}] ומחזיר {text, truncated} ---
  function callGemini(cfg, prov, key, hist, signal, state) {
    // המודל שעבד בפעם הקודמת ראשון, ואחריו שאר השרשרת
    var models = state.gemModel ? [state.gemModel].concat(prov.models.filter(function (m) { return m !== state.gemModel; })) : prov.models;
    var body = {
      systemInstruction: { parts: [{ text: cfg.system }] },
      contents: hist.map(function (m) { return { role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.text }] }; }),
      generationConfig: { temperature: cfg.temperature, maxOutputTokens: cfg.maxTokens + 2048 }
    };
    var i = 0;
    function next() {
      var model = models[i++];
      if (!model) return Promise.reject(fail('model'));
      return post(cfg.geminiEndpoint + '/' + encodeURIComponent(model) + ':generateContent', { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body, signal)
        .then(function (d) {
          state.gemModel = model;
          if (d && d.promptFeedback && d.promptFeedback.blockReason) throw fail('blocked');
          var c = d && d.candidates && d.candidates[0];
          var text = ((c && c.content && c.content.parts) || []).map(function (p) { return p && !p.thought && p.text ? p.text : ''; }).join('').trim();
          var fr = c && c.finishReason;
          if (!text && /SAFETY|BLOCKLIST|PROHIBITED|SPII|RECITATION/.test(fr || '')) throw fail('blocked');
          if (!text) throw fail(fr === 'MAX_TOKENS' ? 'truncatedEmpty' : 'empty');
          return { text: text, truncated: fr === 'MAX_TOKENS' };
        }, function (e) {
          // מודל שהוסר / לא זמין לחשבון - עוברים לבא בתור
          if (e && e.status && (e.status === 404 || MODEL_GONE.test(e.body || ''))) { state.gemModel = null; return next(); }
          throw e;
        });
    }
    return next();
  }
  function callAnthropic(cfg, prov, key, hist, signal) {
    var model = prov.models[0];
    var body = { model: model, max_tokens: cfg.maxTokens + 2048, system: cfg.system, messages: hist.map(function (m) { return { role: m.role, content: m.text }; }) };
    // מודלים חדשים חושבים כברירת מחדל - מאמץ נמוך מתאים לצ'אט. Haiku/ישנים לא מקבלים effort.
    if (/claude-(opus|sonnet|fable)-(5|4-[6-9])/.test(model)) body.output_config = { effort: 'low' };
    return post('https://api.anthropic.com/v1/messages', {
      'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true'
    }, body, signal).then(function (d) {
      if (d && d.stop_reason === 'refusal') throw fail('blocked');
      var text = ((d && d.content) || []).map(function (b) { return b && b.type === 'text' ? b.text : ''; }).join('').trim();
      if (!text) throw fail(d && d.stop_reason === 'max_tokens' ? 'truncatedEmpty' : 'empty');
      return { text: text, truncated: d.stop_reason === 'max_tokens' };
    });
  }
  var OPENAI_LIKE = { openrouter: 'https://openrouter.ai/api/v1/chat/completions', groq: 'https://api.groq.com/openai/v1/chat/completions', mistral: 'https://api.mistral.ai/v1/chat/completions' };
  function callOpenAiLike(cfg, prov, key, hist, signal) {
    var msgs = [{ role: 'system', content: cfg.system }].concat(hist.map(function (m) { return { role: m.role, content: m.text }; }));
    var headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key };
    if (prov.id === 'openrouter') headers['X-Title'] = cfg.name.replace(/[^\\x20-\\x7e]/g, '').slice(0, 60) || 'Site assistant';
    return post(OPENAI_LIKE[prov.id], headers, { model: prov.models[0], messages: msgs, temperature: cfg.temperature, max_tokens: cfg.maxTokens + 1024 }, signal)
      .then(function (d) {
        if (d && d.error) throw httpErr(d.error.code || 500, JSON.stringify(d.error));
        var c = d && d.choices && d.choices[0];
        var text = String((c && c.message && c.message.content) || '').trim();
        var fr = c && c.finish_reason;
        if (!text && fr === 'content_filter') throw fail('blocked');
        if (!text) throw fail(fr === 'length' ? 'truncatedEmpty' : 'empty');
        return { text: text, truncated: fr === 'length' };
      });
  }

  document.querySelectorAll('[data-wb-ai]').forEach(function (root) {
    if (root.getAttribute('data-wb-init')) return;
    root.setAttribute('data-wb-init', '1');
    var cfg;
    try { cfg = JSON.parse(root.querySelector('[data-wb-ai-cfg]').textContent); } catch (e) { return; }
    var T = cfg.t, provs = cfg.providers || [];
    if (!provs.length) return;
    var q = function (s) { return root.querySelector(s); };
    var launch = q('[data-wb-launch]'), panel = q('[data-wb-panel]'), log = q('[data-wb-log]'), statusEl = q('[data-wb-status]');
    var chatView = q('[data-wb-chatview]'), setup = q('[data-wb-setup]'), form = q('[data-wb-form]'), input = q('[data-wb-input]');
    var sendBtn = q('[data-wb-send]'), stopBtn = q('[data-wb-stop]'), sub = q('[data-wb-sub]');
    var provSel = q('[data-wb-prov]'), keyIn = q('[data-wb-keyin]'), keyLink = q('[data-wb-keylink]'), remember = q('[data-wb-remember]');
    var setErr = q('[data-wb-seterr]'), backBtn = q('[data-wb-back]'), forgetBtn = q('[data-wb-forget]'), keyLabel = q('[data-wb-keylabel]');
    var KEY = 'wbai-key', PROV = 'wbai-provider', CHAT = 'wbai-chat';
    var state = { gemModel: null }, history = [], busy = false, ctrl = null, lastFocus = null, gen = 0;

    function provById(id) { for (var i = 0; i < provs.length; i++) if (provs[i].id === id) return provs[i]; return null; }
    var current = provById(sGet('localStorage', PROV) || sGet('sessionStorage', PROV)) || provs[0];

    // המפתח נשמר לפי ספק; localStorage רק אם המבקר ביקש "לזכור", אחרת sessionStorage/זיכרון
    function getKey(id) { return sGet('localStorage', KEY + ':' + id) || sGet('sessionStorage', KEY + ':' + id) || ''; }
    function saveKey(id, key, keep) {
      sDel('localStorage', KEY + ':' + id); sDel('sessionStorage', KEY + ':' + id);
      sSet(keep ? 'localStorage' : 'sessionStorage', KEY + ':' + id, key);
      sSet(keep ? 'localStorage' : 'sessionStorage', PROV, id);
    }
    function forgetKey(id) { sDel('localStorage', KEY + ':' + id); sDel('sessionStorage', KEY + ':' + id); }

    function updateSub() { sub.textContent = current.name + (getKey(current.id) ? '' : ' · ' + T.noKey); }

    // --- הודעות ---
    function scroll() { log.scrollTop = log.scrollHeight; }
    function addMsg(role, text, opts) {
      var b = el('div', 'wbai-msg ' + (role === 'user' ? 'wbai-user' : 'wbai-bot'));
      b.appendChild(el('span', 'wbai-sr', (role === 'user' ? T.you : cfg.name) + ': '));
      if (role === 'user') b.appendChild(document.createTextNode(text)); else renderMd(b, text);
      if (opts && opts.note) b.appendChild(el('span', 'wbai-note', opts.note));
      log.appendChild(b); scroll(); return b;
    }
    function addError(code) {
      var msg = T.err[code] || T.err.failed;
      var b = el('div', 'wbai-msg wbai-bot wbai-error');
      b.setAttribute('role', 'alert');
      b.appendChild(document.createTextNode(fmt(msg, current.name)));
      if (code === 'invalidKey' || code === 'credit' || code === 'quotaDay') {
        b.appendChild(el('br'));
        var btn = el('button', '', T.changeKey); btn.type = 'button';
        btn.addEventListener('click', function () { showSetup(true); });
        b.appendChild(btn);
      }
      log.appendChild(b); scroll();
    }
    function chips() {
      if (!cfg.quick || !cfg.quick.length || history.length) return;
      var w = el('div', 'wbai-quick');
      cfg.quick.forEach(function (text) {
        var b = el('button', '', text); b.type = 'button';
        b.addEventListener('click', function () { send(text); });
        w.appendChild(b);
      });
      log.appendChild(w);
    }
    function resetLog() {
      log.textContent = '';
      if (cfg.welcome) addMsg('assistant', cfg.welcome);
      history.forEach(function (m) { addMsg(m.role, m.text); });
      chips();
    }
    function persist() {
      if (cfg.chatMemory !== 'session') return;
      try { sSet('sessionStorage', CHAT, JSON.stringify(history.slice(-30))); } catch (e) {}
    }
    if (cfg.chatMemory === 'session') {
      try {
        var saved = JSON.parse(sGet('sessionStorage', CHAT) || '[]');
        if (Array.isArray(saved)) history = saved.filter(function (m) { return m && (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string'; }).slice(-30);
      } catch (e) {}
    }

    function setBusy(on) {
      busy = on;
      stopBtn.hidden = !on; sendBtn.hidden = on;
      statusEl.textContent = on ? T.typing : '';
    }

    function send(text) {
      text = String(text || '').trim().slice(0, 2000);
      if (!text || busy) return;
      var key = getKey(current.id);
      if (!key) { showSetup(false); return; }
      var chipBox = log.querySelector('.wbai-quick'); if (chipBox) chipBox.remove();
      addMsg('user', text);
      history.push({ role: 'user', text: text });
      var typing = el('div', 'wbai-msg wbai-bot');
      typing.setAttribute('aria-hidden', 'true');
      var dots = el('span', 'wbai-typing'); dots.appendChild(el('i')); dots.appendChild(el('i')); dots.appendChild(el('i'));
      typing.appendChild(dots); log.appendChild(typing); scroll();
      setBusy(true);
      ctrl = new AbortController();
      var myCtrl = ctrl;
      var timer = setTimeout(function () { myCtrl.timedOut = true; myCtrl.abort(); }, 90000);
      var hist = history.slice(-12).map(function (m) { return { role: m.role, text: m.text.slice(0, 4000) }; });
      while (hist.length && hist[0].role !== 'user') hist.shift();
      var myGen = gen;
      var p = current.id === 'gemini' ? callGemini(cfg, current, key, hist, ctrl.signal, state)
        : current.id === 'anthropic' ? callAnthropic(cfg, current, key, hist, ctrl.signal)
        : callOpenAiLike(cfg, current, key, hist, ctrl.signal);
      p.then(function (r) {
        typing.remove();
        if (myGen !== gen) return;
        addMsg('assistant', r.text, r.truncated ? { note: T.truncated } : null);
        history.push({ role: 'assistant', text: r.text });
        persist();
      }, function (err) {
        typing.remove();
        if (myGen !== gen) return;
        // בקשה שנכשלה לא נשארת בהיסטוריה שנשלחת למודל
        history.pop();
        if (err && err.name === 'AbortError' && myCtrl.timedOut) err.timeout = true;
        var code = classify(err);
        if (code === 'aborted') addMsg('assistant', T.stopped); else addError(code);
      }).then(function () {
        clearTimeout(timer);
        if (ctrl === myCtrl) ctrl = null;
        setBusy(false);
        if (!panel.hidden && setup.hidden) { try { input.focus(); } catch (e) {} }
      });
    }

    // --- מסך מפתח ---
    function syncSetup() {
      var has = !!getKey(current.id);
      keyLink.href = current.keyUrl;
      keyLink.textContent = fmt(T.getKey, current.name);
      keyLabel.textContent = T.apiKey + ' · ' + current.name;
      keyIn.placeholder = current.keyHint || '';
      keyIn.value = '';
      forgetBtn.hidden = !has;
      backBtn.hidden = !has;
      remember.checked = !!sGet('localStorage', KEY + ':' + current.id);
    }
    function showSetup(focusKey) {
      if (provSel) provSel.value = current.id;
      setErr.textContent = '';
      syncSetup();
      chatView.hidden = true; setup.hidden = false;
      setTimeout(function () { try { (focusKey || provs.length === 1 ? keyIn : provSel).focus(); } catch (e) {} }, 30);
    }
    function showChat() {
      setup.hidden = true; chatView.hidden = false; updateSub();
      setTimeout(function () { try { input.focus(); } catch (e) {} }, 30);
    }
    if (provSel) provSel.addEventListener('change', function () { current = provById(provSel.value) || provs[0]; state.gemModel = null; setErr.textContent = ''; syncSetup(); updateSub(); });
    setup.addEventListener('submit', function (e) {
      e.preventDefault();
      var k = keyIn.value.replace(/^\\s+|\\s+$/g, '');
      if (!k) { setErr.textContent = T.keyEmpty; keyIn.focus(); return; }
      if (k.length < 10 || /\\s/.test(k) || /[^\\x21-\\x7e]/.test(k)) { setErr.textContent = T.keyBad; keyIn.focus(); return; }
      saveKey(current.id, k, remember.checked);
      keyIn.value = '';
      showChat();
    });
    backBtn.addEventListener('click', showChat);
    forgetBtn.addEventListener('click', function () {
      forgetKey(current.id);
      keyIn.value = '';
      setErr.textContent = '';
      syncSetup(); updateSub();
      setErr.textContent = T.forgotten;
      keyIn.focus();
    });

    // --- פתיחה/סגירה ---
    function open() {
      lastFocus = document.activeElement;
      root.classList.add('wbai-open');
      panel.hidden = false;
      launch.setAttribute('aria-expanded', 'true');
      launch.classList.remove('wbai-pulse');
      updateSub();
      if (getKey(current.id)) showChat(); else showSetup(false);
    }
    function close() {
      root.classList.remove('wbai-open');
      panel.hidden = true;
      launch.setAttribute('aria-expanded', 'false');
      try { (lastFocus && lastFocus !== document.body ? lastFocus : launch).focus(); } catch (e) {}
    }
    launch.addEventListener('click', open);
    q('[data-wb-close]').addEventListener('click', close);
    q('[data-wb-keybtn]').addEventListener('click', function () { if (setup.hidden) showSetup(false); else if (getKey(current.id)) showChat(); });
    q('[data-wb-clear]').addEventListener('click', function () {
      gen++;
      if (ctrl) ctrl.abort();
      history = []; persist();
      try { sDel('sessionStorage', CHAT); } catch (e) {}
      resetLog(); showChat();
    });
    panel.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); if (busy && ctrl) ctrl.abort(); else close(); return; }
      wbTrap(e, panel);
    });
    stopBtn.addEventListener('click', function () { if (ctrl) ctrl.abort(); });
    form.addEventListener('submit', function (e) { e.preventDefault(); var v = input.value; if (!v.trim() || busy) return; input.value = ''; grow(); send(v); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); if (typeof form.requestSubmit === 'function') form.requestSubmit(); else form.dispatchEvent(new Event('submit', { cancelable: true })); }
    });
    function grow() { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 140) + 'px'; }
    input.addEventListener('input', grow);

    resetLog();
    updateSub();
  });
})();`;

  return { html, css, js, componentName: "AiAssistant" };
}

/** תאימות ל-BlockDefinition.generate */
export function generate(values: BlockValues): string {
  return toUnifiedHtml(toOutput(values));
}
