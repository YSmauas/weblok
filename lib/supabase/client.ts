import { createBrowserClient } from "@supabase/ssr";

/** קליינט Supabase לדפדפן. משתמש רק במפתח הציבורי (Publishable) - מוגן ע"י RLS. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
