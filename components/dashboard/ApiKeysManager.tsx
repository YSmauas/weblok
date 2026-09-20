"use client";

import { useState } from "react";
import { IconKey } from "../ui/Icons";

type StorageMode = "server" | "browser";

interface KeyState {
  provider: string;
  label: string;
  value: string;
  storage: StorageMode;
  saved: boolean;
}

const INITIAL: KeyState[] = [
  { provider: "gemini", label: "Google Gemini", value: "", storage: "server", saved: false },
];

export function ApiKeysManager() {
  const [keys, setKeys] = useState<KeyState[]>(INITIAL);

  const update = (provider: string, patch: Partial<KeyState>) => {
    setKeys((prev) =>
      prev.map((k) => (k.provider === provider ? { ...k, ...patch, saved: false } : k))
    );
  };

  const save = (provider: string) => {
    // TODO: אם storage === 'server' - לשלוח ל-/api/keys להצפנה ושמירה ב-DB.
    // אם storage === 'browser' - לשמור מוצפן קלות ב-localStorage בלבד, ולא לשלוח לשרת בכלל.
    update(provider, { saved: true });
  };

  return (
    <div className="space-y-4">
      {keys.map((k) => (
        <div
          key={k.provider}
          className="border border-base-border rounded-xl p-4 bg-base-bg/40"
        >
          <div className="flex items-center gap-2 mb-3">
            <IconKey className="w-4 h-4 text-accent" />
            <span className="font-medium text-sm">{k.label}</span>
          </div>

          <input
            type="password"
            value={k.value}
            onChange={(e) => update(k.provider, { value: e.target.value })}
            placeholder="הדבק כאן את המפתח שלך"
            dir="ltr"
            className="w-full bg-base-panel border border-base-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent transition-colors font-mono"
          />

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-1 bg-base-panel rounded-full p-1 border border-base-border">
              {(
                [
                  { id: "server", label: "שמירה בשרת (מוצפן)" },
                  { id: "browser", label: "בדפדפן בלבד" },
                ] as { id: StorageMode; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => update(k.provider, { storage: opt.id })}
                  className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                    k.storage === opt.id
                      ? "bg-accent text-base-bg font-semibold"
                      : "text-ink-secondary hover:text-ink-primary"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => save(k.provider)}
              className="text-xs bg-accent text-base-bg font-semibold rounded-full px-4 py-1.5 hover:bg-accent-hover transition-colors"
            >
              {k.saved ? "נשמר ✓" : "שמירה"}
            </button>
          </div>

          <p className="text-[11px] text-ink-muted mt-2">
            {k.storage === "server"
              ? "המפתח יוצפן ב-DB ולא ייחשף בקוד שיוצא ללקוח - נדרש כדי להשתמש בעריכה עם AI."
              : "המפתח נשמר רק בדפדפן הזה ולא מגיע לשרת בכלל - תצטרך להזין אותו שוב במחשב אחר."}
          </p>
        </div>
      ))}
    </div>
  );
}
