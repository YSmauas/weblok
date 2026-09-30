import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decryptSecret } from "@/lib/crypto";
import { rateLimit } from "@/lib/rate-limit";
import { GeminiError } from "./gemini";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * החלק המשותף לכל נתיבי ה-AI בצד השרת: משתמש מחובר ולא מושעה, הגבלת קצב,
 * ומפתח ה-Gemini האישי שלו (מפוענח בזיכרון לבקשה הזו בלבד - לעולם לא חוזר
 * ללקוח ולא נכתב ללוג). מחזיר תגובת שגיאה מוכנה, או את מה שצריך להמשך.
 */
export async function requireAiUser(
  bucket: string,
  max: number
): Promise<{ error: NextResponse } | { error: null; supabase: Supabase; apiKey: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };

  const { data: profile } = await supabase.from("profiles").select("status").eq("id", user.id).single();
  if (!profile || profile.status === "suspended") {
    return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  }

  if (!(await rateLimit(`${bucket}:${user.id}`, max, 600))) {
    return { error: NextResponse.json({ error: "rate_limited" }, { status: 429 }) };
  }

  const { data: key } = await supabase
    .from("api_keys")
    .select("encrypted_value")
    .eq("user_id", user.id)
    .eq("provider", "gemini")
    .maybeSingle();
  if (!key) return { error: NextResponse.json({ error: "no_key" }, { status: 400 }) };

  try {
    return { error: null, supabase, apiKey: decryptSecret(key.encrypted_value) };
  } catch {
    return { error: NextResponse.json({ error: "no_key" }, { status: 400 }) };
  }
}

/** ממפה שגיאת Gemini לתשובת API אחידה (בלי לחשוף פרטים פנימיים). */
export function aiErrorResponse(e: unknown): NextResponse {
  const code = e instanceof GeminiError ? e.code : "failed";
  if (code === "invalid_key" || code === "api_disabled" || code === "region") {
    return NextResponse.json({ error: code }, { status: 400 });
  }
  if (code === "rate_limited" || code === "quota") return NextResponse.json({ error: code }, { status: 429 });
  if (code === "blocked" || code === "truncated" || code === "model_unavailable" || code === "network") {
    return NextResponse.json({ error: code }, { status: 502 });
  }
  return NextResponse.json({ error: "ai_failed" }, { status: 502 });
}
