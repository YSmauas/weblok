import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { clientKey, rateLimit } from "@/lib/rate-limit";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** פנייה מהטופס הציבורי או מהאזור האישי. ה-user_id נקבע בשרת לפי ה-session, לא מהלקוח. */
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

  const { error } = await supabase
    .from("contact_messages")
    .insert({ user_id: user?.id ?? null, name, email, subject, message });
  if (error) return NextResponse.json({ error: "failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
