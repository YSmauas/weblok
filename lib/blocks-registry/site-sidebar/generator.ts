import type { BlockValues } from "../types";
import type { BlockOutput } from "../export-types";
import { toUnifiedHtml } from "../export";
import { fields } from "./config.schema";
import { ICON, TRAP_JS, clip, designCss, esc, fontImport, makePick, parseLinks, safeLink, sanitizeDesign } from "../_shared/util";

const pick = makePick(fields);
const WIDTHS: Record<string, number> = { narrow: 280, medium: 340, wide: 420 };

export function toOutput(raw: BlockValues): BlockOutput {
  const d = sanitizeDesign(raw);
  const side = pick(raw, "drawerSide") === "left" ? "left" : "right";
  const style = pick(raw, "triggerStyle");
  const width = WIDTHS[pick(raw, "drawerWidth")] ?? 340;
  const title = clip(raw.drawerTitle, 60) || "תפריט";
  const label = clip(raw.triggerLabel, 60) || "פתיחת תפריט";
  const links = parseLinks(raw.navLinks, 10);
  const ctaText = clip(raw.ctaText, 40);
  const ctaUrl = safeLink(raw.ctaUrl);
  const note = clip(raw.noteText, 240);
  const off = side === "left" ? "-100%" : "100%";

  const html = `<div class="wbd" data-wb-drw dir="${d.dir}">
  <button class="wbd-trigger" type="button" aria-label="${esc(label)}" aria-haspopup="dialog" aria-expanded="false" data-wb-drw-open>${ICON.menu}</button>
  <div class="wbd-overlay" data-wb-drw-overlay></div>
  <aside class="wbd-panel" role="dialog" aria-modal="true" aria-label="${esc(title)}" aria-hidden="true" tabindex="-1" data-wb-drw-panel>
    <div class="wbd-head">
      <h2>${esc(title)}</h2>
      <button class="wbd-close" type="button" aria-label="סגירה" data-wb-drw-close>${ICON.close}</button>
    </div>
    <nav class="wbd-body" aria-label="${esc(title)}">
      <ul>${links.map((l) => `<li><a href="${esc(l.url)}">${esc(l.label)}</a></li>`).join("")}</ul>${
        ctaText && ctaUrl ? `\n      <a class="wbd-cta" href="${esc(ctaUrl)}">${esc(ctaText)}</a>` : ""
      }
    </nav>${note ? `\n    <p class="wbd-note">${esc(note)}</p>` : ""}
  </aside>
</div>`;

  const triggerPos =
    style === "edge-tab"
      ? `top: 50%; ${side}: 0; width: 36px; height: 64px; margin-top: -32px; border-radius: ${side === "left" ? "0 12px 12px 0" : "12px 0 0 12px"};`
      : `${style === "button-bottom" ? "bottom: max(16px, env(safe-area-inset-bottom));" : "top: max(16px, env(safe-area-inset-top));"} ${side}: 16px; width: 48px; height: 48px; border-radius: 50%;`;

  const { css: vars } = designCss(".wbd", d);
  const css = `${fontImport(d)}
${vars}
.wbd-trigger { position: fixed; ${triggerPos} z-index: 9998; display: flex; align-items: center; justify-content: center; background: var(--wb-accent); color: #fff; border: none; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,.3); transition: transform .2s; }
.wbd-trigger:hover, .wbd-trigger:focus-visible { transform: scale(1.06); outline: 2px solid #fff; outline-offset: 2px; }
.wbd-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,.55); opacity: 0; pointer-events: none; transition: opacity .3s; }
.wbd-open .wbd-overlay { opacity: 1; pointer-events: auto; }
.wbd-panel { position: fixed; top: 0; bottom: 0; ${side}: 0; z-index: 10000; width: min(${width}px, 88vw); height: 100dvh; display: flex; flex-direction: column; background: var(--wb-bg); color: var(--wb-text); border-${side === "left" ? "right" : "left"}: 1px solid var(--wb-border); box-shadow: 0 0 40px rgba(0,0,0,.4); transform: translateX(${off}); visibility: hidden; transition: transform .3s ease, visibility 0s linear .3s; outline: none; overflow-y: auto; }
.wbd-open .wbd-panel { transform: translateX(0); visibility: visible; transition-delay: 0s; }
.wbd-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 18px 20px; border-bottom: 1px solid var(--wb-border); }
.wbd-head h2 { margin: 0; font-size: 1.15rem; font-weight: 800; }
.wbd-close { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: transparent; color: var(--wb-text); border: 1px solid var(--wb-border); border-radius: 50%; cursor: pointer; }
.wbd-close:hover, .wbd-close:focus-visible { border-color: var(--wb-accent); color: var(--wb-accent); outline: none; }
.wbd-body { padding: 14px 12px; flex: 1; }
.wbd-body ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
.wbd-body li a { display: block; padding: 12px 14px; border-radius: 10px; color: var(--wb-text); text-decoration: none; font-weight: 600; transition: .15s; }
.wbd-body li a:hover, .wbd-body li a:focus-visible { background: color-mix(in srgb, var(--wb-accent) 18%, transparent); color: var(--wb-accent); outline: none; }
.wbd-cta { display: block; margin: 16px 8px 0; padding: 12px; text-align: center; background: var(--wb-accent); color: #fff; border-radius: 10px; text-decoration: none; font-weight: 700; }
.wbd-cta:hover, .wbd-cta:focus-visible { filter: brightness(1.1); outline: none; }
.wbd-note { margin: 0; padding: 14px 20px max(14px, env(safe-area-inset-bottom)); border-top: 1px solid var(--wb-border); font-size: .85rem; line-height: 1.5; opacity: .8; white-space: pre-line; }`;

  const js = `(function () {
  ${TRAP_JS}
  document.querySelectorAll('[data-wb-drw]').forEach(function (root) {
    if (root.getAttribute('data-wb-init')) return;
    root.setAttribute('data-wb-init', '1');
    var openBtn = root.querySelector('[data-wb-drw-open]');
    var closeBtn = root.querySelector('[data-wb-drw-close]');
    var overlay = root.querySelector('[data-wb-drw-overlay]');
    var panel = root.querySelector('[data-wb-drw-panel]');
    var prevOverflow = '';
    function set(open) {
      root.classList.toggle('wbd-open', open);
      panel.setAttribute('aria-hidden', open ? 'false' : 'true');
      openBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        prevOverflow = document.documentElement.style.overflow;
        document.documentElement.style.overflow = 'hidden';
        closeBtn.focus();
      } else {
        document.documentElement.style.overflow = prevOverflow;
        openBtn.focus();
      }
    }
    openBtn.addEventListener('click', function () { set(true); });
    closeBtn.addEventListener('click', function () { set(false); });
    overlay.addEventListener('click', function () { set(false); });
    panel.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { set(false); }); });
    document.addEventListener('keydown', function (e) {
      if (!root.classList.contains('wbd-open')) return;
      if (e.key === 'Escape') set(false);
      else wbTrap(e, panel);
    });
  });
})();`;

  return { html, css, js, componentName: "SiteSidebar" };
}

export function generate(values: BlockValues): string {
  return toUnifiedHtml(toOutput(values));
}
