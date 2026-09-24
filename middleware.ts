import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { roleAtLeast, PROTECTED_PREFIXES, type Role } from "@/lib/auth/roles";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * זו ההגנה הראשונה, לא הצעד היחיד: משתמש בלי הרשאה שינסה להגיע ישירות ל-/admin
 * או ל-/dashboard ייחסם כאן, לפני שהדף נטען. השכבה השנייה, הבלתי-תלויה, היא RLS
 * ופונקציות ה-DB המאובטחות - כך שגם עקיפה של ה-middleware לא חושפת נתונים.
 *
 * ה-session מאומת מול Supabase (getUser), והתפקיד נקרא מטבלת profiles.
 * אין יותר קריאת תפקיד מעוגייה שהלקוח יכול לזייף.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // מרעננים את ה-session בכל בקשה (גם בדפים ציבוריים), אחרת טוקן שהתחדש
  // ב-Server Component לא נשמר בעוגייה והמשתמש מתנתק אקראית.
  const { supabase, user, response } = await updateSession(request);

  const match = PROTECTED_PREFIXES.find((p) => pathname.startsWith(p.prefix));
  if (!match) return response;

  // הפניה ששומרת את עוגיות ה-session שרועננו ב-updateSession - אחרת הטוקן
  // החדש הולך לאיבוד וה-refresh token הישן נפסל.
  const redirectTo = (target: string, from?: string) => {
    const url = request.nextUrl.clone();
    url.pathname = target;
    url.search = "";
    if (from) url.searchParams.set("redirectedFrom", from);
    const res = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };

  if (!user) return redirectTo("/auth/login", pathname);

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  // אם אי אפשר לקרוא את הפרופיל לא מניחים שהכל תקין - חוסמים (fail closed)
  if (error || !profile) return redirectTo("/");

  if (profile.status === "suspended") return redirectTo("/auth/suspended");

  if (!roleAtLeast(profile.role as Role, match.required)) return redirectTo("/");

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons/|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
