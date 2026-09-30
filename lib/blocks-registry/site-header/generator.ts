import type { BlockValues } from "../types";
import type { BlockOutput } from "../export-types";
import { toUnifiedHtml } from "../export";
import { fields } from "./config.schema";
import { EASE, clip, designCss, esc, fontImport, makePick, parseLinks, safeAsset, safeLink, sanitizeDesign } from "../_shared/util";

const pick = makePick(fields);

export function toOutput(raw: BlockValues): BlockOutput {
  const d = sanitizeDesign(raw);
  const layout = pick(raw, "headerLayout");
  const style = pick(raw, "headerStyle");
  const mode = pick(raw, "stickyMode");
  const sticky = mode !== "static";
  const shrink = sticky && pick(raw, "shrinkOnScroll") === "yes";
  const brand = clip(raw.brandText, 60) || "האתר שלי";
  const brandUrl = safeLink(raw.brandUrl) || "/";
  const logo = safeAsset(raw.logoUrl);
  const links = parseLinks(raw.navLinks, 8);
  const ctaText = clip(raw.ctaText, 40);
  const ctaUrl = safeLink(raw.ctaUrl);
  const hasCta = !!(ctaText && ctaUrl);
  const split = layout === "logo-center";

  const cta = (cls: string) => `<a class="wbh-cta ${cls}" href="${esc(ctaUrl)}">${esc(ctaText)}</a>`;

  const html = `<header class="wbh wbh-s-${style} wbh-l-${layout}" data-wb-hdr data-wb-mode="${mode}"${shrink ? " data-wb-shrink" : ""} dir="${d.dir}">
  <div class="wbh-bar">
    <a class="wbh-brand" href="${esc(brandUrl)}">${logo ? `<img class="wbh-logo" src="${esc(logo)}" alt="" loading="lazy">` : ""}<span>${esc(brand)}</span></a>
    <button class="wbh-burger" type="button" aria-label="תפריט" aria-expanded="false" data-wb-hdr-burger><span aria-hidden="true"><i></i><i></i><i></i></span></button>
    <nav class="wbh-nav" aria-label="ניווט ראשי">
      <ul>${links.map((l) => `<li><a class="wbh-link" href="${esc(l.url)}">${esc(l.label)}</a></li>`).join("")}</ul>${
        hasCta ? `\n      ${cta(split ? "wbh-cta-m" : "")}` : ""
      }
    </nav>${split && hasCta ? `\n    <div class="wbh-end">${cta("")}</div>` : ""}
  </div>
</header>`;

  const { css: vars } = designCss(".wbh", d);
  // כניסה מדורגת של הקישורים בתפריט המובייל
  const stagger = Array.from({ length: 8 }, (_, i) => `  .wbh-open .wbh-nav li:nth-child(${i + 1}) { transition-delay: ${40 + i * 35}ms; }`).join("\n");

  const css = `${fontImport(d)}
.weblok-site-header { display: contents; }
${vars}
.wbh { position: ${sticky ? "sticky" : "relative"}; top: 0; z-index: 1000; width: 100%; background: var(--wb-bg); border-bottom: 1px solid var(--wb-border); transition: transform .35s ${EASE.out}, box-shadow .3s, background-color .3s; }
.wbh-s-glass { background: transparent; isolation: isolate; -webkit-backdrop-filter: blur(14px) saturate(1.4); backdrop-filter: blur(14px) saturate(1.4); }
.wbh-s-glass::before { content: ""; position: absolute; inset: 0; z-index: -1; background: var(--wb-bg); opacity: .78; transition: opacity .3s; }
.wbh-s-glass.wbh-scrolled::before { opacity: .9; }
.wbh-s-floating { background: transparent; border-bottom: 0; padding: 10px 12px 0; }
.wbh-s-floating .wbh-bar { position: relative; isolation: isolate; border: 1px solid var(--wb-border); border-radius: 18px; box-shadow: 0 10px 30px -12px rgba(0,0,0,.35); -webkit-backdrop-filter: blur(14px) saturate(1.4); backdrop-filter: blur(14px) saturate(1.4); }
.wbh-s-floating .wbh-bar::before { content: ""; position: absolute; inset: 0; z-index: -1; border-radius: inherit; background: var(--wb-bg); opacity: .88; }
.wbh-scrolled { box-shadow: 0 8px 24px -14px rgba(0,0,0,.5); }
.wbh-s-floating.wbh-scrolled { box-shadow: none; }
.wbh-hidden { transform: translateY(-110%); }
.wbh-bar { max-width: 1200px; margin: 0 auto; padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px; transition: padding .3s ${EASE.out}; }
.wbh-scrolled .wbh-bar { padding-block: 8px; }
.wbh-brand { display: flex; align-items: center; gap: 10px; min-width: 0; color: var(--wb-text); text-decoration: none; font-weight: 800; font-size: 1.15rem; }
.wbh-brand span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.wbh-logo { height: 36px; width: auto; max-width: 140px; object-fit: contain; transition: height .3s ${EASE.out}; }
.wbh-scrolled .wbh-logo { height: 28px; }
.wbh-nav { display: flex; align-items: center; gap: 16px; }
.wbh-nav ul { list-style: none; margin: 0; padding: 0; display: flex; align-items: center; gap: 4px; }
.wbh-link { position: relative; display: block; padding: 8px 12px; border-radius: 8px; color: var(--wb-text); text-decoration: none; font-weight: 600; font-size: .95rem; opacity: .88; transition: color .15s, opacity .15s, background-color .15s; }
.wbh-link::after { content: ""; position: absolute; inset-inline: 12px; bottom: 3px; height: 2px; border-radius: 2px; background: var(--wb-accent); transform: scaleX(0); transition: transform .25s ${EASE.out}; }
.wbh-link:hover, .wbh-link:focus-visible, .wbh-link[aria-current="page"] { color: var(--wb-accent); opacity: 1; outline: none; }
.wbh-link:hover::after, .wbh-link:focus-visible::after, .wbh-link[aria-current="page"]::after { transform: scaleX(1); }
.wbh-link:focus-visible { background: color-mix(in srgb, var(--wb-accent) 16%, transparent); }
.wbh-cta { display: inline-block; padding: 9px 18px; border-radius: 10px; background: var(--wb-accent); color: #fff; text-decoration: none; font-weight: 700; font-size: .92rem; white-space: nowrap; transition: transform .2s ${EASE.out}, box-shadow .2s, filter .2s; }
.wbh-cta:hover, .wbh-cta:focus-visible { filter: brightness(1.08); transform: translateY(-1px); box-shadow: 0 8px 20px -8px var(--wb-accent); outline: none; }
.wbh-burger { display: none; width: 42px; height: 42px; align-items: center; justify-content: center; background: transparent; color: var(--wb-text); border: 1px solid var(--wb-border); border-radius: 10px; cursor: pointer; }
.wbh-burger span { position: relative; width: 18px; height: 12px; }
.wbh-burger i { position: absolute; inset-inline: 0; height: 2px; border-radius: 2px; background: currentColor; transition: transform .3s ${EASE.out}, opacity .2s, top .3s ${EASE.out}; }
.wbh-burger i:nth-child(1) { top: 0; } .wbh-burger i:nth-child(2) { top: 5px; } .wbh-burger i:nth-child(3) { top: 10px; }
.wbh-open .wbh-burger i:nth-child(1) { top: 5px; transform: rotate(45deg); }
.wbh-open .wbh-burger i:nth-child(2) { opacity: 0; }
.wbh-open .wbh-burger i:nth-child(3) { top: 5px; transform: rotate(-45deg); }
.wbh-burger:hover, .wbh-burger:focus-visible { border-color: var(--wb-accent); color: var(--wb-accent); outline: none; }
.wbh-cta-m { display: none; }${
    layout === "center" ? "\n@media (min-width: 769px) { .wbh-l-center .wbh-bar { flex-direction: column; gap: 8px; } }" : ""
  }${
    split
      ? `
@media (min-width: 769px) {
  .wbh-l-logo-center .wbh-bar { display: grid; grid-template-columns: 1fr auto 1fr; }
  .wbh-l-logo-center .wbh-brand { grid-column: 2; grid-row: 1; }
  .wbh-l-logo-center .wbh-nav { grid-column: 1; grid-row: 1; }
  .wbh-l-logo-center .wbh-end { grid-column: 3; grid-row: 1; justify-self: end; }
}`
      : ""
  }
@media (max-width: 768px) {
  .wbh-burger { display: inline-flex; }
  .wbh-end { display: none; }
  .wbh-cta-m { display: inline-block; }
  .wbh-nav { position: absolute; top: 100%; left: 0; right: 0; flex-direction: column; align-items: stretch; gap: 10px; padding: 12px 20px 16px; background: var(--wb-bg); border-bottom: 1px solid var(--wb-border); box-shadow: 0 18px 30px -18px rgba(0,0,0,.5); opacity: 0; visibility: hidden; transform: translateY(-8px); transition: opacity .25s ${EASE.out}, transform .3s ${EASE.out}, visibility 0s linear .3s; }
  .wbh-s-floating .wbh-nav { top: calc(100% + 8px); left: 12px; right: 12px; border: 1px solid var(--wb-border); border-radius: 16px; }
  .wbh-open .wbh-nav { opacity: 1; visibility: visible; transform: none; transition-delay: 0s; }
  .wbh-nav ul { flex-direction: column; align-items: stretch; }
  .wbh-nav li { opacity: 0; transform: translateY(-6px); transition: opacity .25s ${EASE.out}, transform .3s ${EASE.out}; }
  .wbh-open .wbh-nav li { opacity: 1; transform: none; }
  .wbh-cta { text-align: center; }
${stagger}
}`;

  const js = `(function () {
  document.querySelectorAll('[data-wb-hdr]').forEach(function (root) {
    if (root.getAttribute('data-wb-init')) return;
    root.setAttribute('data-wb-init', '1');
    var btn = root.querySelector('[data-wb-hdr-burger]');
    var mode = root.getAttribute('data-wb-mode');
    var shrink = root.hasAttribute('data-wb-shrink');
    function set(open) {
      root.classList.toggle('wbh-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) root.classList.remove('wbh-hidden');
    }
    btn.addEventListener('click', function () { set(!root.classList.contains('wbh-open')); });
    root.addEventListener('keydown', function (e) { if (e.key === 'Escape' && root.classList.contains('wbh-open')) { set(false); btn.focus(); } });
    document.addEventListener('click', function (e) { if (root.classList.contains('wbh-open') && !root.contains(e.target)) set(false); });
    root.querySelectorAll('.wbh-nav a, .wbh-end a').forEach(function (a) {
      a.addEventListener('click', function () { set(false); });
      try { if (a.pathname === location.pathname && a.hostname === location.hostname && a.getAttribute('href').charAt(0) !== '#') a.setAttribute('aria-current', 'page'); } catch (e) {}
    });
    if (mode === 'static') return;
    var lastY = window.pageYOffset, ticking = false;
    function onScroll() {
      ticking = false;
      var y = window.pageYOffset;
      if (shrink) root.classList.toggle('wbh-scrolled', y > 8);
      if (mode === 'autohide' && !root.classList.contains('wbh-open') && !root.contains(document.activeElement)) {
        if (y > lastY + 4 && y > 80) root.classList.add('wbh-hidden');
        else if (y < lastY - 4 || y <= 80) root.classList.remove('wbh-hidden');
      }
      lastY = y;
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();
  });
})();`;

  return { html, css, js, componentName: "SiteHeader" };
}

export function generate(values: BlockValues): string {
  return toUnifiedHtml(toOutput(values));
}
