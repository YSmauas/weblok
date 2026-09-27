import type { BlockValues } from "../types";
import type { BlockOutput } from "../export-types";
import { getTheme } from "./themes";
import { toUnifiedHtml } from "../export";
import { fields } from "./config.schema";

const esc = (v: string) =>
  (v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
/** מחרוזת JS שבטוחה גם בתוך <script> (בלי "</script>" שיסגור את התגית) */
const jsStr = (v: string) => JSON.stringify(v ?? "").replace(/</g, "\\u003c").replace(/\u2028|\u2029/g, "");

const HEX = /^#[0-9a-fA-F]{6}$/;

/** ערך select חייב להיות אחת האפשרויות שהוגדרו בסכמה - אחרת ברירת המחדל. */
function pick(values: BlockValues, id: string): string {
  const field = fields.find((f) => f.id === id);
  const v = values[id];
  if (field?.options?.some((o) => o.value === v)) return v;
  return field?.default ?? "";
}

/**
 * מנקה את כל הערכים לפני שהם נכנסים ל-CSS/HTML/JS. הערכים מגיעים מהעורך, מעיצוב
 * שמור או מה-AI - אף אחד מהם לא אמור להיות מסוגל "לשבור" את הקוד המיוצא.
 */
function sanitize(values: BlockValues): BlockValues {
  const webhook = (values.webhookUrl ?? "").trim();
  return {
    ...values,
    submitMethod: pick(values, "submitMethod"),
    displayMode: pick(values, "displayMode"),
    widgetPosition: pick(values, "widgetPosition"),
    themeSelect: pick(values, "themeSelect"),
    defaultThemeMode: pick(values, "defaultThemeMode"),
    allowThemeToggle: pick(values, "allowThemeToggle"),
    showPhone: pick(values, "showPhone"),
    showSubject: pick(values, "showSubject"),
    fontSelect: pick(values, "fontSelect"),
    accentColor: HEX.test(values.accentColor ?? "") ? values.accentColor : "#38bdf8",
    formspreeId: (values.formspreeId ?? "").trim().replace(/^.*\/f\//, "").replace(/[^A-Za-z0-9]/g, ""),
    webhookUrl: /^https:\/\/[^\s"'<>]+$/i.test(webhook) ? webhook : "",
    mailtoAddress: (values.mailtoAddress ?? "").trim().replace(/[^A-Za-z0-9._%+@-]/g, ""),
  };
}

/** אייקוני SVG מוטמעים - בלי תלות ב-Font Awesome או כל CDN חיצוני. */
const SVG = {
  envelope: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18v12H3z"/><path d="m3 7 9 6 9-6"/></svg>',
  paperPlane: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>',
  user: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>',
  phone: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/></svg>',
  bookmark: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h12v18l-6-4-6 4Z"/></svg>',
  message: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/></svg>',
  arrow: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5"/><path d="m11 18-6-6 6-6"/></svg>',
  moon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/></svg>',
  sun: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4 12H2m20 0h-2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/></svg>',
  close: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m18 6-12 12M6 6l12 12"/></svg>',
};

/**
 * מייצר את הבלוק כ-BlockOutput עצמאי (html+css+js) - רץ לגמרי בצד הלקוח,
 * בלי קריאה חזרה לשרת שלנו. כל ה-instances באותו עמוד סגורים תחת
 * `.wb-contact` ומטופלים ב-IIFE אחד שסורק querySelectorAll, כדי שכמה
 * בלוקים על אותו עמוד לא יתנגשו ב-id-ים.
 */
export function toOutput(rawValues: BlockValues): BlockOutput {
  const values = sanitize(rawValues);
  const theme = getTheme(values.themeSelect, values.accentColor || "#38bdf8");
  const isWidget = values.displayMode === "widget";
  const sidePos = values.widgetPosition === "left" ? "left: 16px;" : "right: 16px;";

  const layoutCss = isWidget
    ? `
  .wb-contact { position: fixed; bottom: max(88px, calc(72px + env(safe-area-inset-bottom))); ${sidePos}
    width: min(400px, calc(100vw - 32px)); max-height: min(80vh, 620px); overflow-y: auto;
    z-index: 9999; transform-origin: bottom ${values.widgetPosition === "left" ? "left" : "right"};
    transform: scale(0.92); opacity: 0; pointer-events: none;
    transition: all .25s cubic-bezier(.175,.885,.32,1.275); }
  .wb-contact.wb-open { transform: scale(1); opacity: 1; pointer-events: auto; }
  .wb-toggle { position: fixed; bottom: max(16px, env(safe-area-inset-bottom)); ${sidePos}
    width: 56px; height: 56px; border-radius: 50%; background: var(--wb-accent); color: #fff; border: none;
    font-size: 1.3rem; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,.3); z-index: 10000;
    display: flex; align-items: center; justify-content: center; transition: .2s; }
  .wb-toggle:hover { transform: scale(1.08); }`
    : `
  .wb-contact { width: 100%; max-width: 550px; margin: 0 auto; }`;

  const fontParam = encodeURIComponent(values.fontSelect).replace(/%20/g, "+");
  const css = `@import url('https://fonts.googleapis.com/css2?family=${fontParam}:wght@400;600;700;800&display=swap');
  .wb-contact, .wb-toggle { font-family: '${values.fontSelect}', sans-serif; box-sizing: border-box; }
  .wb-contact *, .wb-toggle * { box-sizing: border-box; }
  .wb-contact {
    --wb-bg: ${theme.dark.panel}; --wb-border: ${theme.dark.border}; --wb-text: ${theme.dark.text};
    --wb-input: ${theme.dark.inputBg}; --wb-accent: ${values.accentColor};
    background: var(--wb-bg); border: 1px solid var(--wb-border); color: var(--wb-text);
    ${theme.dark.panelCss} overflow: hidden;
  }
  .wb-contact[data-wb-mode="light"] {
    --wb-bg: ${theme.light.panel}; --wb-border: ${theme.light.border}; --wb-text: ${theme.light.text};
    --wb-input: ${theme.light.inputBg};
    ${theme.light.panelCss}
  }
  ${layoutCss}
  .wb-header { padding: 20px 20px 12px; border-bottom: 1px solid var(--wb-border); display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
  .wb-header h2 { font-size: clamp(1.1rem, 4vw, 1.35rem); font-weight: 800; margin: 0 0 4px; display: flex; align-items: center; gap: 8px; }
  .wb-header h2 svg { color: var(--wb-accent); flex-shrink: 0; }
  .wb-header p { font-size: .88rem; opacity: .85; line-height: 1.4; margin: 0; }
  .wb-actions { display: flex; gap: 6px; flex-shrink: 0; }
  .wb-icon-btn { background: transparent; border: none; color: var(--wb-text); font-size: 1rem; cursor: pointer; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
  .wb-icon-btn:hover { background: rgba(128,128,128,.2); color: var(--wb-accent); }
  .wb-form { padding: 20px; display: flex; flex-direction: column; gap: 14px; }
  .wb-group { display: flex; flex-direction: column; gap: 5px; }
  .wb-group label { font-size: .82rem; font-weight: 600; display: flex; align-items: center; gap: 6px; }
  .wb-group label svg { color: var(--wb-accent); flex-shrink: 0; }
  .wb-field { width: 100%; padding: 11px 13px; background: var(--wb-input); border: 1px solid var(--wb-border); border-radius: 10px; color: var(--wb-text); font-size: .95rem; font-family: inherit; outline: none; transition: .2s; }
  .wb-field:focus { border-color: var(--wb-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--wb-accent) 20%, transparent); }
  textarea.wb-field { resize: vertical; min-height: 84px; }
  .wb-submit { width: 100%; padding: 13px; background: var(--wb-accent); color: #fff; border: none; border-radius: 10px; font-size: .98rem; font-weight: 700; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 8px; }
  .wb-submit:disabled { opacity: .6; cursor: not-allowed; }
  .wb-status { padding: 10px; border-radius: 10px; font-size: .88rem; text-align: center; display: none; font-weight: 600; }
  .wb-status.wb-ok { background: rgba(16,185,129,.15); border: 1px solid #10b981; color: #10b981; display: block; }
  .wb-status.wb-err { background: rgba(239,68,68,.15); border: 1px solid #ef4444; color: #ef4444; display: block; }
  @media (max-width: 420px) {
    .wb-header, .wb-form { padding-inline: 16px; }
    .wb-toggle { width: 50px; height: 50px; }
  }`;

  const widgetToggleHtml = isWidget
    ? `<button class="wb-toggle" data-wb-toggle aria-label="פתח טופס יצירת קשר">${SVG.envelope}</button>`
    : "";

  const sectionTitleHtml =
    !isWidget && values.sectionTitle?.trim()
      ? `<h2 style="text-align:center;font-size:clamp(1.3rem,5vw,1.8rem);font-weight:800;margin:0 0 20px;font-family:'${values.fontSelect}',sans-serif;">${esc(values.sectionTitle)}</h2>`
      : "";

  const html = `${sectionTitleHtml}
${widgetToggleHtml}
<div class="wb-contact${isWidget ? "" : " wb-open"}" dir="rtl" data-wb-mode="${values.defaultThemeMode}" ${isWidget ? "" : 'data-wb-static="1"'}>
  <div class="wb-header">
    <div>
      <h2>${SVG.paperPlane} ${esc(values.formTitle)}</h2>
      <p>${esc(values.formSubtitle)}</p>
    </div>
    <div class="wb-actions">
      ${values.allowThemeToggle === "yes" ? `<button class="wb-icon-btn" data-wb-theme-toggle aria-label="החלף מצב תצוגה">${SVG.moon}</button>` : ""}
      ${isWidget ? `<button class="wb-icon-btn" data-wb-close aria-label="סגור">${SVG.close}</button>` : ""}
    </div>
  </div>
  <form class="wb-form" data-wb-form>
    <div class="wb-group">
      <label>${SVG.user} שם מלא *</label>
      <input class="wb-field" type="text" name="name" autocomplete="name" aria-label="שם מלא" required>
    </div>
    <div class="wb-group">
      <label>${SVG.envelope} כתובת מייל *</label>
      <input class="wb-field" type="email" name="email" autocomplete="email" aria-label="כתובת מייל" required>
    </div>
    ${values.showPhone !== "hidden" ? `<div class="wb-group">
      <label>${SVG.phone} טלפון ${values.showPhone === "required" ? "*" : ""}</label>
      <input class="wb-field" type="tel" name="phone" autocomplete="tel" aria-label="טלפון" ${values.showPhone === "required" ? "required" : ""}>
    </div>` : ""}
    ${values.showSubject !== "hidden" ? `<div class="wb-group">
      <label>${SVG.bookmark} נושא ${values.showSubject === "required" ? "*" : ""}</label>
      <input class="wb-field" type="text" name="subject" aria-label="נושא" ${values.showSubject === "required" ? "required" : ""}>
    </div>` : ""}
    <div class="wb-group">
      <label>${SVG.message} הודעה *</label>
      <textarea class="wb-field" name="message" aria-label="הודעה" required></textarea>
    </div>
    <button type="submit" class="wb-submit" data-wb-submit>
      <span data-wb-btn-text>${esc(values.btnText)}</span> ${SVG.arrow}
    </button>
    <div class="wb-status" data-wb-status role="status" aria-live="polite"></div>
  </form>
</div>`;

  const js = `(function () {
  document.querySelectorAll('.wb-contact').forEach(function (root) {
    if (root.dataset.wbInit) return;
    root.dataset.wbInit = "1";

    var toggle = root.hasAttribute('data-wb-static') ? null : root.previousElementSibling;
    if (toggle && !toggle.hasAttribute('data-wb-toggle')) toggle = null;
    if (toggle) {
      toggle.addEventListener('click', function () { root.classList.toggle('wb-open'); });
      var closeBtn = root.querySelector('[data-wb-close]');
      if (closeBtn) closeBtn.addEventListener('click', function () { root.classList.remove('wb-open'); });
    }

    var themeToggle = root.querySelector('[data-wb-theme-toggle]');
    if (themeToggle) {
      themeToggle.addEventListener('click', function () {
        var light = root.getAttribute('data-wb-mode') === 'light';
        root.setAttribute('data-wb-mode', light ? 'dark' : 'light');
        themeToggle.innerHTML = light ? ${jsStr(SVG.moon)} : ${jsStr(SVG.sun)};
      });
    }

    var form = root.querySelector('[data-wb-form]');
    var status = root.querySelector('[data-wb-status]');
    var submitBtn = root.querySelector('[data-wb-submit]');
    var btnText = root.querySelector('[data-wb-btn-text]');
    var originalBtnText = btnText.textContent;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = Object.fromEntries(new FormData(form).entries());

      ${
        values.submitMethod === "mailto"
          ? `var subject = encodeURIComponent(data.subject || ${jsStr(values.formTitle || "פנייה חדשה")});
      var body = encodeURIComponent('שם: ' + data.name + '\\nמייל: ' + data.email + (data.phone ? '\\nטלפון: ' + data.phone : '') + '\\n\\n' + data.message);
      window.location.href = ${jsStr("mailto:" + values.mailtoAddress)} + '?subject=' + subject + '&body=' + body;
      status.textContent = ${jsStr(values.successMsg || "נפתח יישום המייל שלך.")};
      status.className = 'wb-status wb-ok';
      form.reset();
      return;`
          : `submitBtn.disabled = true;
      btnText.textContent = 'שולח...';
      status.className = 'wb-status';
      status.style.display = 'none';

      ${
        values.submitMethod === "formspree"
          ? `fetch(${jsStr("https://formspree.io/f/" + values.formspreeId)}, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      })`
          : `fetch(${jsStr(values.webhookUrl)}, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
      })`
      }
        .then(function (res) { if (!res.ok) throw new Error(); return res; })
        .then(function () {
          status.textContent = ${jsStr(values.successMsg || "הודעתך נשלחה בהצלחה!")};
          status.className = 'wb-status wb-ok';
          form.reset();
        })
        .catch(function () {
          status.textContent = 'אירעה שגיאה בשליחה. נסו שוב.';
          status.className = 'wb-status wb-err';
        })
        .finally(function () {
          submitBtn.disabled = false;
          btnText.textContent = originalBtnText;
        });`
      }
    });
  });
})();`;

  return { html, css, js, componentName: "ContactForm" };
}

/** תאימות לאחור ל-BlockDefinition.generate (עדיין נדרש ע"י הטיפוס). */
export function generate(values: BlockValues): string {
  return toUnifiedHtml(toOutput(values));
}
