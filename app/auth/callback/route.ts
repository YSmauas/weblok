import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { safeNext } from "@/lib/auth/redirect";

/**
 * נקודת החזרה של OAuth (GitHub/Google) ושל קישורי אימות באימייל.
 *
 * חשוב: בניגוד לקליינט הרגיל ב-lib/supabase/server.ts (שכותב עוגיות דרך
 * cookies() מתוך next/headers), כאן זה Route Handler שמחזיר NextResponse
 * חדש - וב-Next.js עוגיות שנכתבות דרך cookies() לא "נדבקות" אוטומטית
 * לתגובה נפרדת כזו. זו הסיבה שההתחברות עבדה בצד השרת (middleware הצליח
 * לקרוא session בבקשה הבאה) אבל הדפדפן/הקליינט לא ראו session מיד -
 * העוגיות פשוט לא היו בתגובת ה-redirect עצמה. הפתרון: בונים את התגובה
 * מראש, כותבים את העוגיות ישירות עליה, ומחזירים אותה.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const response = NextResponse.redirect(`${origin}${next}`);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            const cookieHeader = request.headers.get("cookie") ?? "";
            return cookieHeader.split(";").filter(Boolean).map((c) => {
              const [name, ...rest] = c.trim().split("=");
              return { name, value: rest.join("=") };
            });
          },
          setAll(list) {
            list.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return response;
  }

  return NextResponse.redirect(`${origin}/auth/login?error=1`);
}
