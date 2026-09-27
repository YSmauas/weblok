"use client";

import type { BlockValues, FieldDef } from "@/lib/blocks-registry/types";
import { callGemini, GeminiError } from "./gemini";
import { buildImprovePrompt, buildRedesignPrompt, cleanImproved, parseRedesignChanges } from "./prompts";

/**
 * צד הדפדפן של תכונות ה-AI בעורך.
 * משתמש ששמר מפתח "בדפדפן בלבד" (בפרופיל) - הקריאה יוצאת ישירות מהדפדפן
 * ל-Gemini והמפתח לא מגיע לשרת שלנו בכלל. אחרת - דרך /api/ai/*, שם נעשה
 * שימוש במפתח המוצפן ששמור בשרת.
 */

export type AiProvider = "gemini";
const storageKey = (p: AiProvider) => `weblok-apikey-${p}`;

export function readBrowserKey(provider: AiProvider = "gemini"): string | null {
  try {
    return localStorage.getItem(storageKey(provider));
  } catch {
    return null;
  }
}

export function writeBrowserKey(value: string, provider: AiProvider = "gemini"): boolean {
  try {
    localStorage.setItem(storageKey(provider), value.trim());
    return true;
  } catch {
    return false;
  }
}

export function removeBrowserKey(provider: AiProvider = "gemini") {
  try {
    localStorage.removeItem(storageKey(provider));
  } catch {
    /* אין גישה ל-localStorage - אין מה למחוק */
  }
}

/** קוד שגיאה אחיד לתצוגה (מפתח i18n: ai.err.<code>) */
export type AiErrorCode =
  | "no_key"
  | "invalid_key"
  | "rate_limited"
  | "unauthorized"
  | "blocked"
  | "truncated"
  | "failed";

export type AiResult<T> = { ok: true; data: T } | { ok: false; error: AiErrorCode };

export function toAiError(e: unknown): AiErrorCode {
  if (e instanceof GeminiError) {
    if (e.code === "invalid_key") return "invalid_key";
    if (e.code === "rate_limited") return "rate_limited";
    if (e.code === "blocked") return "blocked";
    if (e.code === "truncated") return "truncated";
  }
  return "failed";
}

function fromApiError(status: number | undefined, code: unknown): AiErrorCode {
  if (code === "no_key") return "no_key";
  if (code === "invalid_key") return "invalid_key";
  if (status === 401) return "unauthorized";
  if (status === 429) return "rate_limited";
  return "failed";
}

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => null);
  const data = await res?.json().catch(() => null);
  return { res, data };
}

export async function improveText(text: string, label: string): Promise<AiResult<string>> {
  const browserKey = readBrowserKey();
  if (browserKey) {
    try {
      const improved = cleanImproved(await callGemini({ apiKey: browserKey, prompt: buildImprovePrompt(text, label) }));
      return improved ? { ok: true, data: improved } : { ok: false, error: "failed" };
    } catch (e) {
      return { ok: false, error: toAiError(e) };
    }
  }
  const { res, data } = await postJson("/api/ai/improve", { text, label });
  if (res?.ok && typeof data?.text === "string") return { ok: true, data: data.text };
  return { ok: false, error: fromApiError(res?.status, data?.error) };
}

export async function redesignBlock(
  slug: string,
  fields: FieldDef[],
  values: BlockValues,
  description: string
): Promise<AiResult<Record<string, string>>> {
  const browserKey = readBrowserKey();
  if (browserKey) {
    try {
      const raw = await callGemini({
        apiKey: browserKey,
        prompt: buildRedesignPrompt(fields, values, description),
        json: true,
      });
      const changes = parseRedesignChanges(raw, fields);
      return Object.keys(changes).length ? { ok: true, data: changes } : { ok: false, error: "failed" };
    } catch (e) {
      return { ok: false, error: toAiError(e) };
    }
  }
  const { res, data } = await postJson("/api/ai/redesign", { blockSlug: slug, description, values });
  if (res?.ok && data?.changes && typeof data.changes === "object") return { ok: true, data: data.changes };
  return { ok: false, error: fromApiError(res?.status, data?.error) };
}
