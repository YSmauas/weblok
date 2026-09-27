"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Role } from "./roles";

export interface ClientSession {
  loading: boolean;
  loggedIn: boolean;
  role: Role;
}

const INITIAL: ClientSession = { loading: true, loggedIn: false, role: "guest" };
const SessionContext = createContext<ClientSession>(INITIAL);

/**
 * מצב ההתחברות לצורכי תצוגה בלבד (הצגת/הסתרת קישורים).
 * זו לא אבטחה - האכיפה האמיתית ב-middleware, בנתיבי ה-API וב-RLS.
 *
 * Provider יחיד ב-layout הראשי: קודם כל קומפוננטה (הדר, וילון צד, דף הבית...)
 * טענה את ה-session בעצמה, עם קריאת רשת ל-Supabase לכל אחת ובכל מעבר דף - וכך
 * הווילון הציג "לא מחובר" / בלי האזור האישי עד שהקריאה חזרה (ולפעמים בכלל לא).
 * עכשיו: קריאה מקומית מהעוגייה (getSession, מיידי), תפקיד מה-DB פעם אחת,
 * ועדכון על כל שינוי התחברות.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ClientSession>(INITIAL);

  useEffect(() => {
    const supabase = createClient();
    let alive = true;
    let loadedFor: string | null = null;

    async function loadRole(userId: string) {
      if (loadedFor === userId) return;
      loadedFor = userId;
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
      if (!alive || loadedFor !== userId) return;
      setState({ loading: false, loggedIn: true, role: (profile?.role as Role) ?? "user" });
    }

    function apply(userId: string | null) {
      if (!alive) return;
      if (!userId) {
        loadedFor = null;
        setState({ loading: false, loggedIn: false, role: "guest" });
        return;
      }
      // מחובר - מציגים מיד, והתפקיד (למשל קישור הניהול) משלים אחרי שאילתה אחת
      setState((prev) => ({ loading: false, loggedIn: true, role: prev.loggedIn ? prev.role : "user" }));
      loadRole(userId);
    }

    supabase.auth.getSession().then(({ data }) => apply(data.session?.user.id ?? null));

    // אסור לקרוא לפונקציות async של Supabase מתוך ה-callback עצמו (עלול להינעל) -
    // לכן העבודה נדחית ל-tick הבא.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user.id ?? null;
      setTimeout(() => apply(userId), 0);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return <SessionContext.Provider value={state}>{children}</SessionContext.Provider>;
}

export const useSession = () => useContext(SessionContext);
