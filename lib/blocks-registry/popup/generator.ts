import type { BlockValues } from "../types";
import type { BlockOutput } from "../export-types";
import { toUnifiedHtml } from "../export";
import { fields } from "./config.schema";
import { TRAP_JS, ICON, clip, designCss, esc, fontImport, hashKey, makePick, safeLink, sanitizeDesign } from "../_shared/util";

const pick = makePick(fields);

export function toOutput(raw: BlockValues): BlockOutput {
  const d = sanitizeDesign(raw);
  const type = pick(raw, "popupType");
  const isCookie = type === "cookie";
  const isExit = type === "exit-intent";
  const isMsg = type === "message";
  const layout = isCookie ? pick(raw, "cookieLayout") : pick(raw, "layout");
  const trigger = isExit ? "exit" : isCookie ? "immediate" : pick(raw, "trigger");
  const freq = isCookie ? "once" : pick(raw, "frequency");
  const side = pick(raw, "cornerSide") === "left" ? "left" : "right";
  const modal = layout === "modal";

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
  const key = isCookie ? "wbp-cookie" : `wbp-${hashKey(type + "|" + title)}`;

  const code = clip(raw.promoCode, 30).replace(/[<>"'&\\\s]/g, "");
  const ctaText = clip(raw.ctaText, 40);
  const ctaUrl = safeLink(raw.ctaUrl);
  const policyUrl = safeLink(raw.policyUrl);
  const policyText = clip(raw.policyText, 40);

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

  const html = `<div class="wbp" data-wb-pop data-wb-key="${key}" data-wb-type="${type}" data-wb-trigger="${trigger}" data-wb-freq="${freq}" dir="${d.dir}">${
    modal ? `\n  <div class="wbp-overlay" data-wb-overlay></div>` : ""
  }
  <div class="wbp-card wbp-l-${layout}" role="dialog" aria-modal="${modal ? "true" : "false"}" aria-label="${esc(title || "חלון")}" tabindex="-1" data-wb-card>${
    isCookie ? "" : `\n    <button class="wbp-x" type="button" aria-label="סגירה" data-wb-close>${ICON.close}</button>`
  }
    <div class="wbp-text">${title ? `\n      <h2 class="wbp-title">${esc(title)}</h2>` : ""}${body ? `\n      <p class="wbp-body">${esc(body)}</p>` : ""}${extra}
    </div>${actions ? `\n    <div class="wbp-actions">\n      ${actions}\n    </div>` : ""}
  </div>
</div>`;

  const { css: vars, panelCss } = designCss(".wbp", d);
  const css = `${fontImport(d)}
${vars}
.wbp-overlay { position: fixed; inset: 0; z-index: 99998; background: rgba(0,0,0,.55); opacity: 0; pointer-events: none; transition: opacity .25s; }
.wbp-open .wbp-overlay { opacity: 1; pointer-events: auto; }
.wbp-card { position: fixed; z-index: 99999; padding: 24px; background: var(--wb-bg); border: 1px solid var(--wb-border); color: var(--wb-text); max-height: calc(100dvh - 24px); overflow: auto; outline: none; opacity: 0; visibility: hidden; pointer-events: none; transition: opacity .25s, transform .25s, visibility 0s linear .25s; ${panelCss} }
.wbp-open .wbp-card { opacity: 1; visibility: visible; pointer-events: auto; transition-delay: 0s; }
.wbp-l-modal { top: 50%; left: 50%; width: min(440px, calc(100vw - 32px)); transform: translate(-50%, -46%) scale(.97); }
.wbp-open .wbp-l-modal { transform: translate(-50%, -50%) scale(1); }
.wbp-l-corner { bottom: max(16px, env(safe-area-inset-bottom)); ${side}: 16px; width: min(360px, calc(100vw - 32px)); transform: translateY(16px); }
.wbp-open .wbp-l-corner { transform: none; }
.wbp-l-bar { left: 0; right: 0; bottom: 0; width: auto; padding: 16px 20px max(16px, env(safe-area-inset-bottom)); border-radius: 0 !important; border-inline: 0; transform: translateY(100%); display: flex; align-items: center; flex-wrap: wrap; gap: 14px 24px; }
.wbp-open .wbp-l-bar { transform: none; }
.wbp-l-bar .wbp-text { flex: 1 1 320px; }
.wbp-title { margin: 0 0 8px; padding-inline-end: 28px; font-size: 1.2rem; font-weight: 800; line-height: 1.3; }
.wbp-l-bar .wbp-title { padding-inline-end: 0; margin-bottom: 4px; font-size: 1rem; }
.wbp-body { margin: 0; font-size: .93rem; line-height: 1.55; opacity: .9; white-space: pre-line; }
.wbp-link { display: inline-block; margin-top: 8px; color: var(--wb-accent); font-size: .85rem; }
.wbp-code { display: inline-flex; align-items: center; gap: 10px; margin-top: 14px; padding: 6px 6px 6px 14px; border: 2px dashed var(--wb-accent); border-radius: 10px; }
.wbp-code code { font-family: ui-monospace, monospace; font-weight: 800; letter-spacing: .06em; }
.wbp-copy { padding: 6px 12px; background: var(--wb-accent); color: #fff; border: none; border-radius: 8px; font: inherit; font-size: .8rem; font-weight: 700; cursor: pointer; }
.wbp-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; }
.wbp-l-bar .wbp-actions { margin-top: 0; }
.wbp-btn { display: inline-flex; align-items: center; justify-content: center; padding: 11px 20px; background: var(--wb-accent); color: #fff; border: 1px solid transparent; border-radius: 10px; font: inherit; font-size: .93rem; font-weight: 700; text-decoration: none; cursor: pointer; }
.wbp-btn-ghost { background: transparent; color: var(--wb-text); border-color: var(--wb-border); }
.wbp-btn:hover, .wbp-btn:focus-visible, .wbp-copy:hover, .wbp-copy:focus-visible { filter: brightness(1.1); outline: none; }
.wbp-x { position: absolute; top: 10px; inset-inline-end: 10px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: transparent; color: var(--wb-text); border: none; border-radius: 50%; cursor: pointer; opacity: .8; }
.wbp-x:hover, .wbp-x:focus-visible { background: rgba(128,128,128,.25); opacity: 1; outline: none; }
@media (max-width: 480px) { .wbp-actions .wbp-btn { flex: 1 1 auto; } }`;

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
    var shown = false, lastFocus = null;

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
    function show() {
      if (shown || seen()) return;
      shown = true;
      lastFocus = document.activeElement;
      root.classList.add('wbp-open');
      if (type !== 'cookie') { mark(); try { card.focus({ preventScroll: true }); } catch (e) {} }
    }
    function hide() {
      root.classList.remove('wbp-open');
      if (lastFocus && lastFocus.focus) { try { lastFocus.focus({ preventScroll: true }); } catch (e) {} }
    }
    function choose(choice) {
      mark(choice);
      try { document.dispatchEvent(new CustomEvent('weblok:consent', { detail: { choice: choice } })); } catch (e) {}
      hide();
    }

    root.querySelectorAll('[data-wb-close]').forEach(function (b) { b.addEventListener('click', hide); });
    if (overlay) overlay.addEventListener('click', hide);
    var acc = root.querySelector('[data-wb-accept]');
    var dec = root.querySelector('[data-wb-decline]');
    if (acc) acc.addEventListener('click', function () { choose('accepted'); });
    if (dec) dec.addEventListener('click', function () { choose('declined'); });
    var cp = root.querySelector('[data-wb-copy]');
    if (cp) cp.addEventListener('click', function () {
      var done = function () { cp.textContent = 'הועתק!'; setTimeout(function () { cp.textContent = 'העתק'; }, 1800); };
      try { navigator.clipboard.writeText(cp.getAttribute('data-code')).then(done, function () {}); } catch (e) {}
    });
    document.addEventListener('keydown', function (e) {
      if (!root.classList.contains('wbp-open')) return;
      if (e.key === 'Escape' && type !== 'cookie') hide();
      else if (overlay) wbTrap(e, card);
    });

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
