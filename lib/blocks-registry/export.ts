import type { BlockOutput, ExportFormat } from "./export-types";

/** עוטף CSS ב-<style> וה-JS (אם יש) ב-<script>, לפורמט "html" המאוחד. */
export function toUnifiedHtml(out: BlockOutput): string {
  const script = out.js ? `\n  <script>\n${indent(out.js, 4)}\n  </script>` : "";
  return `<!-- WEblok: ${out.componentName} -->
<div class="weblok-${slug(out.componentName)}">
${indent(out.html, 2)}
</div>
<style>
${indent(out.css, 2)}
</style>${script}`;
}

/** שלושה קבצים נפרדים - HTML טהור + CSS + JS. */
export function toSplitFiles(out: BlockOutput): { html: string; css: string; js: string } {
  const cls = `weblok-${slug(out.componentName)}`;
  return {
    html: `<!-- ${out.componentName}: קישרו kss.css ו-script.js לצד הקובץ הזה -->
<div class="${cls}">
${indent(out.html, 2)}
</div>`,
    css: out.css,
    js: out.js ?? "",
  };
}

/** רכיב React עצמאי (פונקציונלי, ללא ייבוא חיצוני) - ל-JSX. */
export function toJsx(out: BlockOutput): string {
  const jsxHtml = out.html
    .replace(/class=/g, "className=")
    .replace(/<!--([\s\S]*?)-->/g, "{/*$1*/}");
  return `// WEblok: ${out.componentName} - רכיב עצמאי, בלי תלות בשרת שלנו
export default function ${out.componentName}() {
  return (
    <>
      <style>{\`
${indent(out.css, 8)}
      \`}</style>
      <div className="weblok-${slug(out.componentName)}">
${indent(jsxHtml, 8)}
      </div>
    </>
  );
}
`;
}

/** נקודת הכניסה היחידה שה-UI קורא לה - "תן לי את הבלוק בפורמט X". */
export function exportBlock(out: BlockOutput, format: ExportFormat) {
  if (format === "html") return { kind: "single" as const, files: { "index.html": toUnifiedHtml(out) } };
  if (format === "html-css-js") {
    const f = toSplitFiles(out);
    return { kind: "multi" as const, files: { "index.html": f.html, "style.css": f.css, "script.js": f.js } };
  }
  return { kind: "single" as const, files: { [`${out.componentName}.jsx`]: toJsx(out) } };
}

function indent(s: string, spaces: number) {
  const pad = " ".repeat(spaces);
  return s.split("\n").map((l) => (l ? pad + l : l)).join("\n");
}

function slug(name: string) {
  return name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}
