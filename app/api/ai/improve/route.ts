import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decryptSecret } from "@/lib/crypto";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * שיפור טקסט קצר עם AI, לשדות עם aiAssist בעורך הבלוקים.
 * משתמש במפתח ה-Gemini של המשתמש עצמו (מפוענח בזיכרון לבקשה הזו בלבד -
 * לעולם לא חוזר ללקוח ולא נכתב ללוג). guardrail: prompt קבוע ששומר על
 * המשמעות והאורך - לא יצירה חופשית.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!(await rateLimit(`ai-improve:${user.id}`, 30, 600))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const text = String(body?.text ?? "").trim();
  const label = String(body?.label ?? "טקסט").slice(0, 80);
  if (!text || text.length > 2000) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const { data: key } = await supabase
    .from("api_keys")
    .select("encrypted_value")
    .eq("user_id", user.id)
    .eq("provider", "gemini")
    .single();
  if (!key) return NextResponse.json({ error: "no_key" }, { status: 400 });

  let apiKey: string;
  try {
    apiKey = decryptSecret(key.encrypted_value);
  } catch {
    return NextResponse.json({ error: "no_key" }, { status: 400 });
  }

  const prompt = `שפר את הטקסט הבא לשדה "${label}" בבלוק אתר בעברית. שמור על אותה משמעות ואורך דומה, ניסוח שיווקי קצר וברור, בלי גרשיים ובלי הסברים - רק הטקסט המשופר:\n\n${text}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );
    if (!res.ok) return NextResponse.json({ error: "ai_failed" }, { status: 502 });
    const data = await res.json();
    const improved: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!improved) return NextResponse.json({ error: "ai_failed" }, { status: 502 });
    return NextResponse.json({ text: improved.replace(/^["']|["']$/g, "") });
  } catch {
    return NextResponse.json({ error: "ai_failed" }, { status: 502 });
  }
}
