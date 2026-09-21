"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/lib/i18n/locale-provider";

/** מחיקת עיצוב שמור או פרויקט. RLS מבטיח שרק הבעלים של השורה יכול למחוק. */
export function DeleteRow({ table, id }: { table: "saved_designs" | "projects"; id: string }) {
  const { t } = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function del() {
    setBusy(true);
    const { error } = await createClient().from(table).delete().eq("id", id);
    setBusy(false);
    if (!error) router.refresh();
  }

  return (
    <button onClick={del} disabled={busy} className="text-xs text-danger hover:underline disabled:opacity-60">
      {t("common.delete")}
    </button>
  );
}

export function NewProjectButton({ userId }: { userId: string }) {
  const { t } = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true);
    const { error } = await createClient()
      .from("projects")
      .insert({ user_id: userId, name: t("projects.defaultName") });
    setBusy(false);
    if (!error) router.refresh();
  }

  return (
    <button onClick={create} disabled={busy} className="text-sm bg-accent text-base-bg font-semibold rounded-full px-5 py-2 hover:bg-accent-hover transition-colors disabled:opacity-60">
      {t("projects.new")}
    </button>
  );
}
