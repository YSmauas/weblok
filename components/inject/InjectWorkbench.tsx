"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { callGemini } from "@/lib/ai/gemini";
import { toAiError } from "@/lib/ai/client";
import {
  INJECT_GUIDELINES,
  INJECT_NOTES_MAX,
  InjectError,
  runAiInject,
  runSimpleInject,
  type InjectBlock,
} from "@/lib/inject/core";
import { copyText, downloadText } from "@/lib/download";
import { HtmlPreview } from "@/components/ui/HtmlPreview";
import { ApiKeyInput } from "./ApiKeyInput";

type Mode = "ai" | "simple";
type View = "after" | "before" | "code";

const LANGUAGE_NAMES: Record<string, string> = { he: "Hebrew", en: "English", es: "Spanish" };

interface Result {
  html: string;
  /** הקובץ כפי שהיה לפני ההזרקה (להשוואה "לפני/אחרי") */
  before: string;
  summary: string;
  failed: number;
  mode: Mode;
}

/**
 * לב כלי ההזרקה - משותף לכלי הציבורי (/tools/inject) ולפרויקטים באזור האישי.
 * הכל רץ בדפדפן: הקובץ לא נשלח לשרת שלנו, והקריאה ל-AI יוצאת ישירות מהדפדפן
 * ל-Google עם המפתח שהמשתמש הזין.
 */
