import { createClient } from "@supabase/supabase-js";

/**
 * קליינט עם המפתח הסודי (עוקף RLS). שרת בלבד - לעולם לא לייבא מקומפוננטת client.
 * משמש רק למה שאסור שהדפדפן יעשה בעצמו: rate limiting וכתיבת אנליטיקה.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("SUPABASE_SECRET_KEY is not set");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
