"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/i18n/locale-provider";
import { BlockPicker } from "@/components/inject/BlockPicker";
import { InjectWorkbench } from "@/components/inject/InjectWorkbench";
import { INJECT_MAX_FILE_BYTES, type InjectBlock } from "@/lib/inject/core";
import { fetchFileContent, saveFileContent, type ProjectFileMeta } from "@/lib/projects/db";
import { formatBytes, isHtmlPath } from "@/lib/projects/files";

/** הזרקת בלוקי הפרויקט לאחד מקבצי ה-HTML שלו, ושמירת התוצאה בחזרה לקובץ. */
export function ProjectInject({ files, blocks }: { files: ProjectFileMeta[]; blocks: InjectBlock[] }) {
  const { t } = useLocale();
  const router = useRouter();
  const htmlFiles = useMemo(() => files.filter((f) => isHtmlPath(f.path)), [files]);
  const [targetId, setTargetId] = useState<string>(
    () => (htmlFiles.find((f) => /(^|\/)index\.html?$/i.test(f.path)) ?? htmlFiles[0])?.id ?? ""
  );
  const [source, setSource] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [selected, setSelected] = useState<string[]>(() => blocks.map((b) => b.key));

  const target = htmlFiles.find((f) => f.id === targetId);

  useEffect(() => {
    setSource(null);
    setLoadError(false);
    if (!target) return;
    let alive = true;
    fetchFileContent(target.id).then((content) => {
      if (!alive) return;
      if (content === null) setLoadError(true);
      else setSource(content);
    });
    return () => {
      alive = false;
    };
    // נטען מחדש רק כשבוחרים קובץ אחר (אחרי שמירה התוכן כבר מעודכן מקומית)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.id]);

  // קובץ HTML ראשון שהועלה אחרי שהמסך כבר נטען - נבחר אוטומטית
  useEffect(() => {
    if (!target && htmlFiles.length) setTargetId(htmlFiles[0].id);
  }, [target, htmlFiles]);

  // בלוק שנוסף לפרויקט מסומן אוטומטית
  const blockKeys = blocks.map((b) => b.key).join("|");
  useEffect(() => {
    setSelected((prev) => {
      const valid = prev.filter((k) => blocks.some((b) => b.key === k));
      const added = blocks.filter((b) => !prev.includes(b.key)).map((b) => b.key);
      return [...valid, ...added];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockKeys]);

  const chosen = useMemo(() => blocks.filter((b) => selected.includes(b.key)), [blocks, selected]);

  if (htmlFiles.length === 0) return <p className="text-sm text-ink-muted">{t("projects.noHtml")}</p>;
  if (blocks.length === 0) return <p className="text-sm text-ink-muted">{t("projects.noBlocksToInject")}</p>;

  const tooBig = !!target && target.size > INJECT_MAX_FILE_BYTES;

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="inject-target" className="label">
          {t("projects.targetFile")}
        </label>
        <select id="inject-target" dir="ltr" value={targetId} onChange={(e) => setTargetId(e.target.value)} className="field font-mono">
          {htmlFiles.map((f) => (
            <option key={f.id} value={f.id}>
              {f.path} ({formatBytes(f.size)})
            </option>
          ))}
        </select>
        {loadError && <p role="alert" className="text-xs text-danger mt-1">{t("common.error")}</p>}
        {tooBig && (
          <p role="alert" className="text-xs text-danger mt-1">
            {t("inject.errTooBig").replace("{max}", formatBytes(INJECT_MAX_FILE_BYTES))}
          </p>
        )}
      </div>

      <div>
        <p className="label">{t("inject.blocksTitle")}</p>
        <BlockPicker options={blocks} selected={selected} onChange={setSelected} />
      </div>

      <InjectWorkbench
        fileName={target?.path.split("/").pop() ?? "index.html"}
        source={tooBig ? null : source}
        blocks={chosen}
        applyLabel={t("projects.saveToFile")}
        onApply={async (html) => {
          if (!target) return false;
          const err = await saveFileContent(target.id, html);
          if (err) return false;
          setSource(html);
          router.refresh();
          return true;
        }}
      />
    </div>
  );
}
