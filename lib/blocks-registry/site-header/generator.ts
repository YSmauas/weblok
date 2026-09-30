import type { BlockValues } from "../types";
import type { BlockOutput } from "../export-types";
import { toUnifiedHtml } from "../export";
import { fields } from "./config.schema";
import { ICON, clip, designCss, esc, fontImport, makePick, parseLinks, safeAsset, safeLink, sanitizeDesign } from "../_shared/util";

const pick = makePick(fields);

export function toOutput(raw: BlockValues): BlockOutput {
  const d = sanitizeDesign(raw);
  const center = pick(raw, "headerLayout") === "center";
  const sticky = pick(raw, "stickyMode") === "sticky";
  const brand = clip(raw.brandText, 60) || "האתר שלי";
  const brandUrl = safeLink(raw.brandUrl) || "/";
  const logo = safeAsset(raw.logoUrl);
  const links = parseLinks(raw.navLinks, 8);
  const ctaText = clip(raw.ctaText, 40);
  const ctaUrl = safeLink(raw.ctaUrl);

  const html = `<header class="wbh" data-wb-hdr dir="${d.dir}">
  <div class="wbh-bar">
    <a class="wbh-brand" href="${esc(brandUrl)}">${logo ? `<img class="wbh-logo" src="${esc(logo)}" alt="" loading="lazy">` : ""}<span>${esc(brand)}</span></a>
    <button class="wbh-burger" type="button" aria-label="תפריט" aria-expanded="false" data-wb-hdr-burger>${ICON.menu}</button>
    <nav class="wbh-nav" aria-label="ניווט ראשי">
      <ul>${links.map((l) => `<li><a class="wbh-link" href="${esc(l.url)}">${esc(l.label)}</a></li>`).join("")}</ul>${
        ctaText && ctaUrl ? `\n      <a class="wbh-cta" href="${esc(ctaUrl)}">${esc(ctaText)}</a>` : ""
      }
    </nav>
  </div>
</header>`;

  // z-index 1000 לפי הסולם ב-lib/inject/placement.ts: מעל התוכן, מתחת לכפתורים צפים/מגירה/פופאפ
  const { css: vars } = designCss(".wbh", d);
  const css = `${fontImport(d)}
.weblok-site-header { display: contents; }
${vars}
.wbh { position: ${sticky ? "sticky" : "relative"}; top: 0; z-index: 1000; width: 100%; background: var(--wb-bg); border-bottom: 1px solid var(--wb-border); }
.wbh-bar { max-width: 1200px; margin: 0 auto; padding: 12px 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.wbh-brand { display: flex; align-items: center; gap: 10px; min-width: 0; color: var(--wb-text); text-decoration: none; font-weight: 800; font-size: 1.15rem; }
.wbh-brand span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.wbh-logo { height: 36px; width: auto; max-width: 140px; object-fit: contain; }
.wbh-nav { display: flex; align-items: center; gap: 16px; }
.wbh-nav ul { list-style: none; margin: 0; padding: 0; display: flex; align-items: center; gap: 4px; }
.wbh-link { display: block; padding: 8px 12px; border-radius: 8px; color: var(--wb-text); text-decoration: none; font-weight: 600; font-size: .95rem; opacity: .9; transition: .15s; }
.wbh-link:hover, .wbh-link:focus-visible { background: color-mix(in srgb, var(--wb-accent) 18%, transparent); color: var(--wb-accent); opacity: 1; outline: none; }
.wbh-cta { display: inline-block; padding: 9px 18px; border-radius: 10px; background: var(--wb-accent); color: #fff; text-decoration: none; font-weight: 700; font-size: .92rem; white-space: nowrap; }
.wbh-cta:hover, .wbh-cta:focus-visible { filter: brightness(1.1); outline: none; }
.wbh-burger { display: none; width: 42px; height: 42px; align-items: center; justify-content: center; background: transparent; color: var(--wb-text); border: 1px solid var(--wb-border); border-radius: 10px; cursor: pointer; }
.wbh-burger:hover, .wbh-burger:focus-visible { border-color: var(--wb-accent); color: var(--wb-accent); outline: none; }${
    center ? "\n@media (min-width: 769px) { .wbh-bar { flex-direction: column; gap: 8px; } }" : ""
  }
@media (max-width: 768px) {
  .wbh-burger { display: inline-flex; }
  .wbh-nav { display: none; position: absolute; top: 100%; left: 0; right: 0; flex-direction: column; align-items: stretch; gap: 10px; padding: 12px 20px 16px; background: var(--wb-bg); border-bottom: 1px solid var(--wb-border); }
  .wbh-open .wbh-nav { display: flex; }
  .wbh-nav ul { flex-direction: column; align-items: stretch; }
  .wbh-cta { text-align: center; }
}`;

  const js = `(function () {
  document.querySelectorAll('[data-wb-hdr]').forEach(function (root) {
    if (root.getAttribute('data-wb-init')) return;
    root.setAttribute('data-wb-init', '1');
    var btn = root.querySelector('[data-wb-hdr-burger]');
    function set(open) {
      root.classList.toggle('wbh-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    btn.addEventListener('click', function () { set(!root.classList.contains('wbh-open')); });
    root.addEventListener('keydown', function (e) { if (e.key === 'Escape') { set(false); btn.focus(); } });
    root.querySelectorAll('.wbh-nav a').forEach(function (a) { a.addEventListener('click', function () { set(false); }); });
  });
})();`;

  return { html, css, js, componentName: "SiteHeader" };
}

export function generate(values: BlockValues): string {
  return toUnifiedHtml(toOutput(values));
}
