import { createClient } from "@/lib/supabase/server";
import type { Role } from "./roles";

export type AccountStatus = "active" | "warned" | "suspended";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: AccountStatus;
}

/**
 * מחזיר את המשתמש המחובר (מאומת מול Supabase) יחד עם התפקיד שלו מטבלת profiles,
 * או null אם אין משתמש מחובר. התפקיד נקרא מה-DB בלבד - לעולם לא מעוגייה או מהלקוח.
 * מיועד ל-Server Components ול-Route Handlers.
 */
export async function getSession(): Promise<SessionUser | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role, status")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    name: profile?.name ?? user.email ?? "",
    email: user.email ?? "",
    role: (profile?.role as Role) ?? "user",
    status: (profile?.status as AccountStatus) ?? "active",
  };
}
