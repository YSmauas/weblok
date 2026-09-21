"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/lib/i18n/locale-provider";

// כל אווטאר הוא רק צורת SVG פשוטה בגווני הפאלטה שלנו - נשמר ב-DB כמזהה
// מחרוזת בלבד (למשל "leaf"), בלי שום קובץ תמונה ובלי צורך באחסון קבצים.
const AVATARS = [{ id: "leaf" }, { id: "puzzle" }, { id: "spark" }, { id: "wave" }, { id: "moon" }, { id: "hex" }] as const;

function AvatarGlyph({ id }: { id: string }) {
  const common = { stroke: "var(--accent)", strokeWidth: 1.6, fill: "none" } as const;
  switch (id) {
    case "leaf":
      return (
        <svg viewBox="0 0 24 24" className="w-6 h-6">
          <path {...common} d="M5 19c8 0 14-6 14-14-8 0-14 6-14 14Z" />
        </svg>
      );
    case "puzzle":
      return (
        <svg viewBox="0 0 24 24" className="w-6 h-6">
          <path
            {...common}
            d="M6 4h4c.3 2 2 2 2.4 0H16v4c2 .3 2 2 0 2.4V14h-3.6c-.4-2-2-2-2.4 0H6v-3.6c-2-.4-2-2 0-2.4V4Z"
          />
        </svg>
      );
    case "spark":
      return (
        <svg viewBox="0 0 24 24" className="w-6 h-6">
          <path {...common} d="M12 3v6M12 15v6M3 12h6M15 12h6" strokeLinecap="round" />
        </svg>
      );
    case "wave":
      return (
        <svg viewBox="0 0 24 24" className="w-6 h-6">
          <path {...common} d="M3 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0" strokeLinecap="round" />
        </svg>
      );
    case "moon":
      return (
        <svg viewBox="0 0 24 24" className="w-6 h-6">
          <path {...common} d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
        </svg>
      );
    case "hex":
      return (
        <svg viewBox="0 0 24 24" className="w-6 h-6">
          <path {...common} d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
        </svg>
      );
    default:
      return null;
  }
}

export function AvatarPicker({ userId, initial }: { userId: string; initial: string }) {
  const { t } = useLocale();
  const [selected, setSelected] = useState<string>(initial);
  const [error, setError] = useState(false);

  const save = async (id: string) => {
    const prev = selected;
    setSelected(id);
    setError(false);
    // נשמר כמחרוזת בעמודת avatar בטבלת profiles. RLS + הרשאת עמודה מבטיחים
    // שמשתמש יכול לעדכן רק את השורה שלו, ורק name/avatar.
    const { error } = await createClient().from("profiles").update({ avatar: id }).eq("id", userId);
    if (error) {
      setSelected(prev);
      setError(true);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {AVATARS.map((a) => (
          <button
            key={a.id}
            onClick={() => save(a.id)}
            title={t(`avatar.${a.id}`)}
            aria-label={t(`avatar.${a.id}`)}
            aria-pressed={selected === a.id}
            className={`w-12 h-12 rounded-full flex items-center justify-center border transition-colors ${
              selected === a.id
                ? "border-accent bg-accent/10"
                : "border-base-border hover:border-accent/50"
            }`}
          >
            <AvatarGlyph id={a.id} />
          </button>
        ))}
      </div>
      {error && <p role="alert" className="text-xs text-danger mt-2">{t("common.error")}</p>}
    </div>
  );
}
