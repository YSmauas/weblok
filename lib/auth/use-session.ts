"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Role } from "./roles";

export interface ClientSession {
  loading: boolean;
  loggedIn: boolean;
  role: Role;
}

/**
 * מצב ההתחברות לצורכי תצוגה בלבד (הצגת/הסתרת קישורים).
 * זו לא אבטחה - האכיפה האמיתית ב-middleware, בנתיבי ה-API וב-RLS.
 */
export function useSession(): ClientSession {
  const [state, setState] = useState<ClientSession>({
    loading: true,
    loggedIn: false,
    role: "guest",
  });

  useEffect(() => {
    const supabase = createClient();
    let alive = true;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!alive) return;
      if (!user) {
        setState({ loading: false, loggedIn: false, role: "guest" });
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (!alive) return;
      setState({ loading: false, loggedIn: true, role: (profile?.role as Role) ?? "user" });
    }

    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
