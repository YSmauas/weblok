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

  const match = PROTECTED_PREFIXES.find((p) => pathname.startsWith(p.prefix));
  if (!match) return NextResponse.next();

  const { supabase, user, response } = await updateSession(request);

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.search = "";
    url.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(url);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  const role = (profile?.role ?? "user") as Role;

  if (profile?.status === "suspended" || !roleAtLeast(role, match.required)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
