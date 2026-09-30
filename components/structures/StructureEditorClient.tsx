"use client";

import { AppIcon } from "@/components/ui/AppIcon";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { getStructureDefinition } from "@/lib/structures";
import type { StructureImage, StructureValues } from "@/lib/structures/types";
import { downloadProjectZip, projectSize, toPushEntries } from "@/lib/structures/export";
import { formatBytes } from "@/lib/projects/files";
import { useLocale } from "@/lib/i18n/locale-provider";
import { BrowserFrame } from "@/components/ui/BrowserFrame";
import { HtmlPreview } from "@/components/ui/HtmlPreview";
import { Card } from "@/components/ui/Card";
import { StructureForm } from "./StructureForm";
import { StructureGithubPush } from "./StructureGithubPush";
import { SecretsHelper } from "./SecretsHelper";

const draftKey = (slug: string) => `weblok-structure-draft-${slug}`;

/**
 * עורך מבנה: הגדרות + תצוגה מקדימה חיה + ייצוא (ZIP / GitHub).
 * מקבל רק slug משרת - את ההגדרה (עם הפונקציות) טוענים כאן, בצד הלקוח.
 * הכל קורה בדפדפן: שום הגדרה, תמונה או טוקן לא נשלחים לשרת של WEblok.
 */
