"use client";

import { useState } from "react";
import { useLocale } from "@/lib/i18n/locale-provider";

const field =
  "w-full bg-base-bg border border-base-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent";

export function ContactForm({
  prefill,
  showSubject = true,
  panel = false,
}: {
  prefill?: { name: string; email: string };
  showSubject?: boolean;
  /** מראה הטופס הציבורי (שדות מעוגלים על רקע פאנל) */
  panel?: boolean;
}) {
  const { t } = useLocale();
  const [name, setName] = useState(prefill?.name ?? "");
  const [email, setEmail] = useState(prefill?.email ?? "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");

  const cls = panel
    ? "w-full bg-base-panel border border-base-border rounded-xl px-4 py-3 text-sm outline-none focus:border-accent transition-colors"
    : field;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus("idle");
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, subject, message }),
    }).catch(() => null);
    setBusy(false);
    if (res?.ok) {
      setStatus("sent");
      setSubject("");
      setMessage("");
    } else {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {!prefill && (
        <>
          <input required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} placeholder={t("contact.name")} className={cls} />
          <input required type="email" maxLength={200} dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("contact.email")} className={cls} />
        </>
      )}
      {showSubject && (
        <input maxLength={200} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={t("contact.subject")} className={cls} />
      )}
      <textarea
        required
        rows={4}
        maxLength={5000}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={t("contact.message")}
        className={`${cls} resize-y`}
      />
      {status === "sent" && <p role="status" className="text-sm text-success">{t("contact.sent")}</p>}
      {status === "error" && <p role="alert" className="text-sm text-danger">{t("common.error")}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full sm:w-auto bg-accent text-base-bg font-semibold rounded-full px-6 py-2.5 hover:bg-accent-hover transition-colors disabled:opacity-60"
      >
        {t("contact.submit")}
      </button>
    </form>
  );
}
