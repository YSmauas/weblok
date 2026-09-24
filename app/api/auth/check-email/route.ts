import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientKey, rateLimit } from "@/lib/rate-limit";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * בודק אם אימייל רשום - כדי להפנות ניסיון התחברות בלי חשבון להרשמה.
 * הפונקציה ב-DB פתוחה רק ל-service_role (migration 0003), כך שהדרך היחידה
 * לקרוא לה היא דרך הנתיב הזה, עם הגבלת הקצב שלו. אם ההגבלה לא זמינה - חוסמים.
 */
export async function POST(request: Request) {
  if (!(await rateLimit(`check-email:${clientKey(request)}`, 20, 600, { failOpen: false }))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const email = String(body?.email ?? "").trim();
  if (!EMAIL.test(email)) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const { data, error } = await createAdminClient().rpc("email_registered", { p_email: email });
  if (error) return NextResponse.json({ error: "failed" }, { status: 500 });
  return NextResponse.json({ registered: data === true });
}