export function StructureEditorClient({ slug }: { slug: string }) {
  const { t } = useLocale();
  const def = getStructureDefinition(slug);
  const [values, setValues] = useState<StructureValues>(() => def?.defaultValues() ?? {});
  const [image, setImage] = useState<StructureImage | null>(null);
  const [previewWidth, setPreviewWidth] = useState<"mobile" | "desktop">("mobile");
  const [showFiles, setShowFiles] = useState(false);
  const [zipBusy, setZipBusy] = useState(false);
  const loaded = useRef(false);

  // טיוטה (בלי התמונה) נשמרת בדפדפן הזה בלבד - נוחות, לא אחסון אמין
  useEffect(() => {
    if (!def) return;
    try {
      const raw = localStorage.getItem(draftKey(slug));
      if (raw) {
        const saved = JSON.parse(raw) as Record<string, unknown>;
        const next = def.defaultValues();
        for (const f of def.fields) if (typeof saved[f.id] === "string") next[f.id] = saved[f.id] as string;
        setValues(next);
      }
    } catch {
      /* אין גישה לאחסון / טיוטה פגומה */
    }
    loaded.current = true;
  }, [def, slug]);

  useEffect(() => {
    if (!loaded.current) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(draftKey(slug), JSON.stringify(values));
      } catch {
        /* אין גישה לאחסון */
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [values, slug]);

  const deferredValues = useDeferredValue(values);
  const previewDoc = useMemo(() => (def ? def.previewHtml(deferredValues, image) : ""), [def, deferredValues, image]);
  const files = useMemo(() => (def ? def.generate(deferredValues, image) : {}), [def, deferredValues, image]);
  const paths = Object.keys(files);

  if (!def) {
    return <p className="text-sm text-danger">{t("structures.notFound")}</p>;
  }

  const set = (id: string, v: string) => setValues((prev) => ({ ...prev, [id]: v }));

  function reset() {
    if (!def || !window.confirm(t("structures.resetConfirm"))) return;
    setValues(def.defaultValues());
    setImage(null);
  }

  async function downloadZip() {
    if (!def) return;
    setZipBusy(true);
    try {
      await downloadProjectZip(def.generate(values, image), `${def.meta.repoName}.zip`, def.meta.repoName);
    } finally {
      setZipBusy(false);
    }
  }

  const tabClass = (active: boolean) =>
    `text-xs px-3 py-1.5 rounded-full transition-colors ${
      active ? "bg-accent text-base-bg font-semibold" : "text-ink-secondary hover:text-ink-primary"
    }`;

  return (
    <div className="grid md:grid-cols-[minmax(280px,400px)_minmax(0,1fr)] gap-6 items-start">
      {/* תצוגה מקדימה - במובייל ראשונה, מטאבלט ומעלה בצד ו"דביקה" */}
      <div className="space-y-3 min-w-0 md:col-start-2 md:row-start-1 md:sticky md:top-20">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-1 bg-base-panel2 rounded-full p-1 border border-base-border" role="tablist">
            {(["mobile", "desktop"] as const).map((w) => (
              <button key={w} role="tab" aria-selected={previewWidth === w} onClick={() => setPreviewWidth(w)} className={tabClass(previewWidth === w)}>
                {t(w === "mobile" ? "editor.mobile" : "editor.desktop")}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={downloadZip} disabled={zipBusy} className="btn-primary btn-sm">
              <AppIcon name="download" className="!text-current" /> {zipBusy ? t("projects.working") : t("structures.downloadZip")}
            </button>
            <a href="#export" className="btn-outline btn-sm">
              {t("structures.toExport")}
            </a>
          </div>
        </div>

        <BrowserFrame url="your-event.vercel.app">
          <div className="flex justify-center bg-base-bg">
            <div
              className="h-[480px] md:h-[min(640px,calc(100dvh-12rem))] md:min-h-[400px] transition-all max-w-full"
              style={{ width: previewWidth === "mobile" ? "390px" : "100%" }}
            >
              <HtmlPreview html={previewDoc} title={t("structures.preview")} className="h-full" />
            </div>
          </div>
        </BrowserFrame>
        <p className="text-[11px] text-ink-muted leading-relaxed">{t("structures.previewNote")}</p>
      </div>

      {/* הגדרות + ייצוא */}
      <div className="space-y-6 min-w-0 md:col-start-1 md:row-start-1">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold">{t("structures.settings")}</h2>
            <button onClick={reset} className="text-xs text-ink-muted hover:text-ink-primary px-2">
              {t("blocks.reset")}
            </button>
          </div>
          <StructureForm fields={def.fields} values={values} onChange={set} image={image} onImage={setImage} />
          <p className="text-[11px] text-ink-muted leading-relaxed">{t("structures.draftNote")}</p>
        </div>

        <section id="export" className="space-y-4 scroll-mt-24">
          <h2 className="text-lg font-bold">{t("structures.exportTitle")}</h2>

          <Card title={t("structures.zipTitle")} description={t("structures.zipText")}>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={downloadZip} disabled={zipBusy} className="btn-primary btn-sm">
                  <AppIcon name="download" className="!text-current" /> {zipBusy ? t("projects.working") : t("structures.downloadZip")}
                </button>
                <button onClick={() => setShowFiles((v) => !v)} aria-expanded={showFiles} className="btn-outline btn-sm">
                  {t(showFiles ? "structures.hideFiles" : "structures.showFiles")}
                </button>
              </div>
              <p className="text-[11px] text-ink-muted">
                {t("structures.filesSummary").replace("{n}", String(paths.length)).replace("{size}", formatBytes(projectSize(files)))}
              </p>
              {showFiles && (
                <div className="space-y-3 animate-fadeInUp">
                  <ul dir="ltr" className="rounded-xl border border-base-border bg-base-bg/40 p-3 text-xs font-mono text-ink-secondary space-y-0.5 text-start">
                    {paths.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                  <div>
                    <p className="text-[11px] text-ink-muted mb-1" dir="ltr">
                      config/event.json
                    </p>
                    <pre className="code-panel max-h-60 whitespace-pre-wrap break-all" dir="ltr">
                      {typeof files["config/event.json"] === "string" ? files["config/event.json"] : ""}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card title={t("structures.ghTitle")} description={t("structures.ghText")}>
            <StructureGithubPush
              buildEntries={() => toPushEntries(def.generate(values, image))}
              defaultRepoName={def.meta.repoName}
              defaultMessage={t("structures.gh.defaultMessage")}
            />
          </Card>

          <Card title={t("structures.secrets.title")}>
            <SecretsHelper />
          </Card>

          <a href="#guide" className="inline-block text-sm text-accent hover:underline">
            {t("structures.toGuide")} <span aria-hidden className="inline-block ltr:rotate-180">←</span>
          </a>
        </section>
      </div>
    </div>
  );
}
