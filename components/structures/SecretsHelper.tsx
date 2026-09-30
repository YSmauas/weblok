"use client";

import { useState } from "react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { copyText } from "@/lib/download";

// בלי תווים שמתבלבלים (0/O, 1/l/I) - קל להקליד מהטלפון
const ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomPassword(len = 18): string {
  const out: string[] = [];
  const buf = new Uint32Array(1);
  while (out.length < len) {
    crypto.getRandomValues(buf);
    // דחיית ערכים בקצה כדי למנוע הטיה (modulo bias)
    const limit = Math.floor(0x100000000 / ALPHABET.length) * ALPHABET.length;
    if (buf[0] < limit) out.push(ALPHABET[buf[0] % ALPHABET.length]);
  }
  return out.join("");
}

function randomHex(bytes = 32): string {
  const b = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}

/**
 * מחולל סודות לדף הניהול - נוצרים בדפדפן (crypto.getRandomValues), מוצגים
 * להעתקה ל-Vercel בלבד. לא נכנסים לקבצי הפרויקט ולא נשמרים בשום מקום.
 */
export function SecretsHelper() {
  const { t } = useLocale();
  const [values, setValues] = useState<{ ADMIN_PASSWORD: string; ADMIN_SESSION_SECRET: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(name: string, value: string) {
    if (await copyText(value)) {
      setCopied(name);
      setTimeout(() => setCopied(null), 1500);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-ink-secondary leading-relaxed">{t("structures.secrets.text")}</p>
      <button
        type="button"
        onClick={() => setValues({ ADMIN_PASSWORD: randomPassword(), ADMIN_SESSION_SECRET: randomHex() })}
        className="btn-outline btn-sm"
      >
        {t(values ? "structures.secrets.regenerate" : "structures.secrets.generate")}
      </button>
      {values && (
        <dl className="space-y-2">
          {Object.entries(values).map(([name, value]) => (
            <div key={name} className="rounded-xl border border-base-border bg-base-bg/60 p-2.5">
              <dt className="text-[11px] font-semibold text-ink-muted" dir="ltr">
                {name}
              </dt>
              <dd className="mt-1 flex items-center gap-2">
                <code className="min-w-0 flex-1 break-all text-xs font-mono text-ink-primary" dir="ltr">
                  {value}
                </code>
                <button type="button" onClick={() => copy(name, value)} className="btn-outline btn-sm shrink-0">
                  {t(copied === name ? "common.copied" : "common.copy")}
                </button>
              </dd>
            </div>
          ))}
        </dl>
      )}
      {values && <p className="text-[11px] text-ink-muted leading-relaxed">{t("structures.secrets.note")}</p>}
    </div>
  );
}
