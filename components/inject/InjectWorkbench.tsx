"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { callGemini, GeminiError } from "@/lib/ai/gemini";
import { toAiError } from "@/lib/ai/client";
import {
  blockCode,
  INJECT_GUIDELINES,
  INJECT_NOTES_MAX,
  InjectError,
  runAiInject,
  runPlacedInject,
  type InjectBlock,
} from "@/lib/inject/core";
import {
  analyzePage,
  BASIC_PLACEMENTS,
  defaultPlacement,
  placementWarnings,
  type PlacementChoice,
  type PlacementWarning,
} from "@/lib/inject/placement";
import { copyText, downloadText } from "@/lib/download";
import { HtmlPreview } from "@/components/ui/HtmlPreview";
import { AppIcon } from "@/components/ui/AppIcon";
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
  /** עריכות AI שנדחו כי ניסו להוסיף משהו שאינו הבלוקים שלנו */
  rejected: number;
  warnings: PlacementWarning[];
  mode: Mode;
}

const DEFAULT_HEADER_OFFSET = 64;
const DEFAULT_FLOAT_LIFT = 80;

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
  const [placements, setPlacements] = useState<Record<string, PlacementChoice>>({});
  const [headerOffset, setHeaderOffset] = useState<number | null>(null);
  const [floatLift, setFloatLift] = useState<number | null>(null);
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

  // מיקומים שנבחרו מתייחסים לאלמנטים של הקובץ הקודם - מתחילים מחדש
  useEffect(() => {
    if (resultRef.current && source === resultRef.current.html) return;
    setPlacements({});
    setHeaderOffset(null);
    setFloatLift(null);
  }, [source]);

  const analysis = useMemo(() => (source ? analyzePage(source) : null), [source]);
  const placeOf = (b: InjectBlock): PlacementChoice => placements[b.key] ?? defaultPlacement(b.slug, b.values);
  const preWarnings = useMemo(() => {
    if (!analysis) return [];
    const items = blocks
      .map((b) => ({ slug: b.slug, name: b.name, code: blockCode(b) ?? "", placement: placements[b.key] ?? defaultPlacement(b.slug, b.values) }))
      .filter((b) => b.code);
    return placementWarnings(analysis, items);
  }, [analysis, blocks, placements]);
  const warnText = (w: PlacementWarning) => t(`inject.place.warn.${w.code}`).replace("{detail}", w.detail ?? "");

  useEffect(() => () => abortRef.current?.abort(), []);

  const canRun = !!source && blocks.length > 0 && !busy && (mode === "simple" || apiKey.trim().length >= 8);

  async function run() {
    if (!source || !canRun) return;
    setError(null);
    setResult(null);
    setApplyState("idle");

    if (mode === "simple") {
      const out = runPlacedInject(source, blocks, placements, {
        headerOffset: headerOffset ?? 0,
        floatLift: floatLift ?? 0,
      });
      setResult({ html: out.html, before: source, summary: t("inject.place.summary"), failed: 0, rejected: 0, warnings: out.warnings, mode });
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
      setResult({ html: out.result, before: source, summary: out.summary, failed: out.failed, rejected: out.rejected, warnings: [], mode });
      setView("after");
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
      setError(aiErrorText(e));
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  /** הודעת שגיאה ספציפית: קודם שגיאות ההזרקה, אחר כך קודי ה-AI (ai.err.*) */
  function aiErrorText(e: unknown): string {
    if (e instanceof InjectError) return t(`inject.err.${e.code}`);
    // תשובה ריקה מהמודל = אין תוכנית עריכה, לא "תקלה כללית"
    if (e instanceof GeminiError && e.code === "empty") return t("inject.err.bad_response");
    return t(`ai.err.${toAiError(e)}`);
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
            className={`inline-flex items-center gap-1.5 text-xs px-4 py-1.5 rounded-full transition-colors ${
              mode === m ? "bg-accent text-base-bg font-semibold" : "text-ink-secondary hover:text-ink-primary"
            }`}
          >
            {m === "ai" && <AppIcon name="sparkle" className="!text-current" />}
            {t(m === "ai" ? "inject.modeAiLabel" : "inject.modeSimple")}
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
        <div className="space-y-4">
          <p className="text-sm text-ink-secondary">{t("inject.place.hint")}</p>
          {blocks.length > 0 && (
            <ul className="space-y-2">
              {blocks.map((b) => (
                <li key={b.key} className="grid gap-1.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] sm:items-center">
                  <label htmlFor={`place-${b.key}`} className="text-sm font-medium truncate">
                    {b.name}
                  </label>
                  <select
                    id={`place-${b.key}`}
                    value={placeOf(b)}
                    onChange={(e) => setPlacements((prev) => ({ ...prev, [b.key]: e.target.value as PlacementChoice }))}
                    className="field text-sm"
                  >
                    <optgroup label={t("inject.place.groupBasic")}>
                      {BASIC_PLACEMENTS.map((p) => (
                        <option key={p} value={p}>
                          {t(`inject.place.${p}`)}
                          {p === defaultPlacement(b.slug, b.values) ? ` · ${t("inject.place.recommended")}` : ""}
                        </option>
                      ))}
                    </optgroup>
                    {!!analysis?.landmarks.length && (
                      <optgroup label={t("inject.place.groupElements")}>
                        {analysis.landmarks.flatMap((l) => [
                          <option key={`before:${l.id}`} value={`before:${l.id}`}>
                            {t("inject.place.before").replace("{el}", l.label)}
                          </option>,
                          ...(l.end > 0
                            ? [
                                <option key={`after:${l.id}`} value={`after:${l.id}`}>
                                  {t("inject.place.after").replace("{el}", l.label)}
                                </option>,
                              ]
                            : []),
                        ])}
                      </optgroup>
                    )}
                  </select>
                </li>
              ))}
            </ul>
          )}

          {preWarnings.length > 0 && (
            <ul className="space-y-2" aria-live="polite">
              {preWarnings.map((w) => (
                <li
                  key={`${w.code}:${w.detail ?? ""}`}
                  className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2.5 text-xs text-ink-secondary leading-relaxed"
                >
                  <p className="flex gap-2">
                    <AppIcon name="warning" className="shrink-0 mt-0.5 !text-danger" />
                    <span className="min-w-0 break-words">{warnText(w)}</span>
                  </p>
                  {w.code === "fixed_header" && (
                    <OffsetControl
                      label={t("inject.place.offsetHeader")}
                      value={headerOffset}
                      fallback={DEFAULT_HEADER_OFFSET}
                      onChange={setHeaderOffset}
                    />
                  )}
                  {w.code === "floating_conflict" && (
                    <OffsetControl
                      label={t("inject.place.offsetFloat")}
                      value={floatLift}
                      fallback={DEFAULT_FLOAT_LIFT}
                      onChange={setFloatLift}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
          <p className="text-[11px] text-ink-muted leading-relaxed">{t("inject.place.zNote")}</p>
        </div>
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
        {source && blocks.length > 0 && mode === "ai" && apiKey.trim().length < 8 && (
          <span className="text-xs text-ink-muted">{t("inject.needKey")}</span>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      {result && (
        <div className="space-y-3 animate-fadeInUp">
          <div className="rounded-card border border-success/40 bg-success/10 px-4 py-3 text-sm">
            <p className="flex items-center gap-1.5 font-semibold text-ink-primary">
              <AppIcon name="check" className="!text-success" />
              {t("inject.doneTitle")}
            </p>
            {result.summary && <p className="text-ink-secondary mt-1">{result.summary}</p>}
            {result.failed > 0 && <p className="text-xs text-ink-muted mt-1">{t("inject.partial")}</p>}
            {result.rejected > 0 && <p className="text-xs text-ink-muted mt-1">{t("inject.rejectedNote")}</p>}
            {result.warnings.map((w) => (
              <p key={`${w.code}:${w.detail ?? ""}`} className="text-xs text-ink-muted mt-1">
                {warnText(w)}
              </p>
            ))}
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
                  {applyState === "busy" ? t("blocks.saving") : applyState === "done" ? t("inject.savedToFile") : applyLabel}
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

/** תיבת סימון + מספר פיקסלים, להזזת הבלוקים שלנו כדי שלא יכסו אלמנט קיים */
function OffsetControl({
  label,
  value,
  fallback,
  onChange,
}: {
  label: string;
  value: number | null;
  fallback: number;
  onChange: (v: number | null) => void;
}) {
  const on = value !== null;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 ps-6">
      <label className="flex items-center gap-2 cursor-pointer text-ink-primary">
        <input
          type="checkbox"
          checked={on}
          onChange={(e) => onChange(e.target.checked ? fallback : null)}
          className="accent-[var(--accent)]"
        />
        {label}
      </label>
      {on && (
        <span className="flex items-center gap-1" dir="ltr">
          <input
            type="number"
            min={0}
            max={400}
            step={4}
            value={value ?? fallback}
            onChange={(e) => onChange(Math.max(0, Math.min(400, Number(e.target.value) || 0)))}
            aria-label={label}
            className="field w-20 py-1 text-xs"
          />
          px
        </span>
      )}
    </div>
  );
}
