"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useSession } from "@/lib/auth/use-session";
import { createClient } from "@/lib/supabase/client";
import { readBrowserKey, writeBrowserKey } from "@/lib/ai/client";

/**
 * שדה מפתח Gemini להזרקה. המפתח נשאר בזיכרון הדף בלבד ונשלח ישירות מהדפדפן
 * ל-Google - לא לשרת שלנו. אם המשתמש כבר שמר מפתח "בדפדפן בלבד", ממלאים
 * אותו אוטומטית; שמירה כזו היא בחירה מפורשת (תיבת סימון), לא ברירת מחדל.
 *
 * מפתח ששמור *בשרת* (מוצפן ב-DB) לא שמיש כאן: ההזרקה רצה כולה בדפדפן, והשרת
 * לעולם לא מחזיר את המפתח ללקוח. משתמש מחובר שיש לו רק מפתח כזה מקבל הסבר
 * ברור (להדביק כאן / לשמור "בדפדפן בלבד" בפרופיל) במקום כישלון כללי.
 */
export function ApiKeyInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useLocale();
  const [remember, setRemember] = useState(false);
  const [fromBrowser, setFromBrowser] = useState(false);
  const [serverOnly, setServerOnly] = useState(false);
  const { loggedIn } = useSession();

  useEffect(() => {
    let alive = true;
    readBrowserKey().then((stored) => {
      // לא דורסים מפתח שהמשתמש כבר הקליד (למשל אחרי מעבר בין מצבי ההזרקה)
      if (!alive || !stored || value.trim()) return;
      onChange(stored);
      setFromBrowser(true);
    });
    return () => {
      alive = false;
    };
    // רק בטעינה הראשונה
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // משתמש מחובר בלי מפתח בדפדפן: האם יש לו מפתח בשרת? (רק שם הספק - הערך לא נשלף)
  useEffect(() => {
    if (!loggedIn || fromBrowser) {
      setServerOnly(false);
      return;
    }
    let alive = true;
    createClient()
      .from("api_keys")
      .select("provider")
      .eq("provider", "gemini")
      .limit(1)
      .then(({ data }) => {
        if (alive) setServerOnly(!!data?.length);
      });
    return () => {
      alive = false;
    };
  }, [loggedIn, fromBrowser]);

  // נשמר (מוצפן) רק כשהמשתמש מסמן, ורק אחרי שהפסיק להקליד
  useEffect(() => {
    if (!remember || value.trim().length < 8) return;
    const timer = setTimeout(() => writeBrowserKey(value), 600);
    return () => clearTimeout(timer);
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
      {serverOnly && !value.trim() && (
        <p role="note" className="mt-2 rounded-xl border border-accent/30 bg-accent-soft px-3 py-2 text-xs text-ink-secondary leading-relaxed">
          {t("inject.keyServerOnly")}{" "}
          <Link href="/dashboard/profile" className="text-accent hover:underline">
            {t("inject.keyServerOnlyLink")}
          </Link>
        </p>
      )}
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
