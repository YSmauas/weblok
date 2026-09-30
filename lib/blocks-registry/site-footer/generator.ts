import type { BlockValues } from "../types";
import type { BlockOutput } from "../export-types";
import { toUnifiedHtml } from "../export";
import { fields } from "./config.schema";
import { EASE, ICON, clip, designCss, esc, fontImport, makePick, parseLinks, sanitizeDesign, socialIcon } from "../_shared/util";
import type { LinkItem } from "../_shared/util";

const pick = makePick(fields);

const list = (cls: string, items: LinkItem[]) =>
  `<ul class="${cls}">${items.map((l) => `<li><a href="${esc(l.url)}">${esc(l.label)}</a></li>`).join("")}</ul>`;

export function toOutput(raw: BlockValues): BlockOutput {
  const d = sanitizeDesign(raw);
  const layout = pick(raw, "footerLayout");
  const columns = layout === "columns";
  const split = layout === "split";
  const iconsMode = pick(raw, "socialStyle") === "icons";
  const decor = pick(raw, "footerDecor");
  const toTop = pick(raw, "backToTop") === "yes";
  const brand = clip(raw.brandText, 60) || "האתר שלי";
  const tagline = clip(raw.tagline, 200);
  const col1 = parseLinks(raw.col1Links, 8);
  const col2 = columns ? parseLinks(raw.col2Links, 8) : [];
  const social = parseLinks(raw.socialLinks, 6).filter((l) => /^https?:\/\//i.test(l.url));
  const tpl = clip(raw.copyrightText, 120);
  const hasYear = tpl.includes("{year}");
  const year = String(new Date().getFullYear());

  const socialItem = (l: LinkItem) => {
    const icon = iconsMode ? socialIcon(l.url) : "";
    return icon
      ? `<li><a class="wbf-ico" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(l.label)}" title="${esc(l.label)}">${icon}</a></li>`
      : `<li><a class="wbf-pill" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.label)}</a></li>`;
  };

  const colBlock = (title: string, items: LinkItem[]) =>
    items.length
      ? `\n    <nav class="wbf-col" data-wb-rv aria-label="${esc(title || "קישורים")}">${title ? `<h3>${esc(title)}</h3>` : ""}${list("wbf-links", items)}</nav>`
      : "";

  const html = `<footer class="wbf wbf-l-${layout} wbf-d-${decor}" data-wb-ftr dir="${d.dir}">
  <div class="wbf-inner">
    <div class="wbf-about" data-wb-rv>
      <strong class="wbf-brand">${esc(brand)}</strong>${tagline ? `\n      <p>${esc(tagline)}</p>` : ""}${
        social.length ? `\n      <ul class="wbf-social">${social.map(socialItem).join("")}</ul>` : ""
      }
    </div>${
      columns
        ? colBlock(clip(raw.col1Title, 40), col1) + colBlock(clip(raw.col2Title, 40), col2)
        : col1.length
          ? `\n    <nav class="wbf-col" data-wb-rv aria-label="קישורים">${list("wbf-links wbf-inline", col1)}</nav>`
          : ""
    }
  </div>${
    tpl || toTop
      ? `\n  <div class="wbf-bottom">${tpl ? `<small${hasYear ? ` data-wb-copy="${esc(tpl)}"` : ""}>${esc(tpl.split("{year}").join(year))}</small>` : "<span></span>"}${
          toTop ? `<button class="wbf-top" type="button" data-wb-top aria-label="חזרה לראש העמוד">${ICON.arrowUp}</button>` : ""
        }</div>`
      : ""
  }
</footer>`;

  const cols = columns ? (col1.length ? 1 : 0) + (col2.length ? 1 : 0) : 0;
  const grid = columns && cols > 0 ? `minmax(220px, 1.6fr) ${"minmax(140px, 1fr) ".repeat(cols).trim()}` : "1fr";
  const centered = layout === "simple";

  const { css: vars } = designCss(".wbf", d);
  const css = `${fontImport(d)}
${vars}
.wbf { position: relative; width: 100%; background: var(--wb-bg); border-top: 1px solid var(--wb-border); }
.wbf-d-line::before { content: ""; position: absolute; top: -1px; inset-inline: 0; height: 2px; background: linear-gradient(90deg, transparent, var(--wb-accent), transparent); }
.wbf-d-glow::before { content: ""; position: absolute; top: 0; left: 50%; width: min(720px, 90%); height: 120px; transform: translateX(-50%); background: radial-gradient(closest-side, color-mix(in srgb, var(--wb-accent) 22%, transparent), transparent); pointer-events: none; }
.wbf-inner { position: relative; max-width: 1200px; margin: 0 auto; padding: 44px 20px 26px; display: grid; grid-template-columns: ${grid}; gap: 32px; ${centered ? "text-align: center; justify-items: center;" : ""} }
.wbf-l-split .wbf-inner { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 20px 40px; padding-block: 32px 22px; }
.wbf-brand { font-size: 1.2rem; font-weight: 800; }
.wbf-about p { margin: 8px 0 0; font-size: .92rem; line-height: 1.6; opacity: .85; max-width: 46ch; ${centered ? "margin-inline: auto;" : ""} }
.wbf-col h3 { margin: 0 0 12px; font-size: .95rem; font-weight: 800; }
.wbf-links, .wbf-social { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.wbf-inline, .wbf-social { flex-direction: row; flex-wrap: wrap; gap: 8px 18px; ${centered ? "justify-content: center;" : ""} }
.wbf-social { margin-top: 16px; gap: 8px; }
.wbf a { color: var(--wb-text); text-decoration: none; font-size: .92rem; opacity: .85; transition: color .15s, opacity .15s, transform .2s ${EASE.out}, background-color .2s, border-color .2s; }
.wbf-links a:hover, .wbf-links a:focus-visible { color: var(--wb-accent); opacity: 1; text-decoration: underline; text-underline-offset: 4px; outline: none; }
.wbf-pill { display: inline-block; padding: 5px 12px; border: 1px solid var(--wb-border); border-radius: 999px; font-size: .82rem !important; }
.wbf-ico { width: 38px; height: 38px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--wb-border); border-radius: 50%; }
.wbf-pill:hover, .wbf-pill:focus-visible, .wbf-ico:hover, .wbf-ico:focus-visible { color: #fff; background: var(--wb-accent); border-color: var(--wb-accent); opacity: 1; transform: translateY(-2px); outline: none; }
.wbf-bottom { position: relative; max-width: 1200px; margin: 0 auto; border-top: 1px solid var(--wb-border); padding: 14px 20px; display: flex; align-items: center; justify-content: ${centered ? "center" : "space-between"}; gap: 12px; font-size: .82rem; }
.wbf-bottom small { opacity: .72; font-size: inherit; }
.wbf-top { width: 38px; height: 38px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; background: transparent; color: var(--wb-text); border: 1px solid var(--wb-border); border-radius: 50%; cursor: pointer; transition: transform .2s ${EASE.out}, color .2s, border-color .2s; }
.wbf-top:hover, .wbf-top:focus-visible { color: var(--wb-accent); border-color: var(--wb-accent); transform: translateY(-3px); outline: none; }
.wbf-js [data-wb-rv] { opacity: 0; transform: translateY(14px); transition: opacity .6s ${EASE.out}, transform .6s ${EASE.out}; }
.wbf-js.wbf-in [data-wb-rv] { opacity: 1; transform: none; }
.wbf-js.wbf-in [data-wb-rv]:nth-child(2) { transition-delay: .08s; }
.wbf-js.wbf-in [data-wb-rv]:nth-child(3) { transition-delay: .16s; }
@media (max-width: 768px) { .wbf-inner { grid-template-columns: 1fr; gap: 24px; } .wbf-l-split .wbf-inner { flex-direction: column; align-items: flex-start; } }`;

  const js = `(function () {
  document.querySelectorAll('[data-wb-ftr]').forEach(function (root) {
    if (root.getAttribute('data-wb-init')) return;
    root.setAttribute('data-wb-init', '1');
    var el = root.querySelector('[data-wb-copy]');
    if (el) el.textContent = el.getAttribute('data-wb-copy').split('{year}').join(String(new Date().getFullYear()));
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var top = root.querySelector('[data-wb-top]');
    if (top) top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
    if (!reduce && 'IntersectionObserver' in window) {
      root.classList.add('wbf-js');
      var io = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { root.classList.add('wbf-in'); io.disconnect(); }
      }, { threshold: 0.15 });
      io.observe(root);
    }
  });
})();`;

  return { html, css, js, componentName: "SiteFooter" };
}

export function generate(values: BlockValues): string {
  return toUnifiedHtml(toOutput(values));
}
