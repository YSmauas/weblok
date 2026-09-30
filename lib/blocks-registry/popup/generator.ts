import type { BlockValues } from "../types";
import type { BlockOutput } from "../export-types";
import { toUnifiedHtml } from "../export";
import { fields } from "./config.schema";
import {
  EASE,
  TRAP_JS,
  ICON,
  animKeyframes,
  clip,
  designCss,
  esc,
  fontImport,
  hashKey,
  makePick,
  safeLink,
  sanitizeDesign,
} from "../_shared/util";

const pick = makePick(fields);

/**
 * חוזה ההסכמה לעוגיות - אסור לשבור (אתרים קיימים ומדריך העוגיות נשענים עליו):
 * - localStorage["wbp-cookie"] = "accepted" | "declined"
 * - document.dispatchEvent(new CustomEvent("weblok:consent", { detail: { choice } }))
 */
export const CONSENT_STORAGE_KEY = "wbp-cookie";
export const CONSENT_EVENT = "weblok:consent";

type Layout = "modal" | "sheet" | "corner" | "bubble" | "fullscreen" | "bar";

/** עמדת הבסיס (transform) של כל צורה - האפקט מתווסף מעליה. */
const POS: Record<Layout, string> = {
  modal: "translate(-50%, -50%)",
  bubble: "translate(-50%, -50%)",
  sheet: "translateX(-50%)",
  corner: "translate(0, 0)",
  fullscreen: "translate(0, 0)",
  bar: "translate(0, 0)",
};

/** מצב ההתחלה של אפקט הכניסה (לפני פתיחה) לכל צורה. */
function effectFrom(effect: string, layout: Layout, side: "left" | "right"): { from: string; filter: string } {
  const edge = layout === "sheet" || layout === "bar" ? "translateY(100%)" : layout === "corner" ? `translateX(${side === "left" ? "-" : ""}115%)` : "translateY(48px)";
  switch (effect) {
    case "fade":
      return { from: "scale(1)", filter: "none" };
    case "zoom":
      return { from: "scale(.86)", filter: "none" };
    case "slide":
      return { from: edge, filter: "none" };
    case "blur":
      return { from: "scale(1.04)", filter: "blur(14px)" };
    default: // spring
      return { from: layout === "sheet" || layout === "bar" ? "translateY(100%)" : "scale(.62)", filter: "none" };
  }
}

