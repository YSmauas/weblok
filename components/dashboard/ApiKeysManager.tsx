"use client";

import { useEffect, useState } from "react";
import { IconKey } from "../ui/Icons";
import { useLocale } from "@/lib/i18n/locale-provider";
import { hasBrowserKey, removeBrowserKey, writeBrowserKey, type AiProvider } from "@/lib/ai/client";
import { validateGeminiKey } from "@/lib/ai/gemini";

type StorageMode = "server" | "browser";
type Note = "verified" | "no_model" | "unverified";

/** מפתחות i18n כתובים במפורש (ולא נבנים דינמית), כדי שבדיקת התרגום תזהה אותם */
const NOTE_KEYS: Record<Note, string> = {
  verified: "keys.verified",
  no_model: "keys.warnNoModel",
  unverified: "keys.warnUnverified",
};
const CHECK_ERROR_KEYS: Record<string, string> = {
  invalid_key: "ai.err.invalid_key",
  region: "ai.err.region",
  api_disabled: "ai.err.api_disabled",
};

interface KeyState {
  provider: string;
  label: string;
  value: string;
  storage: StorageMode;
  configured: boolean; // קיים מפתח שמור בשרת (הערך עצמו אף פעם לא חוזר ללקוח)
  inBrowser: boolean; // קיים מפתח ששמור בדפדפן הזה בלבד
  saved: boolean;
  error: boolean;
  errorCode: string | null;
  checking: boolean; // בדיקת המפתח מול Google מתבצעת כרגע
  note: Note | null; // תוצאת הבדיקה אחרי שמירה מוצלחת
}

const PROVIDERS: { provider: AiProvider; label: string }[] = [{ provider: "gemini", label: "Google Gemini" }];

export function ApiKeysManager({ configuredProviders }: { configuredProviders: string[] }) {
  const { t } = useLocale();
  const [keys, setKeys] = useState<KeyState[]>(
    PROVIDERS.map((p) => ({
      ...p,
      value: "",
      storage: "server",
      configured: configuredProviders.includes(p.provider),
      inBrowser: false,
      saved: false,
      error: false,
      errorCode: null as string | null,
      checking: false,
      note: null as Note | null,
    }))
  );

  const update = (provider: string, patch: Partial<KeyState>) =>
    setKeys((prev) => prev.map((k) => (k.provider === provider ? { ...k, ...patch } : k)));

  // localStorage זמין רק בדפדפן - בודקים אחרי הטעינה אם כבר שמור מפתח מקומי
  useEffect(() => {
    setKeys((prev) =>
      prev.map((k) => {
        const inBrowser = hasBrowserKey(k.provider as AiProvider);
        return inBrowser ? { ...k, inBrowser, storage: k.configured ? k.storage : "browser" } : k;
      })
    );
  }, []);

  async function save(k: KeyState) {
    const value = k.value.trim();
    if (value.length < 8) return update(k.provider, { error: true, saved: false, errorCode: null, note: null });

    // בדיקה מול Google לפני השמירה (מהדפדפן ישירות - המפתח לא עובר בשרת שלנו לצורך הבדיקה)
    update(k.provider, { checking: true, error: false, errorCode: null, saved: false, note: null });
    const check = await validateGeminiKey(value);
    if (check.status === "invalid") {
      return update(k.provider, { checking: false, error: true, errorCode: check.status + ":" + check.code });
    }
    const note: Note = check.status === "valid" ? "verified" : check.status === "no_model" ? "no_model" : "unverified";
    update(k.provider, { checking: false });

    if (k.storage === "browser") {
      // נשמר רק בדפדפן הזה ולא נשלח לשרת - מוצפן עם מפתח שאי אפשר לייצא (lib/ai/key-vault.ts).
      if (await writeBrowserKey(value, k.provider as AiProvider)) {
        update(k.provider, { saved: true, error: false, value: "", inBrowser: true, note });
      } else {
        update(k.provider, { error: true, saved: false });
      }
      return;
    }

    const res = await fetch("/api/keys", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: k.provider, value }),
    }).catch(() => null);
    if (res?.ok) {
      update(k.provider, { saved: true, error: false, errorCode: null, configured: true, value: "", note });
      return;
    }
    const body = await res?.json().catch(() => null);
    update(k.provider, { error: true, saved: false, errorCode: body?.error ?? null });
  }

  async function remove(k: KeyState) {
    if (k.storage === "browser") {
      removeBrowserKey(k.provider as AiProvider);
      update(k.provider, { inBrowser: false, saved: false, error: false });
      return;
    }
    const res = await fetch(`/api/keys?provider=${encodeURIComponent(k.provider)}`, {
      method: "DELETE",
    }).catch(() => null);
    if (res?.ok) update(k.provider, { configured: false, saved: false, error: false });
    else update(k.provider, { error: true });
  }

  return (
    <div className="space-y-4">
      {keys.map((k) => (
        <div key={k.provider} className="border border-base-border rounded-xl p-4 bg-base-bg/40">
          <div className="flex items-center gap-2 mb-3">
            <IconKey className="w-4 h-4 text-accent" />
            <span className="font-medium text-sm">{k.label}</span>
          </div>

          <input
            type="password"
            autoComplete="off"
            value={k.value}
            onChange={(e) => update(k.provider, { value: e.target.value, saved: false, error: false, note: null })}
            placeholder={(k.storage === "server" ? k.configured : k.inBrowser) ? "••••••••" : t("keys.placeholder")}
            dir="ltr"
            className="w-full bg-base-panel border border-base-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent transition-colors font-mono"
          />

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-1 bg-base-panel rounded-full p-1 border border-base-border">
              {(
                [
                  { id: "server", label: t("keys.modeServer") },
                  { id: "browser", label: t("keys.modeBrowser") },
                ] as { id: StorageMode; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => update(k.provider, { storage: opt.id, saved: false })}
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

            <div className="flex gap-2">
              {(k.storage === "server" ? k.configured : k.inBrowser) && (
                <button
                  onClick={() => remove(k)}
                  className="text-xs border border-base-border text-danger rounded-full px-4 py-1.5 hover:border-danger transition-colors"
                >
                  {t("keys.remove")}
                </button>
              )}
              <button
                onClick={() => save(k)}
                disabled={k.checking}
                className="text-xs bg-accent text-base-bg font-semibold rounded-full px-4 py-1.5 hover:bg-accent-hover transition-colors disabled:opacity-60 disabled:cursor-wait"
              >
                {k.checking ? t("keys.checking") : k.saved ? t("common.saved") : t("common.save")}
              </button>
            </div>
          </div>

          {k.error && (
            <p role="alert" className="text-xs text-danger mt-2">
              {k.errorCode === "server_not_configured"
                ? t("keys.errorNotConfigured")
                : k.errorCode?.startsWith("invalid:")
                  ? t(CHECK_ERROR_KEYS[k.errorCode.slice(8)] ?? "ai.err.invalid_key")
                  : t("common.error")}
            </p>
          )}
          {k.note && !k.error && (
            <p role="status" className={`text-xs mt-2 ${k.note === "verified" ? "text-success" : "text-ink-secondary"}`}>
              {t(NOTE_KEYS[k.note])}
            </p>
          )}
          <p className="text-[11px] text-ink-muted mt-2">
            {k.storage === "server"
              ? k.configured
                ? t("keys.configured")
                : t("keys.hintServer")
              : k.inBrowser
                ? t("keys.browserConfigured")
                : t("keys.hintBrowser")}
          </p>
        </div>
      ))}
    </div>
  );
}
