"use client";

import { useEffect, useState } from "react";
import { IconClose } from "../ui/Icons";

type Tab = "about" | "privacy" | "accessibility";

const TABS: { id: Tab; label: string }[] = [
  { id: "about", label: "אודות" },
  { id: "privacy", label: "פרטיות" },
  { id: "accessibility", label: "נגישות" },
];

export function AboutModal({
  open,
  initialTab = "about",
  onClose,
}: {
  open: boolean;
  initialTab?: Tab;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);

  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <button
        aria-label="סגירה"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <div className="relative w-full max-w-lg glass rounded-card shadow-2xl animate-[fadeIn_0.2s_ease]">
        <div className="flex items-center justify-between px-5 pt-5">
          <div className="flex gap-1 bg-base-bg/50 rounded-full p-1 border border-base-border">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`text-sm px-4 py-1.5 rounded-full transition-colors ${
                  tab === t.id
                    ? "bg-accent text-base-bg font-semibold"
                    : "text-ink-secondary hover:text-ink-primary"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            onClick={onClose}
            aria-label="סגירה"
            className="text-ink-muted hover:text-ink-primary transition-colors"
          >
            <IconClose className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-6 text-sm text-ink-secondary leading-relaxed max-h-[60vh] overflow-y-auto">
          {tab === "about" && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-ink-primary">על WEblok</h3>
              <p>
                WEblok היא ספריית בלוקים מוכנים להטמעה באתרים — כל בלוק ניתן
                לעריכה חיה ולהורדה כקוד עצמאי, בלי צורך לבנות הכל מאפס.
              </p>
            </div>
          )}
          {tab === "privacy" && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-ink-primary">מדיניות פרטיות</h3>
              <p>כאן יופיע נוסח מדיניות הפרטיות המלא של האתר.</p>
            </div>
          )}
          {tab === "accessibility" && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-ink-primary">הצהרת נגישות</h3>
              <p>כאן תופיע הצהרת הנגישות המלאה של האתר.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  }

