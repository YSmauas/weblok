"use client";

import { useState } from "react";
import type { StructureField, StructureImage, StructureValues } from "@/lib/structures/types";
import { MAX_IMAGE_BYTES, readImage, type ImageError } from "@/lib/structures/image";
import { formatBytes } from "@/lib/projects/files";
import { useLocale } from "@/lib/i18n/locale-provider";

const visible = (f: StructureField, values: StructureValues) =>
  !f.dependsOn || f.dependsOn.equals.includes(values[f.dependsOn.field]);

/**
 * טופס ההגדרות של מבנה. נפרד מ-DynamicForm של הבלוקים: התוויות כאן הן
 * מפתחות i18n ויש סוגי שדות נוספים (תאריך, שעה, מספר, טווח, תמונה).
 */
export function StructureForm({
  fields,
  values,
  onChange,
  image,
  onImage,
}: {
  fields: StructureField[];
  values: StructureValues;
  onChange: (id: string, value: string) => void;
  image: StructureImage | null;
  onImage: (img: StructureImage | null) => void;
}) {
  const { t } = useLocale();

  const groups: [string, StructureField[]][] = [];
  for (const f of fields) {
    if (!visible(f, values)) continue;
    const g = groups.find(([name]) => name === f.group);
    if (g) g[1].push(f);
    else groups.push([f.group, [f]]);
  }

  return (
    <div className="space-y-4">
      {groups.map(([group, list]) => (
        <fieldset key={group} className="rounded-card border border-base-border bg-base-panel/80 p-4">
          <legend className="px-1 text-sm font-bold text-ink-primary">{t(group)}</legend>
          <div className="space-y-3 mt-1">
            {list.map((field) => (
              <div key={field.id}>
                <label htmlFor={`sf-${field.id}`} className="label">
                  {t(field.label)}
                </label>
                <FieldInput field={field} value={values[field.id] ?? ""} onChange={(v) => onChange(field.id, v)} image={image} onImage={onImage} />
                {field.hint && <p className="text-[11px] text-ink-muted mt-1 leading-relaxed">{t(field.hint)}</p>}
              </div>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
  image,
  onImage,
}: {
  field: StructureField;
  value: string;
  onChange: (v: string) => void;
  image: StructureImage | null;
  onImage: (img: StructureImage | null) => void;
}) {
  const { t } = useLocale();
  const id = `sf-${field.id}`;

  switch (field.type) {
    case "textarea":
      return (
        <textarea
          id={id}
          value={value}
          maxLength={field.maxLength}
          rows={4}
          onChange={(e) => onChange(e.target.value)}
          className="field resize-y"
        />
      );
    case "select":
      return (
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="field">
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {t(o.label)}
            </option>
          ))}
        </select>
      );
    case "color":
      return (
        <div className="flex items-center gap-2">
          <input
            id={id}
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : field.default}
            onChange={(e) => onChange(e.target.value)}
            className="h-10 w-14 shrink-0 cursor-pointer rounded-lg border border-base-border bg-base-bg p-1"
          />
          <input
            aria-label={t(field.label)}
            dir="ltr"
            value={value}
            maxLength={7}
            onChange={(e) => onChange(e.target.value.trim())}
            className="field font-mono"
          />
        </div>
      );
    case "date":
    case "time":
      return <input id={id} type={field.type} dir="ltr" value={value} onChange={(e) => onChange(e.target.value)} className="field" />;
    case "number":
      return (
        <input
          id={id}
          type="number"
          inputMode="numeric"
          dir="ltr"
          min={field.min}
          max={field.max}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="field w-28"
        />
      );
    case "range":
      return (
        <div className="flex items-center gap-3">
          <input
            id={id}
            type="range"
            min={field.min}
            max={field.max}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 accent-[var(--accent)]"
          />
          <span className="text-xs text-ink-secondary w-10 text-end tabular-nums" dir="ltr">
            {value}%
          </span>
        </div>
      );
    case "image":
      return <ImageInput id={id} image={image} onImage={onImage} />;
    default:
      return (
        <input
          id={id}
          value={value}
          maxLength={field.maxLength}
          dir={field.ltr ? "ltr" : undefined}
          spellCheck={field.ltr ? false : undefined}
          onChange={(e) => onChange(e.target.value)}
          className={`field ${field.ltr ? "font-mono text-xs" : ""}`}
        />
      );
  }
}

/** העלאת תמונת רקע - נקראת בדפדפן בלבד, לא נשלחת לשום שרת */
function ImageInput({ id, image, onImage }: { id: string; image: StructureImage | null; onImage: (img: StructureImage | null) => void }) {
  const { t } = useLocale();
  const [error, setError] = useState<ImageError | null>(null);
  const [busy, setBusy] = useState(false);

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    const res = await readImage(file);
    setBusy(false);
    if (res.ok) onImage(res.image);
    else setError(res.error);
  }

  return (
    <div className="space-y-2">
      {image ? (
        <div className="flex items-center gap-3 rounded-xl border border-base-border bg-base-bg/60 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- data URL מקומי, לא משאב רשת */}
          <img src={`data:${image.mime};base64,${image.base64}`} alt="" className="h-14 w-14 rounded-lg object-cover" />
          <div className="min-w-0 flex-1 text-xs text-ink-secondary" dir="ltr">
            bg.{image.ext} · {formatBytes(image.size)}
          </div>
          <button type="button" onClick={() => onImage(null)} className="text-xs text-danger hover:underline px-2">
            {t("structures.form.removeImage")}
          </button>
        </div>
      ) : null}
      <label className="btn-outline btn-sm cursor-pointer w-fit">
        {busy ? t("projects.working") : t(image ? "structures.form.replaceImage" : "structures.form.uploadImage")}
        <input
          id={id}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => {
            pick(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </label>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {t(`structures.img.err.${error}`).replace("{max}", formatBytes(MAX_IMAGE_BYTES))}
        </p>
      )}
    </div>
  );
}
