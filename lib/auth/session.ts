import type { Role } from "./roles";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

/**
 * TODO: להחליף במימוש אמיתי מול Supabase Auth, לדוגמה:
 *
 *   import { createServerClient } from '@supabase/ssr';
 *   import { cookies } from 'next/headers';
 *
 *   export async function getSession(): Promise<SessionUser | null> {
 *     const supabase = createServerClient(url, publishableKey, { cookies: () => cookies() });
 *     const { data: { user } } = await supabase.auth.getUser();
 *     if (!user) return null;
 *     const { data: profile } = await supabase
 *       .from('profiles')
 *       .select('role, name')
 *       .eq('id', user.id)
 *       .single();
 *     return { id: user.id, name: profile?.name ?? '', email: user.email!, role: profile?.role ?? 'user' };
 *   }
 *
 * שדה ה-role חייב להיות עמודה בטבלת profiles ב-Supabase, מוגנת ב-RLS כך
 * שרק פונקציה מאובטחת בצד שרת (לא המשתמש עצמו) יכולה לשנות אותה - בדיוק
 * כמו שראינו בסכמה של כושרמט לגבי is_admin.
 */
export async function getSession(): Promise<SessionUser | null> {
  return null;
}
