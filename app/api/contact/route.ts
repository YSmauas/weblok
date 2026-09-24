import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientKey, rateLimit } from "@/lib/rate-limit";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * פנייה מהטופס הציבורי או מהאזור האישי. ה-user_id נקבע בשרת לפי ה-session, לא מהלקוח.
 * הכתיבה לטבלה נעשית רק מכאן (service key): ההרשאה לכתוב ישירות נסגרה ב-migration 0003,
 * כדי שאי אפשר יהיה לעקוף את הגבלת הקצב והוולידציה.
 */
export async function POST(request: Request) {
  // מקסימום 5 פניות ל-10 דקות לכל גולש - מונע הצפת הטבלה בספאם.
  if (!(await rateLimit(`contact:${clientKey(request)}`, 5, 600))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  const email = String(body?.email ?? "").trim();
  const subject = String(body?.subject ?? "").trim() || null;
  const message = String(body?.message ?? "").trim();

  if (
    name.length < 1 || name.length > 100 ||
    !EMAIL.test(email) || email.length > 200 ||
    message.length < 1 || message.length > 5000 ||
    (subject && subject.length > 200)
  ) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase.from("profiles").select("status").eq("id", user.id).single();
    if (profile?.status === "suspended") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }

  const { error } = await createAdminClient()
    .from("contact_messages")
    .insert({ user_id: user?.id ?? null, name, email, subject, message });
  if (error) return NextResponse.json({ error: "failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
