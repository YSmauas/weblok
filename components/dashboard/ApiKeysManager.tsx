"use client";

import { useState } from "react";
import { IconKey } from "../ui/Icons";
import { useLocale } from "@/lib/i18n/locale-provider";

type StorageMode = "server" | "browser";

interface KeyState {
  provider: string;
  label: string;
  value: string;
  storage: StorageMode;
  configured: boolean; // קיים מפתח שמור בשרת (הערך עצמו אף פעם לא חוזר ללקוח)
  saved: boolean;
  error: boolean;
  errorCode: string | null;
}

const PROVIDERS = [{ provider: "gemini", label: "Google Gemini" }];
const LS_KEY = (p: string) => `weblok-apikey-${p}`;

export function ApiKeysManager({ configuredProviders }: { configuredProviders: string[] }) {
  const { t } = useLocale();
  const [keys, setKeys] = useState<KeyState[]>(
    PROVIDERS.map((p) => ({
      ...p,
      value: "",
      storage: "server",
      configured: configuredProviders.includes(p.provider),
      saved: false,
      error: false,
      errorCode: null as string | null,
    }))
  );

  const update = (provider: string, patch: Partial<KeyState>) =>
    setKeys((prev) => prev.map((k) => (k.provider === provider ? { ...k, ...patch } : k)));

  async function save(k: KeyState) {
    const value = k.value.trim();
    if (value.length < 8) return update(k.provider, { error: true, saved: false, errorCode: null });

    if (k.storage === "browser") {
      // נשמר רק בדפדפן הזה ולא נשלח לשרת. שימו לב: localStorage אינו מוצפן.
      try {
        localStorage.setItem(LS_KEY(k.provider), value);
        update(k.provider, { saved: true, error: false, value: "" });
      } catch {
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
      update(k.provider, { saved: true, error: false, errorCode: null, configured: true, value: "" });
      return;
    }
    const body = await res?.json().catch(() => null);
    update(k.provider, { error: true, saved: false, errorCode: body?.error ?? null });
  }

  async function remove(k: KeyState) {
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
            onChange={(e) => update(k.provider, { value: e.target.value, saved: false, error: false })}
            placeholder={k.configured && k.storage === "server" ? "••••••••" : t("keys.placeholder")}
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
              {k.configured && k.storage === "server" && (
                <button
                  onClick={() => remove(k)}
                  className="text-xs border border-base-border text-danger rounded-full px-4 py-1.5 hover:border-danger transition-colors"
                >
                  {t("keys.remove")}
                </button>
              )}
              <button
                onClick={() => save(k)}
                className="text-xs bg-accent text-base-bg font-semibold rounded-full px-4 py-1.5 hover:bg-accent-hover transition-colors"
              >
                {k.saved ? t("common.saved") : t("common.save")}
              </button>
            </div>
          </div>

          {k.error && (
            <p role="alert" className="text-xs text-danger mt-2">
              {k.errorCode === "server_not_configured" ? t("keys.errorNotConfigured") : t("common.error")}
            </p>
          )}
          <p className="text-[11px] text-ink-muted mt-2">
            {k.storage === "server"
              ? k.configured
                ? t("keys.configured")
                : t("keys.hintServer")
              : t("keys.hintBrowser")}
          </p>
        </div>
      ))}
    </div>
  );
}
