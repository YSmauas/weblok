import type { BlockValues } from "../types";
import type { BlockOutput } from "../export-types";
import { toUnifiedHtml } from "../export";
import { fields } from "./config.schema";

const esc = (v: string) => (v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
/** JSON שבטוח להטמעה בתוך <script> (בלי "</script>") */
const safeJson = (v: unknown) => JSON.stringify(v).replace(/</g, "\\u003c").replace(/\u2028|\u2029/g, "");
const HEX = /^#[0-9a-fA-F]{6}$/;

function pick(values: BlockValues, id: string): string {
  const field = fields.find((f) => f.id === id);
  const v = values[id];
  return field?.options?.some((o) => o.value === v) ? v : field?.default ?? "";
}

/** "מילה, מילה = תשובה" בכל שורה → [{keys, answer}] */
export function parseFaq(text: string): { keys: string[]; answer: string }[] {
  return (text ?? "")
    .split(/\r?\n/)
    .map((line) => {
      const at = line.indexOf("=");
      if (at < 0) return null;
      const keys = line
        .slice(0, at)
        .split(/[,،]/)
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean);
      const answer = line.slice(at + 1).trim();
      return keys.length && answer ? { keys, answer: answer.slice(0, 1000) } : null;
    })
    .filter((x): x is { keys: string[]; answer: string } => !!x)
    .slice(0, 100);
}

const ICON = {
  chat: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/></svg>',
  close: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m18 6-12 12M6 6l12 12"/></svg>',
  send: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>',
  mic: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 19v3"/></svg>',
  bot: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 4v4M9 13h.01M15 13h.01"/></svg>',
};

/**
 * "העוזר החכם" - ווידג'ט צ'אט עצמאי לגמרי (HTML+CSS+JS), בלי שרת שלנו.
 * שני מנועים: שאלות-ותשובות מקומי (עובד מיד), או AI אמיתי דרך פונקציית שרת
 * של בעל האתר - הקובץ api/chat.js מצורף להורדה ומחזיק את המפתח וה-prompt.
 * כך מפתח ה-API וההוראות לעולם לא מופיעים בקוד שבעמוד.
 */
