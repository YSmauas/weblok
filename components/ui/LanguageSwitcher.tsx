"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale, type Locale } from "@/lib/i18n/locale-provider";
import { IconGlobe, IconCheck } from "./Icons";

const OPTIONS: Locale[] = ["he", "en", "es"];

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        aria-label={t("header.language")}
        aria-haspopup="menu"
        aria-expanded={open}
        className="p-2 rounded-full text-ink-secondary hover:text-ink-primary hover:bg-base-panel2 transition-colors"
      >
        <IconGlobe className="w-5 h-5" />
      </button>

      {open && (
        <div role="menu" className="absolute end-0 mt-2 w-44 surface rounded-xl z-50 p-1 animate-fadeInUp">
          {OPTIONS.map((opt) => (
            <button
              key={opt}
              role="menuitemradio"
              aria-checked={locale === opt}
              lang={opt}
              onClick={() => {
                setLocale(opt);
                setOpen(false);
              }}
              className={`w-full flex items-center justify-between gap-2 text-start px-3 py-2.5 rounded-lg text-sm transition-colors ${
                locale === opt
                  ? "text-accent font-semibold bg-accent/10"
                  : "text-ink-primary hover:bg-base-panel2"
              }`}
            >
              {t(`lang.${opt}`)}
              {locale === opt && <IconCheck className="w-4 h-4 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
