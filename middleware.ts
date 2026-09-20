import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { roleAtLeast, PROTECTED_PREFIXES, type Role } from "@/lib/auth/roles";

/**
 * חשוב: זו ההגנה האמיתית, לא רק הסתרת קישורים ב-UI.
 * משתמש בלי הרשאה שינסה להגיע ישירות ל-/admin או ל-/dashboard דרך URL
 * ייחסם כאן, לפני שהדף עצמו נטען בכלל - כולל לפני שרינדור React מתחיל.
 *
 * TODO: להחליף את קריאת ה-role מ-cookie פשוט בבדיקת session אמיתית מול
 * Supabase (@supabase/ssr תומך ב-middleware בדיוק לצורך הזה, ר' session.ts).
 * ה-cookie הנוכחי הוא placeholder בלבד לצורך בניית מבנה האכיפה.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const match = PROTECTED_PREFIXES.find((p) => pathname.startsWith(p.prefix));
  if (!match) return NextResponse.next();

  const role = (request.cookies.get("weblok-role")?.value ?? "guest") as Role;

  if (!roleAtLeast(role, match.required)) {
    const url = request.nextUrl.clone();
    url.pathname = role === "guest" ? "/auth/login" : "/";
    url.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
