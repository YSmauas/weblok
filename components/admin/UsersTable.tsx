"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { canManageAdmins, type Role } from "@/lib/auth/roles";
import { useLocale } from "@/lib/i18n/locale-provider";

type Status = "active" | "warned" | "suspended";

export interface UserRow {
  id: string;
  name: string | null;
  email: string;
  role: Exclude<Role, "guest">;
  status: Status;
  created_at: string;
  last_sign_in_at: string | null;
}

const STATUS_COLOR: Record<Status, string> = {
  active: "text-success",
  warned: "text-accent",
  suspended: "text-danger",
};

/**
 * הכפתורים כאן הם נוחות בלבד. כל פעולה נשלחת ל-/api/admin/users/:id, שבודק
 * הרשאה בשרת, ומשם לפונקציות DB שבודקות אותה שוב - אין אמון ב-UI.
 */
export function UsersTable({
  rows,
  currentUserId,
  currentUserRole,
}: {
  rows: UserRow[];
  currentUserId: string;
  currentUserRole: Role;
}) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const canManage = canManageAdmins(currentUserRole);

  async function patch(id: string, body: { status?: Status; role?: "user" | "admin" }) {
    setBusyId(id);
    setError(false);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null);
    setBusyId(null);
    if (res?.ok) router.refresh();
    else setError(true);
  }

  const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString(locale) : t("admin.never");
  const roleLabel = (r: UserRow["role"]) =>
    t(r === "owner" ? "admin.roleOwner" : r === "admin" ? "admin.roleAdmin" : "admin.roleUser");
  const btn = "text-xs border border-base-border rounded-full px-3 py-1 transition-colors disabled:opacity-50";

  return (
    <div className="overflow-x-auto rounded-card border border-base-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-base-panel2 text-ink-secondary text-start">
            {["admin.colUser", "admin.colJoined", "admin.colLast", "admin.colRole", "admin.colStatus", "admin.colActions"].map((k) => (
              <th key={k} className="px-4 py-3 font-medium text-start">{t(k)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            // בעלים לא ניתן לשינוי; מנהל ניתן לשינוי רק ע"י בעלים; לא משנים את עצמך.
            const locked = r.role === "owner" || r.id === currentUserId || (r.role === "admin" && !canManage);
            return (
              <tr key={r.id} className="border-t border-base-border">
                <td className="px-4 py-3">
                  <p className="font-medium">{r.name || "—"}</p>
                  <p className="text-xs text-ink-muted" dir="ltr">{r.email}</p>
                </td>
                <td className="px-4 py-3 text-ink-secondary">{fmt(r.created_at)}</td>
                <td className="px-4 py-3 text-ink-secondary">{fmt(r.last_sign_in_at)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full border ${r.role === "user" ? "border-base-border text-ink-secondary" : "border-accent text-accent"}`}>
                    {roleLabel(r.role)}
                  </span>
                </td>
                <td className={`px-4 py-3 font-medium ${STATUS_COLOR[r.status]}`}>
                  {t(`admin.status.${r.status}`)}
                </td>
                <td className="px-4 py-3">
                  {!locked && (
                    <div className="flex gap-2 flex-wrap">
                      <button disabled={busyId === r.id} onClick={() => patch(r.id, { status: "warned" })} className={`${btn} hover:border-accent`}>
                        {t("admin.warn")}
                      </button>
                      {r.status === "suspended" ? (
                        <button disabled={busyId === r.id} onClick={() => patch(r.id, { status: "active" })} className={`${btn} hover:border-success`}>
                          {t("admin.unsuspend")}
                        </button>
                      ) : (
                        <button disabled={busyId === r.id} onClick={() => patch(r.id, { status: "suspended" })} className={`${btn} text-danger hover:border-danger`}>
                          {t("admin.suspend")}
                        </button>
                      )}
                      {canManage && (
                        <button
                          disabled={busyId === r.id}
                          onClick={() => patch(r.id, { role: r.role === "admin" ? "user" : "admin" })}
                          className="text-xs border border-accent/50 text-accent rounded-full px-3 py-1 hover:bg-accent/10 transition-colors disabled:opacity-50"
                        >
                          {r.role === "admin" ? t("admin.removeAdmin") : t("admin.makeAdmin")}
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {error && <p role="alert" className="text-xs text-danger px-4 py-3 border-t border-base-border">{t("common.error")}</p>}
      {!canManage && (
        <p className="text-xs text-ink-muted px-4 py-3 border-t border-base-border">{t("admin.ownerOnly")}</p>
      )}
    </div>
  );
}