export function toOutput(raw: BlockValues): BlockOutput {
  const v: BlockValues = {
    ...raw,
    botMode: pick(raw, "botMode"),
    displayMode: pick(raw, "displayMode"),
    widgetPosition: pick(raw, "widgetPosition"),
    themeMode: pick(raw, "themeMode"),
    voiceInput: pick(raw, "voiceInput"),
    fontSelect: pick(raw, "fontSelect"),
    accentColor: HEX.test(raw.accentColor ?? "") ? raw.accentColor : "#e8a33d",
  };
  const isWidget = v.displayMode === "widget";
  const side = v.widgetPosition === "left" ? "left" : "right";
  const quick = (v.quickReplies ?? "")
    .split(/[,،]/)
    .map((q) => q.trim())
    .filter(Boolean)
    .slice(0, 6);
  const endpoint = (v.endpointUrl ?? "").trim();
  const safeEndpoint = /^(https:\/\/[^\s"'<>]+|\/[^\s"'<>]*)$/.test(endpoint) ? endpoint : "/api/chat";

  const config = {
    mode: v.botMode,
    endpoint: safeEndpoint,
    faq: v.botMode === "faq" ? parseFaq(v.faqItems) : [],
    fallback: v.fallbackMsg || "לא הבנתי, נסו לנסח אחרת.",
    welcome: v.welcomeMsg || "",
    error: "משהו השתבש בחיבור. נסו שוב בעוד רגע.",
  };

  const fontParam = encodeURIComponent(v.fontSelect).replace(/%20/g, "+");
  const css = `@import url('https://fonts.googleapis.com/css2?family=${fontParam}:wght@400;600;700&display=swap');
.wb-chat, .wb-chat-toggle { font-family: '${v.fontSelect}', system-ui, sans-serif; box-sizing: border-box; }
.wb-chat *, .wb-chat-toggle * { box-sizing: border-box; }
.wb-chat {
  --wb-accent: ${v.accentColor};
  --wb-bg: #16161d; --wb-panel: #1f1f29; --wb-text: #f4f4f5; --wb-muted: #a1a1aa; --wb-border: rgba(255,255,255,.1); --wb-bot: #2a2a36;
  display: flex; flex-direction: column; background: var(--wb-bg); color: var(--wb-text);
  border: 1px solid var(--wb-border); border-radius: 18px; overflow: hidden; box-shadow: 0 20px 50px -12px rgba(0,0,0,.5);
}
.wb-chat[data-wb-theme="light"] { --wb-bg: #ffffff; --wb-panel: #f4f4f5; --wb-text: #18181b; --wb-muted: #71717a; --wb-border: rgba(0,0,0,.1); --wb-bot: #f0f0f3; }
${
  isWidget
    ? `.wb-chat { position: fixed; bottom: 88px; ${side}: 16px; width: min(370px, calc(100vw - 32px)); height: min(560px, calc(100vh - 120px)); z-index: 9999;
  transform-origin: bottom ${side}; transform: scale(.9); opacity: 0; pointer-events: none; transition: transform .25s cubic-bezier(.2,.9,.3,1.2), opacity .2s; }
.wb-chat.wb-open { transform: none; opacity: 1; pointer-events: auto; }
.wb-chat-toggle { position: fixed; bottom: 16px; ${side}: 16px; width: 58px; height: 58px; border-radius: 50%; border: 0; cursor: pointer; z-index: 10000;
  background: ${v.accentColor}; color: #fff; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 24px rgba(0,0,0,.3); transition: transform .2s; }
.wb-chat-toggle:hover { transform: scale(1.07); }`
    : `.wb-chat { width: 100%; max-width: 640px; height: min(70vh, 600px); margin: 0 auto; }`
}
.wb-chat-head { display: flex; align-items: center; gap: 10px; padding: 14px 16px; background: var(--wb-accent); color: #fff; }
.wb-chat-head .wb-avatar { width: 34px; height: 34px; border-radius: 50%; background: rgba(0,0,0,.18); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.wb-chat-head h2 { font-size: 1rem; font-weight: 700; margin: 0; flex: 1; }
.wb-chat-head .wb-status { display: block; font-size: .72rem; font-weight: 400; opacity: .85; }
.wb-chat-x { background: transparent; border: 0; color: inherit; cursor: pointer; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.wb-chat-x:hover { background: rgba(0,0,0,.15); }
.wb-chat-log { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px; scroll-behavior: smooth; }
.wb-msg { max-width: 85%; padding: 9px 13px; border-radius: 16px; font-size: .92rem; line-height: 1.5; white-space: pre-wrap; word-wrap: break-word; animation: wb-in .25s ease; }
.wb-msg.wb-bot { background: var(--wb-bot); align-self: flex-start; border-start-start-radius: 4px; }
.wb-msg.wb-user { background: var(--wb-accent); color: #fff; align-self: flex-end; border-start-end-radius: 4px; }
.wb-typing { display: inline-flex; gap: 4px; }
.wb-typing i { width: 6px; height: 6px; border-radius: 50%; background: var(--wb-muted); animation: wb-dot 1s infinite; }
.wb-typing i:nth-child(2) { animation-delay: .15s; } .wb-typing i:nth-child(3) { animation-delay: .3s; }
.wb-quick { display: flex; flex-wrap: wrap; gap: 6px; }
.wb-quick button { border: 1px solid var(--wb-accent); color: var(--wb-accent); background: transparent; border-radius: 999px; padding: 5px 12px; font: inherit; font-size: .8rem; cursor: pointer; }
.wb-quick button:hover { background: var(--wb-accent); color: #fff; }
.wb-chat-form { display: flex; gap: 6px; padding: 10px; border-top: 1px solid var(--wb-border); background: var(--wb-panel); }
.wb-chat-input { flex: 1; min-width: 0; border: 1px solid var(--wb-border); background: var(--wb-bg); color: var(--wb-text); border-radius: 999px; padding: 10px 14px; font: inherit; font-size: .92rem; outline: none; }
.wb-chat-input:focus { border-color: var(--wb-accent); }
.wb-chat-btn { width: 40px; height: 40px; flex-shrink: 0; border-radius: 50%; border: 0; cursor: pointer; display: flex; align-items: center; justify-content: center; background: var(--wb-accent); color: #fff; }
.wb-chat-btn.wb-mic { background: transparent; color: var(--wb-muted); border: 1px solid var(--wb-border); }
.wb-chat-btn.wb-mic.wb-rec { color: #ef4444; border-color: #ef4444; animation: wb-pulse 1s infinite; }
.wb-chat-btn:disabled { opacity: .5; cursor: not-allowed; }
@keyframes wb-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
@keyframes wb-dot { 0%, 80%, 100% { opacity: .3; } 40% { opacity: 1; } }
@keyframes wb-pulse { 50% { box-shadow: 0 0 0 6px rgba(239,68,68,.2); } }
@media (prefers-reduced-motion: reduce) { .wb-chat, .wb-msg, .wb-typing i { animation: none !important; transition: none !important; } }`;

  const toggleHtml = isWidget
    ? `<button class="wb-chat-toggle" data-wb-chat-toggle aria-label="פתיחת צ'אט" aria-expanded="false">${ICON.chat}</button>\n`
    : "";
  const html = `${toggleHtml}<div class="wb-chat${isWidget ? "" : " wb-open"}" dir="rtl" data-wb-theme="${v.themeMode}"${isWidget ? "" : ' data-wb-static="1"'} role="region" aria-label="${esc(v.titleText || "צ'אט")}">
  <script type="application/json" class="wb-chat-config">${safeJson(config)}</script>
  <div class="wb-chat-head">
    <span class="wb-avatar" aria-hidden="true">${ICON.bot}</span>
    <h2>${esc(v.titleText || "העוזר החכם")}<span class="wb-status">מחובר</span></h2>
    ${isWidget ? `<button class="wb-chat-x" data-wb-chat-close aria-label="סגירה">${ICON.close}</button>` : ""}
  </div>
  <div class="wb-chat-log" data-wb-chat-log aria-live="polite"></div>
  <form class="wb-chat-form" data-wb-chat-form>
    ${v.voiceInput === "yes" ? `<button type="button" class="wb-chat-btn wb-mic" data-wb-chat-mic aria-label="הקלטה קולית" hidden>${ICON.mic}</button>` : ""}
    <input class="wb-chat-input" name="message" autocomplete="off" maxlength="1000" placeholder="${esc(v.placeholder || "")}" aria-label="${esc(v.placeholder || "הודעה")}">
    <button type="submit" class="wb-chat-btn" aria-label="שליחה">${ICON.send}</button>
  </form>
</div>`;

  const quickJson = safeJson(quick);
  const js = `(function () {
  function norm(s) { return String(s || "").toLowerCase().replace(/[^\\p{L}\\p{N}\\s]/gu, " ").replace(/\\s+/g, " ").trim(); }
  // התאמה לפי מילים, עם תחיליות בעברית (ה/ו/ב/ל/מ/ש/כ) וסיומות (מחיר → מחירים)
  function toks(s) { return norm(s).split(" ").filter(Boolean); }
  function wordMatch(tok, kw) {
    if (tok === kw) return true;
    var at = tok.indexOf(kw);
    if (at > 0 && at <= 2 && /^[\u05d4\u05d5\u05d1\u05dc\u05de\u05e9\u05db]+$/.test(tok.slice(0, at))) return true;
    return kw.length >= 3 && at === 0;
  }
  function answerFaq(faq, text) {
    var words = toks(text), best = null, bestScore = 0;
    faq.forEach(function (item) {
      var score = 0;
      item.keys.forEach(function (k) {
        var kws = toks(k), hit = 0;
        kws.forEach(function (kw) { if (words.some(function (w) { return wordMatch(w, kw); })) hit++; });
        if (kws.length && hit === kws.length) score += 3 * k.length;
        else score += hit;
      });
      if (score > bestScore) { bestScore = score; best = item; }
    });
    return best ? best.answer : null;
  }
  document.querySelectorAll(".wb-chat").forEach(function (root) {
    if (root.dataset.wbInit) return;
    root.dataset.wbInit = "1";
    var cfg = {};
    try { cfg = JSON.parse(root.querySelector(".wb-chat-config").textContent); } catch (e) {}
    var log = root.querySelector("[data-wb-chat-log]");
    var form = root.querySelector("[data-wb-chat-form]");
    var input = form.querySelector("input");
    var history = [];
    var busy = false;

    function add(text, who) {
      var el = document.createElement("div");
      el.className = "wb-msg " + (who === "user" ? "wb-user" : "wb-bot");
      el.textContent = text;
      log.appendChild(el);
      log.scrollTop = log.scrollHeight;
      return el;
    }
    function typing() {
      var el = add("", "bot");
      el.innerHTML = '<span class="wb-typing"><i></i><i></i><i></i></span>';
      return el;
    }
    function reply(text) {
      var t = typing();
      if (cfg.mode !== "endpoint") {
        setTimeout(function () { t.textContent = answerFaq(cfg.faq || [], text) || cfg.fallback; log.scrollTop = log.scrollHeight; busy = false; }, 500);
        return;
      }
      fetch(cfg.endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text, history: history.slice(-10) }) })
        .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
        .then(function (d) {
          var out = (d && typeof d.reply === "string" && d.reply.trim()) || cfg.fallback;
          t.textContent = out;
          history.push({ role: "user", text: text }, { role: "model", text: out });
        })
        .catch(function () { t.textContent = cfg.error; })
        .finally(function () { busy = false; log.scrollTop = log.scrollHeight; });
    }
    function send(text) {
      text = String(text || "").trim();
      if (!text || busy) return;
      busy = true;
      add(text, "user");
      var chips = log.querySelector(".wb-quick");
      if (chips) chips.remove();
      reply(text);
    }

    if (cfg.welcome) add(cfg.welcome, "bot");
    var quick = ${quickJson};
    if (quick.length) {
      var wrap = document.createElement("div");
      wrap.className = "wb-quick";
      quick.forEach(function (q) {
        var b = document.createElement("button");
        b.type = "button"; b.textContent = q;
        b.addEventListener("click", function () { send(q); });
        wrap.appendChild(b);
      });
      log.appendChild(wrap);
    }

    form.addEventListener("submit", function (e) { e.preventDefault(); var t = input.value; input.value = ""; send(t); });

    var mic = root.querySelector("[data-wb-chat-mic]");
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (mic && SR) {
      mic.hidden = false;
      var rec = null;
      mic.addEventListener("click", function () {
        if (rec) { rec.stop(); return; }
        rec = new SR();
        rec.lang = document.documentElement.lang === "en" ? "en-US" : "he-IL";
        rec.interimResults = false;
        rec.onresult = function (e) { send(e.results[0][0].transcript); };
        rec.onend = function () { rec = null; mic.classList.remove("wb-rec"); };
        rec.onerror = rec.onend;
        mic.classList.add("wb-rec");
        rec.start();
      });
    }

    var toggle = root.hasAttribute("data-wb-static") ? null : root.previousElementSibling;
    if (toggle && toggle.hasAttribute("data-wb-chat-toggle")) {
      var setOpen = function (open) {
        root.classList.toggle("wb-open", open);
        toggle.setAttribute("aria-expanded", String(open));
        if (open) setTimeout(function () { input.focus(); }, 150);
      };
      toggle.addEventListener("click", function () { setOpen(!root.classList.contains("wb-open")); });
      var x = root.querySelector("[data-wb-chat-close]");
      if (x) x.addEventListener("click", function () { setOpen(false); toggle.focus(); });
      root.addEventListener("keydown", function (e) { if (e.key === "Escape") { setOpen(false); toggle.focus(); } });
    }
  });
})();`;

  const out: BlockOutput = { html, css, js, componentName: "ChatAssistant" };
  if (v.botMode === "endpoint") out.extraFiles = { "api/chat.js": proxyFile(v.systemPrompt ?? "") };
  return out;
}

/** פונקציית שרת (Vercel) שמחזיקה את מפתח ה-Gemini ואת הוראות המערכת - מחוץ לדפדפן. */
function proxyFile(systemPrompt: string): string {
  return `/*!
 * ChatAssistant server function · Generated by WEblok
 *
 * התקנה (Vercel): שמרו את הקובץ כ-api/chat.js בשורש הפרויקט, והוסיפו משתנה סביבה
 * GEMINI_API_KEY (Project Settings → Environment Variables). המפתח וההוראות נשארים
 * כאן, בצד שרת - הם לא מופיעים בקוד שנטען בדפדפן.
 * אופציונלי: CHAT_ALLOWED_ORIGIN=https://your-site.com כשהצ'אט באתר אחר מהפונקציה.
 * מומלץ להפעיל הגבלת קצב (Vercel Firewall) כדי שאף אחד לא ינצל את המפתח שלכם.
 */
const SYSTEM_PROMPT = ${JSON.stringify(systemPrompt.slice(0, 4000))};
const MODEL = "gemini-2.5-flash";

export default async function handler(req, res) {
  const origin = process.env.CHAT_ALLOWED_ORIGIN;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: "missing_key" });

  let body = req.body || {};
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const message = String(body.message || "").trim().slice(0, 2000);
  if (!message) return res.status(400).json({ error: "empty" });

  const history = (Array.isArray(body.history) ? body.history : [])
    .filter((h) => h && (h.role === "user" || h.role === "model") && typeof h.text === "string")
    .slice(-10)
    .map((h) => ({ role: h.role, parts: [{ text: h.text.slice(0, 2000) }] }));

  try {
    const r = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/\${MODEL}:generateContent\`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [...history, { role: "user", parts: [{ text: message }] }],
      }),
    });
    if (!r.ok) return res.status(502).json({ error: "ai_failed" });
    const data = await r.json();
    const reply = (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("").trim();
    return res.status(200).json({ reply });
  } catch {
    return res.status(502).json({ error: "ai_failed" });
  }
}
`;
}

/** תאימות ל-BlockDefinition.generate */
export function generate(values: BlockValues): string {
  return toUnifiedHtml(toOutput(values));
}
