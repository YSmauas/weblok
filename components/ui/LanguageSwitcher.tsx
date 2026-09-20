"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale, type Locale } from "@/lib/i18n/locale-provider";
import { IconGlobe } from "./Icons";

const OPTIONS: Locale[] = ["he", "en", "es"];

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t("header.language")}
        className="p-2 rounded-full text-ink-secondary hover:text-ink-primary hover:bg-base-panel2 transition-colors"
      >
        <IconGlobe className="w-5 h-5" />
      </button>

      {open && (
        <div className="absolute end-0 mt-2 w-36 glass rounded-xl shadow-xl overflow-hidden z-50">
          {OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                setLocale(opt);
                setOpen(false);
              }}
              className={`w-full text-start px-4 py-2.5 text-sm transition-colors ${
                locale === opt
                  ? "text-accent font-semibold bg-accent/10"
                  : "text-ink-secondary hover:text-ink-primary hover:bg-base-panel2"
              }`}
            >
              {t(`lang.${opt}`)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
