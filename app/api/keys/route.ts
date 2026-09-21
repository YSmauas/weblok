import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { encryptSecret } from "@/lib/crypto";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const PROVIDERS = ["gemini"] as const;
type Provider = (typeof PROVIDERS)[number];
const isProvider = (v: unknown): v is Provider =>
  typeof v === "string" && (PROVIDERS as readonly string[]).includes(v);

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/** שמירת/החלפת מפתח. הערך מוצפן בשרת; לעולם לא מוחזר ללקוח. */
export async function PUT(request: Request) {
  const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!(await rateLimit(`keys:${user.id}`, 20, 600))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const provider = body?.provider;
  const value = typeof body?.value === "string" ? body.value.trim() : "";
  if (!isProvider(provider) || value.length < 8 || value.length > 500) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const { error } = await supabase.from("api_keys").upsert({
    user_id: user.id,
    provider,
    encrypted_value: encryptSecret(value),
    updated_at: new Date().toISOString(),
  });
  if (error) return NextResponse.json({ error: "failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const provider = new URL(request.url).searchParams.get("provider");
  if (!isProvider(provider)) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const { error } = await supabase
    .from("api_keys")
    .delete()
    .eq("user_id", user.id)
    .eq("provider", provider);
  if (error) return NextResponse.json({ error: "failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
