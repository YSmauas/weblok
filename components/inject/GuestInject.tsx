"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useSession } from "@/lib/auth/use-session";
import { Card } from "@/components/ui/Card";
import { INJECT_MAX_FILE_BYTES, type InjectBlock } from "@/lib/inject/core";
import { defaultInjectBlocks, readEditorDraft } from "@/lib/inject/options";
import { formatBytes } from "@/lib/projects/files";
import { BlockPicker } from "./BlockPicker";
import { InjectWorkbench } from "./InjectWorkbench";

/** כלי ההזרקה הציבורי: קובץ HTML יחיד, שנערך כולו בדפדפן - בלי חשבון ובלי שרת. */
export function GuestInject() {
  const { t } = useLocale();
  const { loggedIn } = useSession();
  const [file, setFile] = useState<{ name: string; content: string } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [options, setOptions] = useState<InjectBlock[]>(() => defaultInjectBlocks());
  const [selected, setSelected] = useState<string[]>([]);

  // בלוק שהגיע מהעורך ("הזרקה לפרויקט קיים") - מופיע ראשון ומסומן מראש
  useEffect(() => {
    const draft = readEditorDraft();
    if (!draft) return;
    setOptions((prev) => [draft, ...prev.filter((o) => o.key !== "draft")]);
    setSelected(["draft"]);
  }, []);

  const blocks = useMemo(() => options.filter((o) => selected.includes(o.key)), [options, selected]);

  async function pickFile(f: File | undefined) {
    setFileError(null);
    if (!f) return;
    if (!/\.html?$/i.test(f.name)) return setFileError(t("inject.errNotHtml"));
    if (f.size > INJECT_MAX_FILE_BYTES) return setFileError(t("inject.errTooBig").replace("{max}", formatBytes(INJECT_MAX_FILE_BYTES)));
    setFile({ name: f.name, content: await f.text() });
  }

  const STEPS = ["inject.step1", "inject.step2", "inject.step3", "inject.step4"];

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="font-semibold text-lg">{t("inject.howTitle")}</h2>
        <ol className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {STEPS.map((k, i) => (
            <li key={k} className="rounded-xl border border-base-border bg-base-bg/40 p-3">
              <span className="w-6 h-6 rounded-full bg-accent text-base-bg text-xs font-bold inline-flex items-center justify-center">
                {i + 1}
              </span>
              <p className="text-sm mt-2 text-ink-secondary leading-relaxed">{t(k)}</p>
            </li>
          ))}
        </ol>
        <div className="mt-4 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-xs text-ink-secondary leading-relaxed">
          <p>
            <strong className="text-ink-primary">🔒 {t("inject.privacyTitle")}</strong> {t("inject.privacyBody")}
          </p>
        </div>
      </Card>

      <Card title={`1. ${t("inject.fileTitle")}`}>
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            pickFile(e.dataTransfer.files?.[0]);
          }}
          className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center cursor-pointer transition-colors ${
            dragging ? "border-accent bg-accent-soft" : "border-base-border hover:border-accent/60"
          }`}
        >
          <span className="text-3xl" aria-hidden>
            📄
          </span>
          <span className="text-sm font-medium">{file ? file.name : t("inject.dropHere")}</span>
          <span className="text-xs text-ink-muted">
            {file
              ? `${formatBytes(new TextEncoder().encode(file.content).length)} · ${t("inject.replaceFile")}`
              : t("inject.dropHint").replace("{max}", formatBytes(INJECT_MAX_FILE_BYTES))}
          </span>
          <input
            type="file"
            accept=".html,.htm,text/html"
            className="sr-only"
            onChange={(e) => {
              pickFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
        {fileError && (
          <p role="alert" className="text-sm text-danger mt-2">
            {fileError}
          </p>
        )}
      </Card>

      <Card title={`2. ${t("inject.blocksTitle")}`} description={t("inject.blocksDesc")}>
        <BlockPicker options={options} selected={selected} onChange={setSelected} />
        <Link href="/blocks" className="inline-block mt-3 text-xs text-accent hover:underline">
          {t("inject.customizeFirst")}
        </Link>
      </Card>

      <Card title={`3. ${t("inject.runTitle")}`}>
        <InjectWorkbench fileName={file?.name ?? "index.html"} source={file?.content ?? null} blocks={blocks} />
      </Card>

      <div className="rounded-card border border-base-border bg-gradient-to-br from-accent-soft to-transparent p-6">
        <h2 className="font-bold text-lg">{t("inject.moreTitle")}</h2>
        <ul className="mt-3 grid sm:grid-cols-2 gap-2 text-sm text-ink-secondary">
          {["inject.more1", "inject.more2", "inject.more3", "inject.more4"].map((k) => (
            <li key={k} className="flex gap-2">
              <span className="text-accent" aria-hidden>
                ✓
              </span>
              {t(k)}
            </li>
          ))}
        </ul>
        <Link href={loggedIn ? "/dashboard/projects" : "/auth/signup?next=/dashboard/projects"} className="btn-primary mt-5">
          {t(loggedIn ? "inject.moreCtaUser" : "inject.moreCtaGuest")}
        </Link>
      </div>
    </div>
  );
}
