"use client";

import { createContext, useContext, useEffect, useState } from "react";
import he from "./locales/he.json";
import en from "./locales/en.json";
import es from "./locales/es.json";

export type Locale = "he" | "en" | "es";

const DICTS: Record<Locale, Record<string, string>> = { he, en, es };
const RTL_LOCALES: Locale[] = ["he"];

const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}>({
  locale: "he",
  setLocale: () => {},
  t: (key) => key,
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("he");

  useEffect(() => {
    const stored = localStorage.getItem("weblok-locale") as Locale | null;
    if (stored && DICTS[stored]) applyLocale(stored, false);
  }, []);

  const applyLocale = (l: Locale, persist = true) => {
    setLocaleState(l);
    document.documentElement.lang = l;
    document.documentElement.dir = RTL_LOCALES.includes(l) ? "rtl" : "ltr";
    if (persist) localStorage.setItem("weblok-locale", l);
  };

  const t = (key: string) => DICTS[locale][key] ?? DICTS.he[key] ?? key;

  return (
    <LocaleContext.Provider value={{ locale, setLocale: applyLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export const useLocale = () => useContext(LocaleContext);
