import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decryptSecret } from "@/lib/crypto";
import { rateLimit } from "@/lib/rate-limit";
import { getBlockDefinition } from "@/lib/blocks-registry";
import type { FieldDef } from "@/lib/blocks-registry/types";

export const runtime = "nodejs";

/**
 * "עריכה עם AI" ברמת כל הבלוק (עיצוב + קצת מבנה), לא תוכן חופשי.
 * ה-AI יכול לשנות אך ורק שדות עם aiDesignEditable:true, ורק לערכים
 * שהוגדרו מראש בשדה (select: אחד מה-options; color: hex תקין) - לעולם
 * לא טקסט חופשי. כל תשובה שלא עוברת את הבדיקה נזרקת בשקט.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!(await rateLimit(`ai-redesign:${user.id}`, 20, 600))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const slug = String(body?.blockSlug ?? "");
  const description = String(body?.description ?? "").trim();
  const currentValues = body?.values ?? {};
  if (!description || description.length > 500) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const block = getBlockDefinition(slug);
  if (!block) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const editable = block.fields.filter((f) => f.aiDesignEditable);
  if (editable.length === 0) return NextResponse.json({ error: "invalid" }, { status: 400 });

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

  const fieldsDescription = editable
    .map((f) => {
      const opts = f.type === "select" ? ` אפשרויות: ${f.options?.map((o) => o.value).join(" | ")}` : "";
      const type = f.type === "color" ? " (צבע hex, למשל #38bdf8)" : "";
      return `- ${f.id} ("${f.label}")${opts}${type} - ערך נוכחי: ${currentValues[f.id] ?? ""}`;
    })
    .join("\n");

  const prompt = `אתה עורך עיצוב לבלוק אתר. מותר לך לשנות אך ורק את השדות המפורטים מטה, ואך ורק
לערכים המותרים שצוינו לכל שדה (לשדה select - רק אחד מהאפשרויות שנרשמו, לשדה color - קוד hex תקין).
אסור לך להוסיף שדות שלא מופיעים ברשימה, ואסור להמציא ערכים שלא הותרו.

שדות מותרים:
${fieldsDescription}

בקשת המשתמש: "${description}"

החזר אך ורק אובייקט JSON שטוח של {שם_שדה: ערך_חדש} עבור השדות שאתה משנה בלבד (אל תחזיר שדות שלא משתנים).
בלי הסברים, בלי markdown, רק ה-JSON.`;

  let raw = "";
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
    raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  } catch {
    return NextResponse.json({ error: "ai_failed" }, { status: 502 });
  }

  const cleaned = raw.replace(/```json|```/g, "").trim();
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return NextResponse.json({ error: "ai_failed" }, { status: 502 });
  }

  const byId = new Map<string, FieldDef>(editable.map((f) => [f.id, f]));
  const changes: Record<string, string> = {};
  const HEX = /^#[0-9a-fA-F]{6}$/;

  for (const [id, value] of Object.entries(parsed)) {
    const field = byId.get(id);
    if (!field || typeof value !== "string") continue;
    if (field.type === "select" && field.options?.some((o) => o.value === value)) {
      changes[id] = value;
    } else if (field.type === "color" && HEX.test(value)) {
      changes[id] = value;
    }
  }

  if (Object.keys(changes).length === 0) {
    return NextResponse.json({ error: "ai_failed" }, { status: 502 });
  }
  return NextResponse.json({ changes });
}
