import type { BlockValues } from "../types";
import type { BlockOutput } from "../export-types";
import { toUnifiedHtml } from "../export";
import { fields } from "./config.schema";
import { clip, designCss, esc, fontImport, makePick, parseLinks, sanitizeDesign } from "../_shared/util";
import type { LinkItem } from "../_shared/util";

const pick = makePick(fields);

const list = (cls: string, items: LinkItem[]) =>
  `<ul class="${cls}">${items.map((l) => `<li><a href="${esc(l.url)}">${esc(l.label)}</a></li>`).join("")}</ul>`;

export function toOutput(raw: BlockValues): BlockOutput {
  const d = sanitizeDesign(raw);
  const columns = pick(raw, "footerLayout") === "columns";
  const brand = clip(raw.brandText, 60) || "האתר שלי";
  const tagline = clip(raw.tagline, 200);
  const col1 = parseLinks(raw.col1Links, 8);
  const col2 = columns ? parseLinks(raw.col2Links, 8) : [];
  const social = parseLinks(raw.socialLinks, 6).filter((l) => /^https?:\/\//i.test(l.url));
  const tpl = clip(raw.copyrightText, 120);
  const hasYear = tpl.includes("{year}");
  const year = String(new Date().getFullYear());

  const colBlock = (title: string, items: LinkItem[]) =>
    items.length
      ? `\n    <nav class="wbf-col" aria-label="${esc(title || "קישורים")}">${title ? `<h3>${esc(title)}</h3>` : ""}${list("wbf-links", items)}</nav>`
      : "";

  const html = `<footer class="wbf" data-wb-ftr dir="${d.dir}">
  <div class="wbf-inner">
    <div class="wbf-about">
      <strong class="wbf-brand">${esc(brand)}</strong>${tagline ? `\n      <p>${esc(tagline)}</p>` : ""}${
        social.length
          ? `\n      <ul class="wbf-social">${social
              .map((l) => `<li><a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.label)}</a></li>`)
              .join("")}</ul>`
          : ""
      }
    </div>${
      columns
        ? colBlock(clip(raw.col1Title, 40), col1) + colBlock(clip(raw.col2Title, 40), col2)
        : col1.length
          ? `\n    <nav class="wbf-col" aria-label="קישורים">${list("wbf-links wbf-inline", col1)}</nav>`
          : ""
    }
  </div>${
    tpl
      ? `\n  <div class="wbf-bottom"><small${hasYear ? ` data-wb-copy="${esc(tpl)}"` : ""}>${esc(tpl.split("{year}").join(year))}</small></div>`
      : ""
  }
</footer>`;

  const cols = columns ? (col1.length ? 1 : 0) + (col2.length ? 1 : 0) : 0;
  const grid = columns && cols > 0 ? `minmax(220px, 1.6fr) ${"minmax(140px, 1fr) ".repeat(cols).trim()}` : "1fr";

  const { css: vars } = designCss(".wbf", d);
  const css = `${fontImport(d)}
${vars}
.wbf { width: 100%; background: var(--wb-bg); border-top: 1px solid var(--wb-border); }
.wbf-inner { max-width: 1200px; margin: 0 auto; padding: 40px 20px 24px; display: grid; grid-template-columns: ${grid}; gap: 32px; ${columns ? "" : "text-align: center; justify-items: center;"} }
.wbf-brand { font-size: 1.2rem; font-weight: 800; }
.wbf-about p { margin: 8px 0 0; font-size: .92rem; line-height: 1.6; opacity: .85; max-width: 46ch; ${columns ? "" : "margin-inline: auto;"} }
.wbf-col h3 { margin: 0 0 12px; font-size: .95rem; font-weight: 800; }
.wbf-links, .wbf-social { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.wbf-inline, .wbf-social { flex-direction: row; flex-wrap: wrap; gap: 8px 18px; ${columns ? "" : "justify-content: center;"} }
.wbf-social { margin-top: 14px; }
.wbf a { color: var(--wb-text); text-decoration: none; font-size: .92rem; opacity: .85; transition: .15s; }
.wbf a:hover, .wbf a:focus-visible { color: var(--wb-accent); opacity: 1; text-decoration: underline; outline: none; }
.wbf-social a { display: inline-block; padding: 5px 12px; border: 1px solid var(--wb-border); border-radius: 999px; text-decoration: none !important; font-size: .82rem; }
.wbf-bottom { border-top: 1px solid var(--wb-border); padding: 16px 20px; text-align: center; font-size: .82rem; opacity: .7; }
@media (max-width: 768px) { .wbf-inner { grid-template-columns: 1fr; gap: 24px; } }`;

  const js = hasYear
    ? `(function () {
  document.querySelectorAll('[data-wb-ftr]').forEach(function (root) {
    if (root.getAttribute('data-wb-init')) return;
    root.setAttribute('data-wb-init', '1');
    var el = root.querySelector('[data-wb-copy]');
    if (el) el.textContent = el.getAttribute('data-wb-copy').split('{year}').join(String(new Date().getFullYear()));
  });
})();`
    : undefined;

  return { html, css, js, componentName: "SiteFooter" };
}

export function generate(values: BlockValues): string {
  return toUnifiedHtml(toOutput(values));
}
