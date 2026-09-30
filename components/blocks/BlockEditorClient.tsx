"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getBlockDefinition } from "@/lib/blocks-registry";
import type { BlockValues, FieldDef } from "@/lib/blocks-registry/types";
import { exportBlock, toUnifiedHtml, type ExportFormat } from "@/lib/blocks-registry/export";
import { downloadAsZip } from "@/lib/download-zip";
import { copyText, downloadText } from "@/lib/download";
import { improveText, redesignBlock, type AiErrorCode } from "@/lib/ai/client";
import { REDESIGN_MAX_LENGTH } from "@/lib/ai/prompts";
import { saveEditorDraft } from "@/lib/inject/options";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/lib/i18n/locale-provider";
import { DynamicForm } from "@/components/editor/DynamicForm";
import { BrowserFrame } from "@/components/ui/BrowserFrame";
import { HtmlPreview } from "@/components/ui/HtmlPreview";

const FORMATS: { id: ExportFormat; label: string }[] = [
  { id: "html", label: "editor.format.html" },
  { id: "html-css-js", label: "editor.format.split" },
  { id: "jsx", label: "editor.format.jsx" },
];

type PreviewMode = "mock" | "live";

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
  // הרישום (blocks-registry) הוא לוגיקה טהורה בצד לקוח - אין שום סיבה
  // (וגם אי אפשר, כי block.Preview/generate/toOutput הן פונקציות) להעביר
  // את האובייקט הזה משרת ללקוח. הקומפוננטה טוענת אותו בעצמה לפי ה-slug.
  const block = getBlockDefinition(slug);
  const [values, setValues] = useState<BlockValues>(initialValues ?? block?.defaultValues() ?? {});
  const [name, setName] = useState(initialName ?? block?.meta.name ?? "");
  const [designId, setDesignId] = useState<string | null>(savedId ?? null);
  const [previewWidth, setPreviewWidth] = useState<"mobile" | "desktop">("desktop");
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
  // בתצוגה בלבד (לא בקוד המיוצא): ווידג'טים צפים נפתחים מיד, כדי לראות את התוכן ולא רק בועה
  const liveHtml = useMemo(
    () =>
      output
        ? `${toUnifiedHtml(output)}\n<script>setTimeout(function(){document.querySelectorAll("[data-wb-toggle],[data-wb-chat-toggle]").forEach(function(b){b.click()})},60)</script>`
        : "",
    [output]
  );

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
          <div className="flex gap-1 bg-base-panel2 rounded-full p-1 border border-base-border" role="tablist">
            {(["mobile", "desktop"] as const).map((w) => (
              <button key={w} role="tab" aria-selected={previewWidth === w} onClick={() => setPreviewWidth(w)} className={tabClass(previewWidth === w)}>
                {t(w === "mobile" ? "editor.mobile" : "editor.desktop")}
              </button>
            ))}
          </div>
          {output && (
            <div className="flex gap-1 bg-base-panel2 rounded-full p-1 border border-base-border" role="tablist">
              {(["live", "mock"] as const).map((m) => (
                <button key={m} role="tab" aria-selected={previewMode === m} onClick={() => setPreviewMode(m)} className={tabClass(previewMode === m)}>
                  {t(m === "mock" ? "editor.previewMock" : "editor.previewLive")}
                </button>
              ))}
            </div>
          )}
        </div>

        <BrowserFrame url="your-site.com">
          <div className="flex justify-center bg-base-bg">
            <div
              className="h-[380px] md:h-[min(520px,calc(100vh-19rem))] md:min-h-[360px] transition-all max-w-full"
              style={{ width: previewWidth === "mobile" ? "380px" : "100%" }}
            >
              {previewMode === "live" && output ? (
                <HtmlPreview html={liveHtml} title={t("editor.previewLive")} wrapFragment className="h-full" />
              ) : (
                <block.Preview values={values} />
              )}
            </div>
          </div>
        </BrowserFrame>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={saveDesign} disabled={saving} className="btn-primary btn-sm">
            {saving ? t("blocks.saving") : saveState === "saved" ? t("common.saved") : t("editor.saveDesign")}
          </button>
          <button onClick={() => setAiRedesignOpen((v) => !v)} aria-expanded={aiRedesignOpen} className="btn-soft btn-sm">
            🎨 {t("editor.aiEdit")}
          </button>
          {output && (
            <button onClick={injectIntoProject} className="btn-outline btn-sm">
              💉 {t("editor.injectToProject")}
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
                  ⬇ {t(Object.keys(exported.files).length > 1 ? "editor.downloadZip" : "editor.downloadFile")}
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
