"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/lib/i18n/locale-provider";

export function ProfileNameForm({
  userId,
  name: initialName,
  email,
}: {
  userId: string;
  name: string;
  email: string;
}) {
  const { t } = useLocale();
  const [name, setName] = useState(initialName);
  const [state, setState] = useState<"idle" | "saved" | "error">("idle");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await createClient()
      .from("profiles")
      .update({ name: name.trim() })
      .eq("id", userId);
    setState(error ? "error" : "saved");
  }

  const input = "w-full bg-base-bg border border-base-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent";
  return (
    <form onSubmit={save} className="grid sm:grid-cols-2 gap-4">
      <div>
        <label className="text-xs text-ink-muted mb-1 block">{t("auth.fullName")}</label>
        <input value={name} maxLength={80} required onChange={(e) => { setName(e.target.value); setState("idle"); }} className={input} />
      </div>
      <div>
        <label className="text-xs text-ink-muted mb-1 block">{t("auth.email")}</label>
        <input value={email} disabled dir="ltr" className={`${input} text-ink-muted`} />
      </div>
      <div className="sm:col-span-2 flex items-center gap-3">
        <button type="submit" className="text-xs bg-accent text-base-bg font-semibold rounded-full px-4 py-1.5 hover:bg-accent-hover transition-colors">
          {state === "saved" ? t("common.saved") : t("common.save")}
        </button>
        {state === "error" && <span role="alert" className="text-xs text-danger">{t("common.error")}</span>}
      </div>
    </form>
  );
}