export function InjectWorkbench({
  fileName,
  source,
  blocks,
  onApply,
  applyLabel,
}: {
  fileName: string;
  source: string | null;
  blocks: InjectBlock[];
  /** פרויקטים: שמירת התוצאה בחזרה לקובץ. מחזיר true בהצלחה. */
  onApply?: (html: string) => Promise<boolean>;
  applyLabel?: string;
}) {
  const { t, locale } = useLocale();
  const [mode, setMode] = useState<Mode>("ai");
  const [apiKey, setApiKey] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [view, setView] = useState<View>("after");
  const [copied, setCopied] = useState(false);
  const [applyState, setApplyState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const abortRef = useRef<AbortController | null>(null);
  const resultRef = useRef<Result | null>(null);
  resultRef.current = result;

  // קובץ/בלוקים אחרים = תוצאה קודמת כבר לא רלוונטית. חריג: הקובץ "השתנה" כי
  // בדיוק שמרנו אליו את התוצאה - אז משאירים אותה מוצגת.
  const blocksKey = blocks.map((b) => b.key).join("|");
  useEffect(() => {
    if (resultRef.current && source === resultRef.current.html) return;
    setResult(null);
    setError(null);
    setApplyState("idle");
  }, [source, blocksKey]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const canRun = !!source && blocks.length > 0 && !busy && (mode === "simple" || apiKey.trim().length >= 8);

  async function run() {
    if (!source || !canRun) return;
    setError(null);
    setResult(null);
    setApplyState("idle");

    if (mode === "simple") {
      setResult({ html: runSimpleInject(source, blocks), before: source, summary: t("inject.simpleSummary"), failed: 0, mode });
      setView("after");
      return;
    }

    setBusy(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const out = await runAiInject({
        ask: (prompt) => callGemini({ apiKey, prompt, json: true, temperature: 0.2, signal: controller.signal }),
        fileName,
        source,
        blocks,
        notes,
        language: LANGUAGE_NAMES[locale] ?? "Hebrew",
      });
      setResult({ html: out.result, before: source, summary: out.summary, failed: out.failed, mode });
      setView("after");
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
      setError(e instanceof InjectError ? t(`inject.err.${e.code}`) : t(`ai.err.${toAiError(e)}`));
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  async function apply() {
    if (!result || !onApply) return;
    setApplyState("busy");
    setApplyState((await onApply(result.html)) ? "done" : "error");
  }

  async function copy() {
    if (!result) return;
    setCopied(await copyText(result.html));
    setTimeout(() => setCopied(false), 1500);
  }

  const outName = fileName.replace(/(\.html?)?$/i, (ext) => `.weblok${ext || ".html"}`);

  return (
    <div className="space-y-5">
      <div className="flex gap-1 bg-base-panel2 rounded-full p-1 border border-base-border w-fit" role="tablist">
        {(["ai", "simple"] as Mode[]).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`text-xs px-4 py-1.5 rounded-full transition-colors ${
              mode === m ? "bg-accent text-base-bg font-semibold" : "text-ink-secondary hover:text-ink-primary"
            }`}
          >
            {t(m === "ai" ? "inject.modeAi" : "inject.modeSimple")}
          </button>
        ))}
      </div>

      {mode === "ai" ? (
        <div className="space-y-4">
          <ApiKeyInput value={apiKey} onChange={setApiKey} />
          <div>
            <label htmlFor="inject-notes" className="label">
              {t("inject.notesLabel")}
            </label>
            <textarea
              id="inject-notes"
              rows={2}
              maxLength={INJECT_NOTES_MAX}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("inject.notesPlaceholder")}
              className="field resize-y"
            />
          </div>
          <details className="rounded-xl border border-base-border bg-base-bg/40 px-4 py-3 text-xs text-ink-secondary">
            <summary className="cursor-pointer font-semibold text-ink-primary">{t("inject.guidelinesTitle")}</summary>
            <p className="mt-2">{t("inject.guidelinesIntro")}</p>
            <ol dir="ltr" className="mt-2 list-decimal ps-5 space-y-1 text-start font-mono text-[11px] leading-relaxed">
              {INJECT_GUIDELINES.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ol>
          </details>
        </div>
      ) : (
        <p className="text-sm text-ink-secondary">{t("inject.simpleHint")}</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button onClick={run} disabled={!canRun} className="btn-primary">
          {busy ? t("inject.running") : t(mode === "ai" ? "inject.runAi" : "inject.runSimple")}
        </button>
        {busy && (
          <button onClick={() => abortRef.current?.abort()} className="btn-outline btn-sm">
            {t("inject.cancel")}
          </button>
        )}
        {!source && <span className="text-xs text-ink-muted">{t("inject.needFile")}</span>}
        {source && blocks.length === 0 && <span className="text-xs text-ink-muted">{t("inject.needBlocks")}</span>}
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      {result && (
        <div className="space-y-3 animate-fadeInUp">
          <div className="rounded-card border border-success/40 bg-success/10 px-4 py-3 text-sm">
            <p className="font-semibold text-ink-primary">{t("inject.done")}</p>
            {result.summary && <p className="text-ink-secondary mt-1">{result.summary}</p>}
            {result.failed > 0 && <p className="text-xs text-ink-muted mt-1">{t("inject.partial")}</p>}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-1 bg-base-panel2 rounded-full p-1 border border-base-border" role="tablist">
              {(["after", "before", "code"] as View[]).map((v) => (
                <button
                  key={v}
                  role="tab"
                  aria-selected={view === v}
                  onClick={() => setView(v)}
                  className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                    view === v ? "bg-accent text-base-bg font-semibold" : "text-ink-secondary hover:text-ink-primary"
                  }`}
                >
                  {t(`inject.view.${v}`)}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {onApply && (
                <button onClick={apply} disabled={applyState === "busy" || applyState === "done"} className="btn-primary btn-sm">
                  {applyState === "busy" ? t("blocks.saving") : applyState === "done" ? t("common.saved") : applyLabel}
                </button>
              )}
              <button onClick={() => downloadText(outName, result.html, "text/html;charset=utf-8")} className="btn-outline btn-sm">
                {t("inject.download")}
              </button>
              <button onClick={copy} className="btn-outline btn-sm">
                {t(copied ? "common.copied" : "common.copy")}
              </button>
            </div>
          </div>
          {applyState === "error" && (
            <p role="alert" className="text-xs text-danger">
              {t("projects.saveFileFailed")}
            </p>
          )}

          {view === "code" ? (
            <pre dir="ltr" className="code-panel max-h-[520px] whitespace-pre-wrap break-all">
              {result.html}
            </pre>
          ) : (
            <div className="rounded-card border border-base-border overflow-hidden">
              <HtmlPreview
                title={t(`inject.view.${view}`)}
                html={view === "after" ? result.html : result.before}
                className="h-[520px]"
              />
            </div>
          )}
          <p className="text-[11px] text-ink-muted">{t("inject.previewNote")}</p>
        </div>
      )}
    </div>
  );
}
