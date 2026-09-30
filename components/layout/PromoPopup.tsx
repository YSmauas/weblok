"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/lib/i18n/locale-provider";
import { AppIcon } from "@/components/ui/AppIcon";
import { IconClose } from "@/components/ui/Icons";

/**
 * פופאפ קידום של WEblok עצמו (לא הבלוק המיוצא): כרטיס קטן בפינה שמראה לגולש
 * שגם הוא יכול לשים כזה באתר שלו. לא חוסם את הדף (לא מודאלי) ולא גונב פוקוס.
 *
 * מגבלות תדירות, כדי לא להציק:
 * - מופיע רק אחרי 25 שניות בדף, או אחרי גלילה של חצי דף (המוקדם מביניהם).
 * - פעם אחת בלשונית (sessionStorage), ולכל היותר פעם בשבוע (localStorage).
 * - אחרי שלוש סגירות - לא מופיע יותר 90 יום. לחיצה על הכפתור = לא מופיע 90 יום.
 * - לא בדף בלוק הפופאפ עצמו, לא באזור הניהול/האישי ולא בדפי התחברות.
 */
const STORE_KEY = "weblok-promo";
const SESSION_KEY = "weblok-promo-shown";
const DAY = 24 * 60 * 60 * 1000;
const EXCLUDED = ["/blocks/popup", "/admin", "/dashboard", "/auth"];

interface PromoState {
  next: number;
  dismissals: number;
}

function readState(): PromoState {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) ?? "null");
    if (raw && typeof raw.next === "number" && typeof raw.dismissals === "number") return raw;
  } catch {
    /* אחסון חסום/פגום - מתחילים מחדש */
  }
  return { next: 0, dismissals: 0 };
}

function writeState(s: PromoState) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(s));
  } catch {
    /* אין אחסון - הפופאפ פשוט עלול להופיע שוב בלשונית הבאה */
  }
}

export function PromoPopup() {
  const { t } = useLocale();
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const excluded = EXCLUDED.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  useEffect(() => {
    if (excluded) {
      setOpen(false);
      return;
    }
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
    } catch {
      return; // בלי sessionStorage אין דרך להגביל תדירות - לא מציגים בכלל
    }
    if (readState().next > Date.now()) return;

    let done = false;
    const show = () => {
      if (done) return;
      done = true;
      cleanup();
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        /* ignore */
      }
      const s = readState();
      writeState({ ...s, next: Date.now() + 7 * DAY });
      setOpen(true);
    };
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0 && window.scrollY / max > 0.5) show();
    };
    const timer = window.setTimeout(show, 25_000);
    window.addEventListener("scroll", onScroll, { passive: true });
    const cleanup = () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
    return cleanup;
  }, [excluded]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && dismiss();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function dismiss() {
    const s = readState();
    const dismissals = s.dismissals + 1;
    writeState({ dismissals, next: Date.now() + (dismissals >= 3 ? 90 : 7) * DAY });
    setOpen(false);
  }

  function accept() {
    writeState({ ...readState(), next: Date.now() + 90 * DAY });
    setOpen(false);
  }

  if (!open || excluded) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="promo-title"
      aria-describedby="promo-body"
      className="fixed z-[45] bottom-[max(1rem,env(safe-area-inset-bottom))] inset-x-4 sm:inset-x-auto sm:start-6 sm:w-[340px] surface rounded-2xl p-4 pe-10 animate-promoIn"
    >
      <button
        ref={closeRef}
        onClick={dismiss}
        aria-label={t("common.close")}
        className="absolute top-2.5 end-2.5 p-1.5 rounded-full text-ink-secondary hover:text-ink-primary hover:bg-base-panel2 transition-colors"
      >
        <IconClose className="w-4 h-4" />
      </button>
      <div className="flex gap-3">
        <span className="relative shrink-0 w-11 h-11 rounded-xl bg-accent/15 flex items-center justify-center text-2xl">
          <span className="absolute inset-0 rounded-xl ring-2 ring-accent/40 animate-ping [animation-duration:2.4s]" aria-hidden />
          <AppIcon name="popup" />
        </span>
        <div className="min-w-0">
          <p id="promo-title" className="font-bold text-ink-primary leading-snug">
            {t("promo.title")}
          </p>
          <p id="promo-body" className="text-sm text-ink-secondary mt-1 leading-relaxed">
            {t("promo.body")}
          </p>
          <Link href="/blocks/popup" onClick={accept} className="btn-primary btn-sm mt-3">
            {t("promo.cta")}
          </Link>
        </div>
      </div>
    </div>
  );
}
