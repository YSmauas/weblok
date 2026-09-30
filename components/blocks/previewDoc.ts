import type { BlockOutput } from "@/lib/blocks-registry/export-types";
import { wrapperClass } from "@/lib/blocks-registry/export";

/**
 * בונה את מסמך התצוגה החיה בעורך: "אתר לדוגמה" (הדר/תוכן/פוטר מדומים) עם
 * הבלוק האמיתי במקום שבו הוא יישב באתר - כדי שמיקום של כותרת/פוטר/וילון/פופאפ
 * ייראה אמיתי. רץ רק בתוך iframe sandbox (allow-scripts, בלי allow-same-origin).
 *
 * כל התוספות כאן הן לתצוגה בלבד ולא נכנסות לקוד המיוצא.
 */

export type PageTheme = "light" | "dark";
type Placement = "top" | "bottom" | "inline" | "overlay";

const PLACEMENT: Record<string, Placement> = {
  "site-header": "top",
  "site-footer": "bottom",
  "site-sidebar": "overlay",
  popup: "overlay",
  "chatbot-assistant": "overlay",
  "contact-form": "inline",
};

const PALETTE: Record<PageTheme, { bg: string; ink: string; soft: string; card: string; line: string }> = {
  light: { bg: "#f6f7fb", ink: "#0f172a", soft: "#dfe4ee", card: "#ffffff", line: "#e5e7eb" },
  dark: { bg: "#0b1020", ink: "#e2e8f0", soft: "#1f2940", card: "#121a2e", line: "#1e293b" },
};

// סקריפט שרץ *לפני* קוד הבלוק: פופאפ מוצג מיד ובכל טעינה (בלי לחכות 5 שניות / exit-intent)
const PRE_JS = `document.querySelectorAll('[data-wb-pop]').forEach(function(r){r.setAttribute('data-wb-trigger','immediate');r.setAttribute('data-wb-freq','always');});`;
// אחרי קוד הבלוק: ווידג'טים צפים נפתחים, כדי לראות את התוכן ולא רק בועה
const POST_JS = `setTimeout(function(){document.querySelectorAll("[data-wb-toggle],[data-wb-chat-toggle]").forEach(function(b){b.click()})},450);`;

const bars = (widths: number[]) => widths.map((w) => `<i class="pv-bar" style="width:${w}%"></i>`).join("");

export function buildPreviewDoc({
  output,
  slug,
  theme,
  dir,
}: {
  output: BlockOutput;
  slug: string;
  theme: PageTheme;
  dir: "rtl" | "ltr";
}): string {
  const place = PLACEMENT[slug] ?? "inline";
  const c = PALETTE[theme];
  // </script> בתוך קוד הבלוק כבר מנוטרל ע"י jsStr בגנרטורים; כאן רק ליתר ביטחון
  const js = (output.js ?? "").replace(/<\/script/gi, "<\\/script");
  const block = `<div class="${wrapperClass(output)}" data-weblok-block>${output.html}</div>
<style>${output.css.replace(/<\/style/gi, "<\\/style")}</style>
<script>${PRE_JS}</script>
${js ? `<script>${js}</script>` : ""}
<script>${POST_JS}</script>`;

  const fakeHeader = `<header class="pv-head"><span class="pv-logo"></span><nav>${bars([10, 12, 9])}</nav></header>`;
  const fakeFooter = `<footer class="pv-foot">${bars([30, 20])}</footer>`;
  const cards = `<div class="pv-cards">${[1, 2, 3].map(() => `<div class="pv-card"><span class="pv-img"></span>${bars([80, 60])}</div>`).join("")}</div>`;
  const section = (n: number) => `<section class="pv-sec">${bars([92, 86, 95, 70].slice(0, n))}</section>`;

  const content = `<main class="pv-main">
  <div class="pv-hero"><i class="pv-bar pv-h1" style="width:62%"></i>${bars([80, 55])}<span class="pv-btn"></span></div>
  ${place === "inline" ? `<div class="pv-inline">${block}</div>` : section(4)}
  ${cards}
  ${section(3)}
  ${section(4)}
  ${cards}
  ${section(3)}
</main>`;

  const body =
    place === "top"
      ? `${block}\n${content}\n${fakeFooter}`
      : place === "bottom"
        ? `${fakeHeader}\n${content}\n${block}`
        : `${fakeHeader}\n${content}\n${fakeFooter}${place === "overlay" ? `\n${block}` : ""}`;

  return `<!doctype html><html lang="${dir === "rtl" ? "he" : "en"}" dir="${dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
html,body{margin:0}
body{min-height:100vh;background:${c.bg};color:${c.ink};font-family:system-ui,-apple-system,"Segoe UI",Roboto,"Noto Sans Hebrew",Arial,sans-serif}
.pv-bar{display:block;height:10px;border-radius:99px;background:${c.soft};margin:0 0 10px}
.pv-head{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 20px;background:${c.card};border-bottom:1px solid ${c.line}}
.pv-head nav{display:flex;gap:14px;flex:0 1 50%;justify-content:flex-end}.pv-head .pv-bar{flex:1;margin:0}
.pv-logo{width:96px;height:22px;border-radius:8px;background:${c.soft}}
.pv-main{max-width:1100px;margin:0 auto;padding:28px 20px 40px}
.pv-hero{padding:36px 0 28px}.pv-h1{height:26px;margin-bottom:18px}
.pv-btn{display:inline-block;width:140px;height:38px;border-radius:10px;background:${c.soft};margin-top:10px}
.pv-sec{padding:18px 0}
.pv-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;padding:18px 0}
.pv-card{background:${c.card};border:1px solid ${c.line};border-radius:14px;padding:14px}
.pv-img{display:block;height:90px;border-radius:10px;background:${c.soft};margin-bottom:12px}
.pv-inline{padding:24px 0}
.pv-foot{padding:28px 20px;background:${c.card};border-top:1px solid ${c.line}}
</style></head><body>
${body}
</body></html>`;
}
