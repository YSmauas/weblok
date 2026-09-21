"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/lib/i18n/locale-provider";

/** חיבור חשבון GitHub לחשבון הקיים (linkIdentity - דורש Manual Linking מופעל ב-Supabase Auth). */
export function GithubConnect({ connected }: { connected: boolean }) {
  const { t } = useLocale();
  const [error, setError] = useState(false);

  if (connected) return <span className="text-sm text-success">{t("profile.githubConnected")}</span>;

  async function connect() {
    setError(false);
    const { error } = await createClient().auth.linkIdentity({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/profile` },
    });
    if (error) setError(true);
  }

  return (
    <div>
      <button onClick={connect} className="text-sm bg-base-panel2 border border-base-border rounded-full px-5 py-2 hover:border-accent transition-colors">
        {t("profile.githubConnect")}
      </button>
      {error && <p role="alert" className="text-xs text-danger mt-2">{t("common.error")}</p>}
    </div>
  );
}
