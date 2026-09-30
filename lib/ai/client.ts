"use client";

import type { BlockValues, FieldDef } from "@/lib/blocks-registry/types";
import { callGemini, GeminiError } from "./gemini";
import { decryptFromBrowser, encryptForBrowser } from "./key-vault";
import { buildImprovePrompt, buildRedesignPrompt, cleanImproved, parseRedesignChanges } from "./prompts";

/**
 * צד הדפדפן של תכונות ה-AI בעורך.
 * משתמש ששמר מפתח "בדפדפן בלבד" (בפרופיל) - הקריאה יוצאת ישירות מהדפדפן
 * ל-Gemini והמפתח לא מגיע לשרת שלנו בכלל. אחרת - דרך /api/ai/*, שם נעשה
 * שימוש במפתח המוצפן ששמור בשרת.
 */

export type AiProvider = "gemini";
/** שם ישן - בגרסה קודמת המפתח נשמר כאן כטקסט גלוי; מועבר אוטומטית לכספת */
const legacyKey = (p: AiProvider) => `weblok-apikey-${p}`;
const vaultKey = (p: AiProvider) => `weblok-apikey-${p}.enc`;

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** האם שמור מפתח בדפדפן (בלי לפענח אותו) - לתצוגה בלבד */
export function hasBrowserKey(provider: AiProvider = "gemini"): boolean {
  const ls = storage();
  return !!ls && !!(ls.getItem(vaultKey(provider)) || ls.getItem(legacyKey(provider)));
}

/** מפענח את המפתח השמור בדפדפן (ומעביר מפתח ישן בטקסט גלוי לכספת המוצפנת). */
export async function readBrowserKey(provider: AiProvider = "gemini"): Promise<string | null> {
  const ls = storage();
  if (!ls) return null;
  const legacy = ls.getItem(legacyKey(provider));
  if (legacy) {
    ls.removeItem(legacyKey(provider));
    await writeBrowserKey(legacy, provider);
    return legacy;
  }
  const payload = ls.getItem(vaultKey(provider));
  if (!payload) return null;
  try {
    return await decryptFromBrowser(payload);
  } catch {
    // מפתח ההצפנה נמחק (ניקוי נתוני אתר) - הצופן כבר לא שמיש
    ls.removeItem(vaultKey(provider));
    return null;
  }
}

/** שומר את המפתח מוצפן. false אם הדפדפן לא מאפשר (גלישה פרטית, חסימת אחסון). */
export async function writeBrowserKey(value: string, provider: AiProvider = "gemini"): Promise<boolean> {
  const ls = storage();
  if (!ls) return false;
  try {
    ls.setItem(vaultKey(provider), await encryptForBrowser(value.trim()));
    return true;
  } catch {
    return false;
  }
}

export function removeBrowserKey(provider: AiProvider = "gemini") {
  const ls = storage();
  ls?.removeItem(vaultKey(provider));
  ls?.removeItem(legacyKey(provider));
}

/** קוד שגיאה אחיד לתצוגה (מפתח i18n: ai.err.<code>) */
export type AiErrorCode =
  | "no_key"
  | "invalid_key"
  | "rate_limited"
  | "quota"
  | "model_unavailable"
  | "region"
  | "api_disabled"
  | "network"
  | "unauthorized"
  | "blocked"
  | "truncated"
  | "failed";

/** קודים שעוברים כמו שהם משגיאת Gemini / מתשובת השרת לתצוגה */
const PASS_THROUGH: readonly AiErrorCode[] = [
  "no_key",
  "invalid_key",
  "rate_limited",
  "quota",
  "model_unavailable",
  "region",
  "api_disabled",
  "network",
  "blocked",
  "truncated",
];

const isAiErrorCode = (c: unknown): c is AiErrorCode => typeof c === "string" && (PASS_THROUGH as string[]).includes(c);

export type AiResult<T> = { ok: true; data: T } | { ok: false; error: AiErrorCode };

export function toAiError(e: unknown): AiErrorCode {
  if (e instanceof GeminiError && isAiErrorCode(e.code)) return e.code;
  return "failed";
}

function fromApiError(status: number | undefined, code: unknown): AiErrorCode {
  if (status === undefined) return "network";
  if (isAiErrorCode(code)) return code;
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
  const browserKey = await readBrowserKey();
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
  const browserKey = await readBrowserKey();
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
