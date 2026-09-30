"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getBlockDefinition } from "@/lib/blocks-registry";
import type { BlockValues, FieldDef } from "@/lib/blocks-registry/types";
import { exportBlock, type ExportFormat } from "@/lib/blocks-registry/export";
import { downloadAsZip } from "@/lib/download-zip";
import { copyText, downloadText } from "@/lib/download";
import { improveText, redesignBlock, type AiErrorCode } from "@/lib/ai/client";
import { REDESIGN_MAX_LENGTH } from "@/lib/ai/prompts";
import { saveEditorDraft } from "@/lib/inject/options";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/lib/i18n/locale-provider";
import { DynamicForm } from "@/components/editor/DynamicForm";
import { useTf } from "@/components/editor/useTf";
import { BrowserFrame } from "@/components/ui/BrowserFrame";
import { AppIcon } from "@/components/ui/AppIcon";
import { LivePreview, type Device } from "@/components/blocks/LivePreview";
import { buildPreviewDoc, type PageTheme } from "@/components/blocks/previewDoc";

const FORMATS: { id: ExportFormat; label: string }[] = [
  { id: "html", label: "editor.format.html" },
  { id: "html-css-js", label: "editor.format.split" },
  { id: "jsx", label: "editor.format.jsx" },
];

type PreviewMode = "mock" | "live";

const DEVICES: { id: Device; icon: string; key: string; fb: string }[] = [
  { id: "mobile", icon: "device-mobile", key: "editor.device.mobile", fb: "מובייל" },
  { id: "tablet", icon: "device-tablet", key: "editor.device.tablet", fb: "טאבלט" },
  { id: "desktop", icon: "device-desktop", key: "editor.device.desktop", fb: "מחשב" },
];

