import { NextResponse } from "next/server";
import { getBlockDefinition } from "@/lib/blocks-registry";
import { callGemini } from "@/lib/ai/gemini";
import {
  buildRedesignPrompt,
  editableFields,
  parseRedesignChanges,
  REDESIGN_MAX_LENGTH,
} from "@/lib/ai/prompts";
import { aiErrorResponse, requireAiUser } from "@/lib/ai/server";

export const runtime = "nodejs";

/**
 * "עריכה עם AI" ברמת כל הבלוק (עיצוב + קצת מבנה), לא תוכן חופשי - משתמשים רשומים בלבד.
 * ה-AI יכול לשנות אך ורק שדות עם aiDesignEditable:true, ורק לערכים
 * שהוגדרו מראש בשדה (select: אחד מה-options; color: hex תקין) - לעולם
 * לא טקסט חופשי. כל תשובה שלא עוברת את הבדיקה נזרקת בשקט.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const description = String(body?.description ?? "").trim();
  const rawValues = body?.values;
  const currentValues: Record<string, string> =
    rawValues && typeof rawValues === "object" && !Array.isArray(rawValues) ? rawValues : {};
  if (!description || description.length > REDESIGN_MAX_LENGTH) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const block = getBlockDefinition(String(body?.blockSlug ?? ""));
  if (!block || editableFields(block.fields).length === 0) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const ctx = await requireAiUser("ai-redesign", 20);
  if (ctx.error) return ctx.error;

  try {
    const raw = await callGemini({
      apiKey: ctx.apiKey,
      prompt: buildRedesignPrompt(block.fields, currentValues, description),
      json: true,
    });
    const changes = parseRedesignChanges(raw, block.fields);
    if (Object.keys(changes).length === 0) {
      return NextResponse.json({ error: "ai_failed" }, { status: 502 });
    }
    return NextResponse.json({ changes });
  } catch (e) {
    return aiErrorResponse(e);
  }
}
