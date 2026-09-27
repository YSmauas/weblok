"use client";

/**
 * מריץ HTML אמיתי (קוד מיוצא / קובץ של משתמש) בתוך iframe מבודד.
 * sandbox בלי allow-same-origin = origin אטום: הסקריפטים בפנים לא יכולים לגשת
 * לעוגיות, ל-localStorage או ל-DOM של האתר שלנו. בנוסף ה-CSP של האתר חל גם
 * על ה-srcdoc, כך שבקשות רשת לשרתים זרים נחסמות.
 */
export function HtmlPreview({
  html,
  title,
  className = "",
  wrapFragment = false,
}: {
  html: string;
  title: string;
  className?: string;
  /** קטע HTML (בלוק) ולא מסמך מלא - עוטפים במסמך בסיסי עם רקע כהה נייטרלי (רוב ערכות הבלוקים מעוצבות למצב כהה) */
  wrapFragment?: boolean;
}) {
  const doc = wrapFragment
    ? `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;min-height:100vh;padding:24px 16px;box-sizing:border-box;font-family:system-ui,sans-serif;background:linear-gradient(135deg,#0f172a,#334155)}</style></head><body>${html}</body></html>`
    : html;

  return (
    <iframe
      title={title}
      srcDoc={doc}
      sandbox="allow-scripts allow-forms allow-popups"
      referrerPolicy="no-referrer"
      className={`w-full bg-white border-0 ${className}`}
    />
  );
}
