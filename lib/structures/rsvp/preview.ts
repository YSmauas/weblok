import type { StructureImage, StructureValues } from "../types";
import { esc } from "@/lib/blocks-registry/_shared/util";
import { isSafeBase64 } from "../image";
import { sanitizeConfig } from "./config";
import { SITE_STRINGS, formatEventDate } from "./strings";
import { THEME_CSS, themeVars } from "./theme";

/**
 * תצוגה מקדימה סטטית של דף ההזמנה (לא אפליקציית ה-Next עצמה) - אותו CSS
 * ואותם טקסטים כמו בפרויקט המיוצא. רצה ב-HtmlPreview (iframe sandbox בלי
 * allow-same-origin). כל טקסט עובר esc(); ערכי CSS מגיעים רק מ-sanitizeConfig.
 */
export function previewHtml(values: StructureValues, image: StructureImage | null): string {
  const img = image && isSafeBase64(image.base64) ? image : null;
  const cfg = sanitizeConfig(values, img);
  const s = SITE_STRINGS[cfg.lang];

  const vars = themeVars(cfg);
  // בתצוגה התמונה מוטמעת כ-data URL (בפרויקט עצמו היא קובץ ב-public/)
  if (img) vars["--bg-image"] = `url("data:${img.mime};base64,${img.base64}")`;
  const style = Object.entries(vars)
    .map(([k, v]) => `${k}: ${v.replace(/[<>]/g, "")};`)
    .join(" ");

  const eyebrow = cfg.eyebrow || s.type[cfg.eventType];
  const when = [
    cfg.date ? `<div><dt>${esc(s.date)}</dt><dd>${esc(formatEventDate(cfg.date, cfg.lang))}</dd></div>` : "",
    cfg.time ? `<div><dt>${esc(s.time)}</dt><dd dir="ltr">${esc(cfg.time)}</dd></div>` : "",
  ].join("");
  const links = [
    cfg.wazeUrl ? `<a class="btn ghost" href="${esc(cfg.wazeUrl)}" target="_blank" rel="noopener noreferrer">${esc(s.waze)}</a>` : "",
    cfg.mapsUrl ? `<a class="btn ghost" href="${esc(cfg.mapsUrl)}" target="_blank" rel="noopener noreferrer">${esc(s.maps)}</a>` : "",
    cfg.date ? `<span class="btn ghost">${esc(s.calendar)}</span>` : "",
  ].join("");

  const guests = Array.from({ length: cfg.maxGuests }, (_, i) => `<option>${i + 1}</option>`).join("");
  const phone =
    cfg.phoneMode === "hidden"
      ? ""
      : `<div><label for="p-phone">${esc(s.phone)} ${cfg.phoneMode === "optional" ? `<span class="muted">${esc(s.optional)}</span>` : ""}</label><input id="p-phone" type="tel" dir="ltr"></div>`;
  const deadline = cfg.rsvpDeadline
    ? `<p class="muted">${esc(s.rsvpUntil.replace("{date}", formatEventDate(cfg.rsvpDeadline, cfg.lang)))}</p>`
    : "";

  return `<!doctype html>
<html lang="${cfg.lang}" dir="${cfg.dir}" data-theme="${cfg.theme}" style="${esc(style)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(cfg.title)}</title>
<style>${THEME_CSS}
.preview-note { position: sticky; top: 0; z-index: 5; margin: 0; padding: 6px 12px; font: 600 12px/1.4 system-ui, sans-serif; text-align: center; background: var(--accent); color: var(--on-accent); }
</style>
</head>
<body>
<p class="preview-note">${esc(s.previewNote)}</p>
${cfg.background ? '<div class="bg" aria-hidden="true"></div>' : ""}
<main class="page">
  <article class="card hero">
    <p class="eyebrow">${esc(eyebrow)}</p>
    <h1 class="title">${esc(cfg.title)}</h1>
    ${cfg.hosts ? `<p class="hosts">${esc(cfg.hosts)}</p>` : ""}
    <hr class="divider">
    ${when ? `<dl class="when">${when}</dl>` : ""}
    ${cfg.details ? `<p class="details">${esc(cfg.details)}</p>` : ""}
    ${cfg.venue || cfg.address ? `<div class="place">${cfg.venue ? `<strong>${esc(cfg.venue)}</strong>` : ""}${cfg.address ? `<span>${esc(cfg.address)}</span>` : ""}</div>` : ""}
    ${links ? `<div class="links">${links}</div>` : ""}
  </article>
  <section class="card">
    <h2>${esc(s.rsvpTitle)}</h2>
    ${deadline}
    <form id="f">
      <div><label for="p-name">${esc(s.name)}</label><input id="p-name" autocomplete="off"></div>
      ${phone}
      <fieldset>
        <legend>${esc(s.attending)}</legend>
        <div class="choices">
          <label class="choice"><input type="radio" name="a" checked><span>${esc(s.yes)}</span></label>
          <label class="choice"><input type="radio" name="a"><span>${esc(s.maybe)}</span></label>
          <label class="choice"><input type="radio" name="a"><span>${esc(s.no)}</span></label>
        </div>
      </fieldset>
      <div><label for="p-guests">${esc(s.guests)}</label><select id="p-guests">${guests}</select></div>
      <div><label for="p-note">${esc(s.note)}</label><textarea id="p-note"></textarea></div>
      <button type="submit" class="btn block">${esc(s.submit)}</button>
      <p class="status" id="msg" role="status" hidden>${esc(cfg.thanks || s.thanks)}</p>
    </form>
  </section>
</main>
<script>
document.getElementById("f").addEventListener("submit", function (e) {
  e.preventDefault();
  document.getElementById("msg").hidden = false;
});
</script>
</body>
</html>`;
}