export function toOutput(raw: BlockValues): BlockOutput {
  const d = sanitizeDesign(raw);
  const type = pick(raw, "popupType");
  const isCookie = type === "cookie";
  const isExit = type === "exit-intent";
  const isMsg = type === "message";
  const layout = (isCookie ? pick(raw, "cookieLayout") : pick(raw, "layout")) as Layout;
  const trigger = isExit ? "exit" : isCookie ? "immediate" : pick(raw, "trigger");
  const freq = isCookie ? "once" : pick(raw, "frequency");
  const side = pick(raw, "cornerSide") === "left" ? "left" : "right";
  const effect = pick(raw, "entryEffect");
  const backdrop = layout === "corner" || layout === "bar" ? "none" : pick(raw, "backdrop");
  const launcher = isCookie ? "none" : pick(raw, "launcher");
  const reopen = isCookie && pick(raw, "cookieReopen") === "yes";
  // בלי כפתור השקה, "רק בלחיצה" לא יפתח לעולם - חוזרים לברירת המחדל
  const trig = trigger === "manual" && launcher === "none" ? "delay5" : trigger;
  const modal = backdrop !== "none" || layout === "fullscreen";

  let title: string;
  let body: string;
  if (isCookie) {
    title = clip(raw.cookieTitle, 80);
    body = clip(raw.cookieBody, 300);
  } else if (isMsg) {
    title = clip(raw.msgTitle, 80);
    body = clip(raw.msgBody, 400);
  } else {
    title = clip(raw.promoTitle, 80);
    body = clip(raw.promoBody, 300);
  }

  // מפתח אחסון: בעוגיות קבוע (עריכת טקסט לא מאפסת הסכמה); בשאר - תלוי בסוג ובכותרת (קידום חדש = מוצג מחדש)
  const key = isCookie ? CONSENT_STORAGE_KEY : `wbp-${hashKey(type + "|" + title)}`;

  const code = clip(raw.promoCode, 30).replace(/[<>"'&\\\s]/g, "");
  const ctaText = clip(raw.ctaText, 40);
  const ctaUrl = safeLink(raw.ctaUrl);
  const policyUrl = safeLink(raw.policyUrl);
  const policyText = clip(raw.policyText, 40);
  const launcherText = clip(raw.launcherText, 40);
  const reopenLabel = clip(raw.reopenLabel, 60) || "הגדרות עוגיות";

  let actions: string;
  let extra = "";
  if (isCookie) {
    actions = `<button class="wbp-btn wbp-btn-ghost" type="button" data-wb-decline>${esc(clip(raw.declineText, 30) || "דחייה")}</button>
      <button class="wbp-btn" type="button" data-wb-accept>${esc(clip(raw.acceptText, 30) || "אישור")}</button>`;
    if (policyUrl && policyText) extra = `\n      <a class="wbp-link" href="${esc(policyUrl)}">${esc(policyText)}</a>`;
  } else if (isMsg) {
    actions = `<button class="wbp-btn" type="button" data-wb-close>${esc(clip(raw.msgBtnText, 30) || "הבנתי")}</button>`;
  } else {
    actions = ctaText && ctaUrl ? `<a class="wbp-btn" href="${esc(ctaUrl)}" data-wb-close>${esc(ctaText)}</a>` : "";
    if (code)
      extra = `\n      <div class="wbp-code"><code>${esc(code)}</code><button class="wbp-copy" type="button" data-wb-copy data-code="${esc(code)}">העתק</button></div>`;
  }

  const launcherIcon = isMsg ? ICON.bell : ICON.gift;
  const launcherHtml =
    launcher !== "none"
      ? `\n  <button class="wbp-launch wbp-launch-${launcher}${launcherText ? "" : " wbp-launch-round"}" type="button" aria-haspopup="dialog" ${
          launcherText ? "" : `aria-label="${esc(title || "פתיחה")}" `
        }data-wb-launch>${launcherIcon}${launcherText ? `<span>${esc(launcherText)}</span>` : ""}</button>`
      : "";
  const reopenHtml = reopen
    ? `\n  <button class="wbp-launch wbp-launch-round wbp-reopen" type="button" aria-label="${esc(reopenLabel)}" title="${esc(reopenLabel)}" data-wb-reopen hidden>${ICON.cookie}</button>`
    : "";

  const html = `<div class="wbp" data-wb-pop data-wb-key="${key}" data-wb-type="${type}" data-wb-trigger="${trig}" data-wb-freq="${freq}" dir="${d.dir}">${
    backdrop !== "none" ? `\n  <div class="wbp-overlay wbp-bd-${backdrop}" data-wb-overlay></div>` : ""
  }
  <div class="wbp-card wbp-l-${layout}" role="dialog" aria-modal="${modal ? "true" : "false"}" aria-label="${esc(title || "חלון")}" tabindex="-1" data-wb-card>${
    layout === "bubble" ? `\n    <span class="wbp-ring" aria-hidden="true"></span>` : ""
  }${isCookie ? "" : `\n    <button class="wbp-x" type="button" aria-label="סגירה" data-wb-close>${ICON.close}</button>`}
    <div class="wbp-text">${title ? `\n      <h2 class="wbp-title">${esc(title)}</h2>` : ""}${body ? `\n      <p class="wbp-body">${esc(body)}</p>` : ""}${extra}
    </div>${actions ? `\n    <div class="wbp-actions">\n      ${actions}\n    </div>` : ""}
  </div>${launcherHtml}${reopenHtml}
</div>`;

  const fx = effectFrom(effect, layout, side);
  const spring = effect === "spring";
  const dur = spring ? ".6s" : effect === "slide" ? ".45s" : ".35s";
  const ease = spring ? EASE.spring : EASE.out;
  const other = side === "left" ? "right" : "left";

  const { css: vars, panelCss } = designCss(".wbp", d);
  const css = `${fontImport(d)}
${vars}
${animKeyframes("wbp")}
@keyframes wbp-aura { 0%, 100% { box-shadow: 0 0 28px 2px color-mix(in srgb, var(--wb-accent) 45%, transparent), 0 20px 60px rgba(0,0,0,.35); } 50% { box-shadow: 0 0 64px 14px color-mix(in srgb, var(--wb-accent) 70%, transparent), 0 20px 60px rgba(0,0,0,.35); } }
.wbp-overlay { position: fixed; inset: 0; z-index: 99998; opacity: 0; pointer-events: none; transition: opacity .3s ${EASE.out}; }
.wbp-bd-dim { background: rgba(0,0,0,.55); }
.wbp-bd-blur { background: rgba(10,12,20,.35); -webkit-backdrop-filter: blur(8px) saturate(1.2); backdrop-filter: blur(8px) saturate(1.2); }
.wbp-open .wbp-overlay { opacity: 1; pointer-events: auto; }
.wbp-card { --wbp-pos: ${POS[layout]}; position: fixed; z-index: 99999; padding: 24px; background: var(--wb-bg); border: 1px solid var(--wb-border); color: var(--wb-text); max-height: calc(100dvh - 24px); overflow: auto; outline: none; opacity: 0; visibility: hidden; pointer-events: none; transform: var(--wbp-pos) ${fx.from}; filter: ${fx.filter}; transition: opacity ${dur} ${EASE.out}, transform ${dur} ${ease}, filter ${dur} ${EASE.out}, visibility 0s linear ${dur}; ${panelCss} }
.wbp-open .wbp-card { opacity: 1; visibility: visible; pointer-events: auto; transform: var(--wbp-pos); filter: none; transition-delay: 0s; }
.wbp-l-modal { top: 50%; left: 50%; width: min(440px, calc(100vw - 32px)); }
.wbp-l-corner { bottom: max(16px, env(safe-area-inset-bottom)); ${side}: 16px; width: min(360px, calc(100vw - 32px)); }
.wbp-l-sheet { left: 50%; bottom: 0; width: min(560px, 100vw); max-height: 85dvh; padding-bottom: max(24px, env(safe-area-inset-bottom)); border-bottom-left-radius: 0 !important; border-bottom-right-radius: 0 !important; border-bottom: 0; }
.wbp-l-sheet::before { content: ""; display: block; width: 44px; height: 5px; margin: -10px auto 14px; border-radius: 99px; background: currentColor; opacity: .25; }
.wbp-l-bar { left: 0; right: 0; bottom: 0; width: auto; padding: 16px 20px max(16px, env(safe-area-inset-bottom)); border-radius: 0 !important; border-inline: 0; display: flex; align-items: center; flex-wrap: wrap; gap: 14px 24px; }
.wbp-l-bar .wbp-text { flex: 1 1 320px; }
.wbp-l-fullscreen { inset: 0; max-height: none; border-radius: 0 !important; border: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: max(32px, env(safe-area-inset-top)) 24px max(32px, env(safe-area-inset-bottom)); }
.wbp-l-fullscreen .wbp-text { max-width: 640px; }
.wbp-l-fullscreen .wbp-title { font-size: clamp(1.8rem, 6vw, 3rem); padding-inline-end: 0; }
.wbp-l-fullscreen .wbp-body { font-size: clamp(1rem, 2.6vw, 1.2rem); }
.wbp-l-fullscreen .wbp-actions, .wbp-l-bubble .wbp-actions { justify-content: center; }
.wbp-l-fullscreen .wbp-x { top: max(16px, env(safe-area-inset-top)); inset-inline-end: 16px; width: 44px; height: 44px; }
.wbp-l-bubble { top: 50%; left: 50%; width: min(360px, calc(100vw - 48px)); aspect-ratio: 1; max-height: none; overflow: visible; border-radius: 50% !important; padding: 13%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; animation: wbp-aura 3.2s ease-in-out infinite; }
.wbp-l-bubble .wbp-title { padding-inline-end: 0; font-size: 1.25rem; }
.wbp-l-bubble .wbp-body { display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
.wbp-l-bubble .wbp-x { top: 5%; inset-inline-end: auto; left: 50%; transform: translateX(-50%); }
.wbp-ring { position: absolute; inset: -10px; border-radius: 50%; z-index: -1; pointer-events: none; background: conic-gradient(from 0deg, var(--wb-accent), transparent 30%, var(--wb-accent) 55%, transparent 80%, var(--wb-accent)); -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px)); mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px)); animation: wbp-spin 6s linear infinite; opacity: .9; }
.wbp-title { margin: 0 0 8px; padding-inline-end: 28px; font-size: 1.2rem; font-weight: 800; line-height: 1.3; }
.wbp-l-bar .wbp-title { padding-inline-end: 0; margin-bottom: 4px; font-size: 1rem; }
.wbp-body { margin: 0; font-size: .93rem; line-height: 1.55; opacity: .9; white-space: pre-line; }
.wbp-link { display: inline-block; margin-top: 8px; color: var(--wb-accent); font-size: .85rem; }
.wbp-code { display: inline-flex; align-items: center; gap: 10px; margin-top: 14px; padding-block: 6px; padding-inline: 14px 6px; border: 2px dashed var(--wb-accent); border-radius: 10px; }
.wbp-code code { font-family: ui-monospace, monospace; font-weight: 800; letter-spacing: .06em; }
.wbp-copy { padding: 6px 12px; background: var(--wb-accent); color: #fff; border: none; border-radius: 8px; font: inherit; font-size: .8rem; font-weight: 700; cursor: pointer; }
.wbp-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; }
.wbp-l-bar .wbp-actions { margin-top: 0; }
.wbp-btn { display: inline-flex; align-items: center; justify-content: center; padding: 11px 20px; background: var(--wb-accent); color: #fff; border: 1px solid transparent; border-radius: 10px; font: inherit; font-size: .93rem; font-weight: 700; text-decoration: none; cursor: pointer; transition: transform .15s ${EASE.out}, filter .15s; }
.wbp-btn-ghost { background: transparent; color: var(--wb-text); border-color: var(--wb-border); }
.wbp-btn:hover, .wbp-btn:focus-visible, .wbp-copy:hover, .wbp-copy:focus-visible { filter: brightness(1.1); outline: none; }
.wbp-btn:focus-visible, .wbp-copy:focus-visible, .wbp-launch:focus-visible { box-shadow: 0 0 0 3px color-mix(in srgb, var(--wb-accent) 45%, transparent); }
.wbp-btn:active { transform: scale(.97); }
.wbp-x { position: absolute; top: 10px; inset-inline-end: 10px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: transparent; color: var(--wb-text); border: none; border-radius: 50%; cursor: pointer; opacity: .8; }
.wbp-x:hover, .wbp-x:focus-visible { background: rgba(128,128,128,.25); opacity: 1; outline: none; }
.wbp-launch { position: fixed; bottom: max(16px, env(safe-area-inset-bottom)); ${side}: 16px; ${other}: auto; z-index: 99997; display: inline-flex; align-items: center; gap: 8px; min-height: 48px; padding: 10px 18px; background: var(--wb-accent); color: #fff; border: none; border-radius: 999px; font: inherit; font-weight: 700; font-size: .92rem; cursor: pointer; box-shadow: 0 8px 24px rgba(0,0,0,.28); transition: opacity .3s, transform .3s ${EASE.spring}; }
.wbp-launch-round { width: 52px; height: 52px; padding: 0; justify-content: center; }
.wbp-launch-pulse { animation: wbp-pulse 2.4s ease-in-out infinite; }
.wbp-launch-glow { animation: wbp-halo 2.2s ${EASE.out} infinite; }
.wbp-launch:hover { transform: translateY(-2px) scale(1.03); }
.wbp-open .wbp-launch { opacity: 0; transform: scale(.6); pointer-events: none; animation: none; }
.wbp-launch[hidden] { display: none; }
@media (max-width: 480px) { .wbp-actions .wbp-btn { flex: 1 1 auto; } .wbp-l-bubble { padding: 11%; } .wbp-l-bubble .wbp-body { -webkit-line-clamp: 3; } }`;

  const js = `(function () {
  ${TRAP_JS}
  document.querySelectorAll('[data-wb-pop]').forEach(function (root) {
    if (root.getAttribute('data-wb-init')) return;
    root.setAttribute('data-wb-init', '1');
    var key = root.getAttribute('data-wb-key');
    var freq = root.getAttribute('data-wb-freq');
    var trigger = root.getAttribute('data-wb-trigger');
    var type = root.getAttribute('data-wb-type');
    var card = root.querySelector('[data-wb-card]');
    var overlay = root.querySelector('[data-wb-overlay]');
    var launch = root.querySelector('[data-wb-launch]');
    var reopen = root.querySelector('[data-wb-reopen]');
    var isModal = card.getAttribute('aria-modal') === 'true';
    var shown = false, lastFocus = null, prevOverflow = '';

    function seen() {
      try {
        if (freq === 'always') return false;
        if (freq === 'session') return !!window.sessionStorage.getItem(key);
        var t = window.localStorage.getItem(key);
        if (!t) return false;
        if (freq === 'once') return true;
        return Date.now() - parseInt(t, 10) < (freq === 'day' ? 864e5 : 6048e5);
      } catch (e) { return false; }
    }
    function mark(value) {
      try {
        if (freq === 'always') return;
        if (freq === 'session') window.sessionStorage.setItem(key, '1');
        else window.localStorage.setItem(key, value || String(Date.now()));
      } catch (e) {}
    }
    function open() {
      if (root.classList.contains('wbp-open')) return;
      lastFocus = document.activeElement;
      root.classList.add('wbp-open');
      if (reopen) reopen.hidden = true;
      if (isModal) { prevOverflow = document.documentElement.style.overflow; document.documentElement.style.overflow = 'hidden'; }
      if (type !== 'cookie' || isModal) { try { card.focus({ preventScroll: true }); } catch (e) {} }
    }
    function show() {
      if (shown || seen()) return;
      shown = true;
      if (type !== 'cookie') mark();
      open();
    }
    function hide() {
      if (!root.classList.contains('wbp-open')) return;
      root.classList.remove('wbp-open');
      if (isModal) document.documentElement.style.overflow = prevOverflow;
      if (lastFocus && lastFocus.focus) { try { lastFocus.focus({ preventScroll: true }); } catch (e) {} }
    }
    function choose(choice) {
      mark(choice);
      try { document.dispatchEvent(new CustomEvent('weblok:consent', { detail: { choice: choice } })); } catch (e) {}
      hide();
      if (reopen) reopen.hidden = false;
    }

    root.querySelectorAll('[data-wb-close]').forEach(function (b) { b.addEventListener('click', hide); });
    if (overlay && type !== 'cookie') overlay.addEventListener('click', hide);
    var acc = root.querySelector('[data-wb-accept]');
    var dec = root.querySelector('[data-wb-decline]');
    if (acc) acc.addEventListener('click', function () { choose('accepted'); });
    if (dec) dec.addEventListener('click', function () { choose('declined'); });
    if (launch) launch.addEventListener('click', open);
    if (reopen) {
      reopen.addEventListener('click', open);
      if (seen()) reopen.hidden = false;
    }
    var cp = root.querySelector('[data-wb-copy]');
    if (cp) cp.addEventListener('click', function () {
      var done = function () { cp.textContent = 'הועתק!'; setTimeout(function () { cp.textContent = 'העתק'; }, 1800); };
      try { navigator.clipboard.writeText(cp.getAttribute('data-code')).then(done, function () {}); } catch (e) {}
    });
    document.addEventListener('keydown', function (e) {
      if (!root.classList.contains('wbp-open')) return;
      if (e.key === 'Escape' && type !== 'cookie') hide();
      else if (isModal) wbTrap(e, card);
    });

    if (trigger === 'manual') return;
    if (trigger === 'exit') {
      var ready = false;
      setTimeout(function () { ready = true; }, 2000);
      document.addEventListener('mouseout', function (e) { if (ready && !e.relatedTarget && e.clientY <= 0) show(); });
      if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) setTimeout(show, 25000);
    } else if (trigger === 'scroll50') {
      var onScroll = function () {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        if (max <= 0 || window.pageYOffset / max >= 0.5) { window.removeEventListener('scroll', onScroll); show(); }
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    } else {
      setTimeout(show, trigger === 'delay5' ? 5000 : trigger === 'delay15' ? 15000 : 400);
    }
  });
})();`;

  return { html, css, js, componentName: "Popup" };
}

export function generate(values: BlockValues): string {
  return toUnifiedHtml(toOutput(values));
}
