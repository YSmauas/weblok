import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * קליינט Supabase לצד שרת (Server Components, Route Handlers, Server Actions).
 * פועל בשם המשתמש המחובר (לפי עוגיות ה-session), כך ש-RLS נאכף כרגיל.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(list) {
          try {
            list.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // נקרא מתוך Server Component - אי אפשר לכתוב עוגיות שם.
            // זה בסדר: ה-middleware מרענן את ה-session בכל בקשה.
          }
        },
      },
    }
  );
}
