"use client";

import { useState } from "react";
import { canManageAdmins, type Role } from "@/lib/auth/roles";

type Status = "active" | "warned" | "suspended";

interface UserRow {
  id: string;
  name: string;
  email: string;
  joined: string;
  lastSeen: string;
  status: Status;
  role: Role;
}

// TODO: יוחלף בשליפה אמיתית מה-DB, ו-currentUserRole ב-session אמיתי
const currentUserRole: Role = "owner";

const INITIAL: UserRow[] = [
  {
    id: "1",
    name: "דוגמה בלבד",
    email: "demo@example.com",
    joined: "01.09.2026",
    lastSeen: "היום",
    status: "active",
    role: "user",
  },
];

const STATUS_LABEL: Record<Status, string> = {
  active: "פעיל",
  warned: "הוזהר",
  suspended: "מושעה",
};

const STATUS_COLOR: Record<Status, string> = {
  active: "text-success",
  warned: "text-accent",
  suspended: "text-danger",
};

export function UsersTable() {
  const [rows, setRows] = useState<UserRow[]>(INITIAL);
  const canManage = canManageAdmins(currentUserRole);

  const setStatus = (id: string, status: Status) => {
    // TODO: קריאה ל-/api/admin/users/:id (מאומת ומוגן ב-RLS בצד השרת)
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const toggleAdmin = (id: string) => {
    // TODO: פעולה זו חייבת להיבדק גם בצד השרת ש-currentUser.role === 'owner',
    // לא רק כאן ב-UI - זו רק הגנה קוסמטית, לא אבטחה אמיתית.
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, role: r.role === "admin" ? "user" : "admin" } : r))
    );
  };

  return (
    <div className="overflow-x-auto rounded-card border border-base-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-base-panel2 text-ink-secondary text-start">
            <th className="px-4 py-3 font-medium">משתמש</th>
            <th className="px-4 py-3 font-medium">הצטרפות</th>
            <th className="px-4 py-3 font-medium">כניסה אחרונה</th>
            <th className="px-4 py-3 font-medium">תפקיד</th>
            <th className="px-4 py-3 font-medium">סטטוס</th>
            <th className="px-4 py-3 font-medium">פעולות</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-base-border">
              <td className="px-4 py-3">
                <p className="font-medium">{r.name}</p>
                <p className="text-xs text-ink-muted" dir="ltr">
                  {r.email}
                </p>
              </td>
              <td className="px-4 py-3 text-ink-secondary">{r.joined}</td>
              <td className="px-4 py-3 text-ink-secondary">{r.lastSeen}</td>
              <td className="px-4 py-3">
                <span
                  className={`text-xs px-2 py-1 rounded-full border ${
                    r.role === "admin"
                      ? "border-accent text-accent"
                      : "border-base-border text-ink-secondary"
                  }`}
                >
                  {r.role === "admin" ? "מנהל" : "משתמש"}
                </span>
              </td>
              <td className={`px-4 py-3 font-medium ${STATUS_COLOR[r.status]}`}>
                {STATUS_LABEL[r.status]}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setStatus(r.id, "warned")}
                    className="text-xs border border-base-border rounded-full px-3 py-1 hover:border-accent transition-colors"
                  >
                    הזהרה
                  </button>
                  {r.status === "suspended" ? (
                    <button
                      onClick={() => setStatus(r.id, "active")}
                      className="text-xs border border-base-border rounded-full px-3 py-1 hover:border-success transition-colors"
                    >
                      ביטול השעיה
                    </button>
                  ) : (
                    <button
                      onClick={() => setStatus(r.id, "suspended")}
                      className="text-xs border border-base-border text-danger rounded-full px-3 py-1 hover:border-danger transition-colors"
                    >
                      השעיה
                    </button>
                  )}

                  {/* כפתור ניהול-מנהלים מוצג רק לבעלים */}
                  {canManage && (
                    <button
                      onClick={() => toggleAdmin(r.id)}
                      className="text-xs border border-accent/50 text-accent rounded-full px-3 py-1 hover:bg-accent/10 transition-colors"
                    >
                      {r.role === "admin" ? "הסרת הרשאת מנהל" : "הפיכה למנהל"}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {!canManage && (
        <p className="text-xs text-ink-muted px-4 py-3 border-t border-base-border">
          רק הבעלים יכול למנות או להסיר מנהלים.
        </p>
      )}
    </div>
  );
}
