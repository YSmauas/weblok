import { NextResponse } from "next/server";
import { readJson } from "@/lib/http";
import { callGemini } from "@/lib/ai/gemini";
import { buildImprovePrompt, cleanImproved, IMPROVE_MAX_LENGTH } from "@/lib/ai/prompts";
import { aiErrorResponse, requireAiUser } from "@/lib/ai/server";

export const runtime = "nodejs";

/**
 * שיפור טקסט קצר עם AI, לשדות עם aiAssist בעורך הבלוקים (משתמשים רשומים בלבד).
 * guardrail: prompt קבוע ששומר על המשמעות והאורך - לא יצירה חופשית.
 */
export async function POST(request: Request) {
  const body = await readJson<any>(request, 8 * 1024);
  const text = String(body?.text ?? "").trim();
  const label = String(body?.label ?? "טקסט").slice(0, 80);
  if (!text || text.length > IMPROVE_MAX_LENGTH) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const ctx = await requireAiUser("ai-improve", 30);
  if (ctx.error) return ctx.error;

  try {
    const improved = cleanImproved(await callGemini({ apiKey: ctx.apiKey, prompt: buildImprovePrompt(text, label) }));
    if (!improved) return NextResponse.json({ error: "ai_failed" }, { status: 502 });
    return NextResponse.json({ text: improved });
  } catch (e) {
    return aiErrorResponse(e);
  }
}
