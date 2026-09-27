"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { readBrowserKey, writeBrowserKey } from "@/lib/ai/client";

/**
 * שדה מפתח Gemini להזרקה. המפתח נשאר בזיכרון הדף בלבד ונשלח ישירות מהדפדפן
 * ל-Google - לא לשרת שלנו. אם המשתמש כבר שמר מפתח "בדפדפן בלבד", ממלאים
 * אותו אוטומטית; שמירה כזו היא בחירה מפורשת (תיבת סימון), לא ברירת מחדל.
 */
export function ApiKeyInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useLocale();
  const [remember, setRemember] = useState(false);
  const [fromBrowser, setFromBrowser] = useState(false);

  useEffect(() => {
    const stored = readBrowserKey();
    if (stored && !value) {
      onChange(stored);
      setFromBrowser(true);
    }
    // רק בטעינה הראשונה
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (remember && value.trim().length >= 8) writeBrowserKey(value);
  }, [remember, value]);

  return (
    <div>
      <label htmlFor="inject-api-key" className="label">
        {t("inject.keyLabel")}
      </label>
      <input
        id="inject-api-key"
        type="password"
        autoComplete="off"
        spellCheck={false}
        dir="ltr"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setFromBrowser(false);
        }}
        placeholder="AIza..."
        className="field font-mono"
      />
      <p className="text-[11px] text-ink-muted mt-1.5 leading-relaxed">
        {fromBrowser ? t("inject.keyFromBrowser") : t("inject.keyHint")}{" "}
        <a
          href="https://aistudio.google.com/app/apikey"
          target="_blank"
          rel="noreferrer"
          className="text-accent hover:underline"
        >
          {t("inject.keyGet")}
        </a>
      </p>
      {!fromBrowser && (
        <label className="mt-2 flex items-center gap-2 text-xs text-ink-secondary cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="accent-[var(--accent)]"
          />
          {t("inject.keyRemember")}
        </label>
      )}
    </div>
  );
}