/** העדפות תצוגה אישיות (מכשיר/רקע) - נוחות בלבד, localStorage עטוף ב-try. */
const PREFS_KEY = "weblok-editor-preview";
function readPrefs(): { device?: Device; pageTheme?: PageTheme } {
  try {
    return JSON.parse(window.localStorage.getItem(PREFS_KEY) ?? "{}");
  } catch {
    return {};
  }
}
function writePrefs(p: { device: Device; pageTheme: PageTheme }) {
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

export function BlockEditorClient({
  slug,
  userId,
  initialValues,
  initialName,
  savedId,
}: {
  slug: string;
  userId: string | null;
  initialValues?: BlockValues;
  initialName?: string;
  savedId?: string;
}) {
  const router = useRouter();
  const { t } = useLocale();
  const { tf } = useTf();
  // הרישום (blocks-registry) הוא לוגיקה טהורה בצד לקוח - אין שום סיבה
  // (וגם אי אפשר, כי block.Preview/generate/toOutput הן פונקציות) להעביר
  // את האובייקט הזה משרת ללקוח. הקומפוננטה טוענת אותו בעצמה לפי ה-slug.
  const block = getBlockDefinition(slug);
  const [values, setValues] = useState<BlockValues>(initialValues ?? block?.defaultValues() ?? {});
  const [name, setName] = useState(initialName ?? block?.meta.name ?? "");
  const [designId, setDesignId] = useState<string | null>(savedId ?? null);
  const [device, setDevice] = useState<Device>("desktop");
  const [pageTheme, setPageTheme] = useState<PageTheme>("light");
  const [replayKey, setReplayKey] = useState(0);
  // ברירת מחדל: הקוד האמיתי רץ בתצוגה (מדויק יותר מההדמיה)
  const [previewMode, setPreviewMode] = useState<PreviewMode>(block?.toOutput ? "live" : "mock");
  const [showCode, setShowCode] = useState(false);
  const [format, setFormat] = useState<ExportFormat>("html");
  const [aiField, setAiField] = useState<string | null>(null);
  const [aiFieldError, setAiFieldError] = useState<AiErrorCode | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");
  const [usedAi, setUsedAi] = useState(false);
  const [aiRedesignOpen, setAiRedesignOpen] = useState(false);
  const [aiDescription, setAiDescription] = useState("");
  const [aiRedesignBusy, setAiRedesignBusy] = useState(false);
  const [aiRedesignError, setAiRedesignError] = useState<AiErrorCode | null>(null);
  const [copied, setCopied] = useState(false);

  const isLoggedIn = !!userId;
  const loginHref = `/auth/login?redirectedFrom=${encodeURIComponent(`/blocks/${slug}`)}`;

  const set = (id: string, v: string) => {
    setValues((prev) => ({ ...prev, [id]: v }));
    setSaveState("idle");
  };

  const output = useMemo(() => (block?.toOutput ? block.toOutput(values) : null), [block, values]);
  const exported = useMemo(() => (output ? exportBlock(output, format) : null), [output, format]);
  // התצוגה החיה: הבלוק האמיתי בתוך "אתר לדוגמה" (ר' previewDoc.ts - תוספות לתצוגה בלבד)
  const previewDir = values.dir === "ltr" ? "ltr" : "rtl";
  const previewDoc = useMemo(
    () => (output ? buildPreviewDoc({ output, slug, theme: pageTheme, dir: previewDir }) : ""),
    [output, slug, pageTheme, previewDir]
  );

  useEffect(() => {
    const p = readPrefs();
    if (p.device && p.device in { mobile: 1, tablet: 1, desktop: 1 }) setDevice(p.device);
    if (p.pageTheme === "dark" || p.pageTheme === "light") setPageTheme(p.pageTheme);
  }, []);

  const chooseDevice = (d: Device) => {
    setDevice(d);
    writePrefs({ device: d, pageTheme });
  };
  const togglePageTheme = () => {
    const next: PageTheme = pageTheme === "light" ? "dark" : "light";
    setPageTheme(next);
    writePrefs({ device, pageTheme: next });
  };

  if (!block) {
    return <p className="text-sm text-danger">{t("editor.notFound").replace("{slug}", slug)}</p>;
  }

  async function improveWithAi(field: FieldDef) {
    setAiField(field.id);
    setAiFieldError(null);
    const res = await improveText(values[field.id] ?? "", field.label);
    setAiField(null);
    if (res.ok) {
      set(field.id, res.data);
      setUsedAi(true);
    } else {
      setAiFieldError(res.error);
    }
  }

  async function applyAiRedesign() {
    if (!block || !aiDescription.trim() || aiRedesignBusy) return;
    setAiRedesignBusy(true);
    setAiRedesignError(null);
    const res = await redesignBlock(slug, block.fields, values, aiDescription.trim());
    setAiRedesignBusy(false);
    if (res.ok) {
      setValues((prev) => ({ ...prev, ...res.data }));
      setUsedAi(true);
      setSaveState("idle");
      setAiDescription("");
      setAiRedesignOpen(false);
      return;
    }
    setAiRedesignError(res.error);
  }

  async function saveDesign() {
    if (!userId) {
      router.push(loginHref);
      return;
    }
    setSaving(true);
    setSaveState("idle");
    const supabase = createClient();
    const row = {
      name: name.trim() || block!.meta.name,
      config: values,
      ai_edited: usedAi,
      updated_at: new Date().toISOString(),
    };
    // אחרי שמירה ראשונה ממשיכים לעדכן את אותה שורה - לא יוצרים עותק חדש בכל לחיצה
    const { data, error } = designId
      ? await supabase.from("saved_designs").update(row).eq("id", designId).select("id").single()
      : await supabase
          .from("saved_designs")
          .insert({ ...row, user_id: userId, block_slug: slug })
          .select("id")
          .single();
    setSaving(false);
    if (error || !data) {
      setSaveState("error");
      return;
    }
    setSaveState("saved");
    if (!designId) {
      setDesignId(data.id);
      router.replace(`/blocks/${slug}?design=${data.id}`, { scroll: false });
    }
  }

  function resetDefaults() {
    if (!block || !window.confirm(t("editor.resetConfirm"))) return;
    setValues(block.defaultValues());
    setSaveState("idle");
  }

  function download() {
    if (!exported) return;
    const entries = Object.entries(exported.files);
    if (entries.length > 1) {
      downloadAsZip(exported.files, `${slug}.zip`);
      return;
    }
    const [fileName, content] = entries[0];
    downloadText(fileName, content);
  }

  async function copyCode() {
    if (!exported) return;
    const entries = Object.entries(exported.files);
    const text = entries.map(([n, c]) => (entries.length > 1 ? `// ${n}\n${c}` : c)).join("\n\n");
    setCopied(await copyText(text));
    setTimeout(() => setCopied(false), 1500);
  }

  function injectIntoProject() {
    saveEditorDraft({ slug, name: name.trim() || block!.meta.name, values });
    router.push("/tools/inject");
  }

  const tabClass = (active: boolean) =>
    `text-xs px-3 py-1.5 rounded-full transition-colors ${
      active ? "bg-accent text-base-bg font-semibold" : "text-ink-secondary hover:text-ink-primary"
    }`;

  return (
    // מובייל: תצוגה מעל ההגדרות. מטאבלט ומעלה: זה לצד זה, והתצוגה "דביקה" -
    // נשארת מול העיניים בזמן שגוללים בהגדרות.
    <div className="grid md:grid-cols-[minmax(280px,380px)_minmax(0,1fr)] gap-6 items-start">
      <div className="space-y-3 min-w-0 md:col-start-2 md:row-start-1 md:sticky md:top-20">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {previewMode === "live" && output ? (
            <div className="flex gap-1 bg-base-panel2 rounded-full p-1 border border-base-border" role="group" aria-label={tf("editor.device.label", "גודל מסך")}>
              {DEVICES.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  aria-pressed={device === d.id}
                  onClick={() => chooseDevice(d.id)}
                  title={tf(d.key, d.fb)}
                  className={`${tabClass(device === d.id)} inline-flex items-center gap-1.5`}
                >
                  <AppIcon name={d.icon} className="!text-current text-[15px]" />
                  <span className="hidden sm:inline">{tf(d.key, d.fb)}</span>
                  <span className="sr-only sm:hidden">{tf(d.key, d.fb)}</span>
                </button>
              ))}
            </div>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-1.5">
            {previewMode === "live" && output && (
              <>
                <button
                  type="button"
                  onClick={() => setReplayKey((k) => k + 1)}
                  className="w-8 h-8 rounded-full border border-base-border bg-base-panel2 inline-flex items-center justify-center text-ink-secondary hover:text-accent hover:border-accent transition-colors text-[16px]"
                  title={tf("editor.replay", "הפעלה מחדש של האנימציות")}
                  aria-label={tf("editor.replay", "הפעלה מחדש של האנימציות")}
                >
                  <AppIcon name="replay" className="!text-current" />
                </button>
                <button
                  type="button"
                  onClick={togglePageTheme}
                  aria-pressed={pageTheme === "dark"}
                  className="w-8 h-8 rounded-full border border-base-border bg-base-panel2 inline-flex items-center justify-center text-ink-secondary hover:text-accent hover:border-accent transition-colors text-[16px]"
                  title={tf("editor.pageTheme", "רקע כהה לעמוד הדוגמה")}
                  aria-label={tf("editor.pageTheme", "רקע כהה לעמוד הדוגמה")}
                >
                  <AppIcon name={pageTheme === "dark" ? "moon" : "sun"} className="!text-current" />
                </button>
              </>
            )}
            {output && (
              <div className="flex gap-1 bg-base-panel2 rounded-full p-1 border border-base-border" role="group">
                {(["live", "mock"] as const).map((m) => (
                  <button key={m} type="button" aria-pressed={previewMode === m} onClick={() => setPreviewMode(m)} className={tabClass(previewMode === m)}>
                    {t(m === "mock" ? "editor.previewMock" : "editor.previewLive")}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <BrowserFrame url="your-site.com">
          {previewMode === "live" && output ? (
            <LivePreview
              doc={previewDoc}
              device={device}
              replayKey={replayKey}
              title={t("editor.previewLive")}
              className="h-[420px] md:h-[min(560px,calc(100vh-17rem))] md:min-h-[380px] bg-base-bg"
            />
          ) : (
            <div className="h-[380px] md:h-[min(520px,calc(100vh-19rem))] md:min-h-[360px]">
              <block.Preview values={values} />
            </div>
          )}
        </BrowserFrame>
        {previewMode === "live" && output && <p className="text-[11px] text-ink-muted">{t("editor.previewLiveNote")}</p>}

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={saveDesign} disabled={saving} className="btn-primary btn-sm">
            {saving ? t("blocks.saving") : saveState === "saved" ? t("common.saved") : t("editor.saveDesign")}
          </button>
          <button onClick={() => setAiRedesignOpen((v) => !v)} aria-expanded={aiRedesignOpen} className="btn-soft btn-sm">
            <AppIcon name="palette" className="!text-current" /> {t("editor.aiEdit")}
          </button>
          {output && (
            <button onClick={injectIntoProject} className="btn-outline btn-sm">
              <AppIcon name="inject" className="!text-current" /> {t("editor.injectToProject")}
            </button>
          )}
          <button onClick={resetDefaults} className="text-xs text-ink-muted hover:text-ink-primary px-2">
            {t("blocks.reset")}
          </button>
        </div>
        {!isLoggedIn && <p className="text-xs text-ink-muted">{t("editor.loginToSave")}</p>}
        {saveState === "error" && (
          <p role="alert" className="text-xs text-danger">
            {t("blocks.saveFailed")}
          </p>
        )}

        {aiRedesignOpen && (
          <div className="rounded-card border border-accent/40 bg-accent-soft p-4 space-y-3 animate-fadeInUp">
            {isLoggedIn ? (
              <>
                <p className="text-xs text-ink-secondary leading-relaxed">{t("editor.aiEditHint")}</p>
                <div className="flex gap-2">
                  <input
                    value={aiDescription}
                    onChange={(e) => setAiDescription(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && applyAiRedesign()}
                    placeholder={t("editor.aiEditPlaceholder")}
                    maxLength={REDESIGN_MAX_LENGTH}
                    aria-label={t("editor.aiEdit")}
                    className="field flex-1"
                  />
                  <button
                    onClick={applyAiRedesign}
                    disabled={aiRedesignBusy || !aiDescription.trim()}
                    className="btn-primary rounded-lg shrink-0"
                  >
                    {aiRedesignBusy ? "..." : t("editor.aiApply")}
                  </button>
                </div>
                {aiRedesignError && <AiErrorMessage code={aiRedesignError} />}
              </>
            ) : (
              <p className="text-sm text-ink-secondary">
                {t("editor.aiLoginRequired")}{" "}
                <Link href={loginHref} className="text-accent font-semibold hover:underline">
                  {t("sidebar.login")}
                </Link>
              </p>
            )}
          </div>
        )}

        {/* ייצוא: שורה קומפקטית; הקוד עצמו מקופל עד שמבקשים לראות אותו */}
        {exported ? (
          <div className="rounded-card border border-base-border bg-base-panel/60 p-3 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-1 bg-base-panel2 rounded-full p-1 border border-base-border w-fit" role="tablist">
                {FORMATS.map((f) => (
                  <button key={f.id} role="tab" aria-selected={format === f.id} onClick={() => setFormat(f.id)} className={tabClass(format === f.id)}>
                    {t(f.label)}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={download} className="btn-primary btn-sm">
                  <AppIcon name="download" className="!text-current" /> {t(Object.keys(exported.files).length > 1 ? "editor.downloadZip" : "editor.downloadFile")}
                </button>
                <button onClick={copyCode} className="btn-outline btn-sm">
                  {t(copied ? "common.copied" : "editor.copyCode")}
                </button>
                <button onClick={() => setShowCode((v) => !v)} aria-expanded={showCode} className="btn-outline btn-sm">
                  {t(showCode ? "editor.hideCode" : "editor.showCode")}
                </button>
              </div>
            </div>
            {Object.keys(exported.files).length > 1 && (
              <p className="text-[11px] text-ink-muted" dir="ltr">
                {Object.keys(exported.files).join(" · ")}
              </p>
            )}
            {showCode && (
              <div className="code-panel max-h-72 space-y-4 animate-fadeInUp">
                {Object.entries(exported.files).map(([fileName, content]) => (
                  <div key={fileName}>
                    <p className="text-[11px] text-ink-muted mb-1" dir="ltr">
                      {fileName}
                    </p>
                    <pre className="whitespace-pre-wrap break-all" dir="ltr">
                      {content}
                    </pre>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[11px] text-ink-muted">{t("blocks.codeHint")}</p>
          </div>
        ) : (
          <p className="text-sm text-ink-muted">{t("editor.noExport")}</p>
        )}
      </div>

      {/* הגדרות */}
      <div className="space-y-4 min-w-0 md:col-start-1 md:row-start-1">
        <div className="rounded-card border border-base-border bg-base-panel/80 p-4">
          <label htmlFor="design-name" className="label">
            {t("blocks.designName")}
          </label>
          <input
            id="design-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            className="field"
          />
        </div>

        {slug === "popup" && values.popupType === "cookie" && (
          <Link
            href="/blocks/popup/cookies"
            className="flex items-start gap-3 rounded-card border border-accent/40 bg-accent-soft p-4 hover:border-accent transition-colors animate-fadeInUp"
          >
            <span className="text-2xl shrink-0" aria-hidden>
              <AppIcon name="cookie" />
            </span>
            <span className="min-w-0">
              <span className="block font-semibold text-sm text-ink-primary">{tf("editor.cookieGuide.title", "איך לגרום לבחירה באמת להשפיע על העוגיות?")}</span>
              <span className="block text-xs text-ink-secondary mt-1 leading-relaxed">
                {tf(
                  "editor.cookieGuide.text",
                  "הפופאפ שומר את הבחירה ושולח אירוע - אבל את סקריפטי המעקב צריך לחבר אליו. במדריך: טעינת Google Analytics רק אחרי אישור, מחיקת עוגיות בדחייה ו-Consent Mode v2."
                )}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent mt-2">
                {tf("editor.cookieGuide.cta", "למדריך המלא")}
                <AppIcon name="external-link" className="!text-current" />
              </span>
            </span>
          </Link>
        )}

        <div className="rounded-card border border-base-border bg-base-panel/80 p-4">
          {aiFieldError && (
            <div className="mb-3">
              <AiErrorMessage code={aiFieldError} />
            </div>
          )}
          <DynamicForm
            fields={block.fields}
            values={values}
            onChange={set}
            onAiImprove={isLoggedIn ? improveWithAi : undefined}
            aiBusyField={aiField}
            storageKey={slug}
          />
        </div>
      </div>
    </div>
  );
}

/** הודעת שגיאת AI - עם קישור לפרופיל כשהבעיה היא מפתח חסר/שגוי. */
function AiErrorMessage({ code }: { code: AiErrorCode }) {
  const { t } = useLocale();
  return (
    <p role="alert" className="text-xs text-danger">
      {t(`ai.err.${code}`)}{" "}
      {(code === "no_key" || code === "invalid_key") && (
        <Link href="/dashboard/profile" className="underline font-semibold">
          {t("ai.goToProfile")}
        </Link>
      )}
    </p>
  );
}
