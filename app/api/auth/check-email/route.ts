import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { clientKey, rateLimit } from "@/lib/rate-limit";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** בודק אם אימייל רשום - כדי להפנות ניסיון התחברות בלי חשבון להרשמה. */
export async function POST(request: Request) {
  if (!(await rateLimit(`check-email:${clientKey(request)}`, 20, 600))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const email = String(body?.email ?? "").trim();
  if (!EMAIL.test(email)) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const { data, error } = await (await createClient()).rpc("email_registered", { p_email: email });
  if (error) return NextResponse.json({ error: "failed" }, { status: 500 });
  return NextResponse.json({ registered: data === true });
}
