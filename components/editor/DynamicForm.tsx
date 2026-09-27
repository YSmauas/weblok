"use client";

import { useState } from "react";
import type { FieldDef, BlockValues } from "@/lib/blocks-registry/types";
import { useLocale } from "@/lib/i18n/locale-provider";

function isVisible(field: FieldDef, values: BlockValues) {
  if (!field.dependsOn) return true;
  return field.dependsOn.equals.includes(values[field.dependsOn.field]);
}

function groupFields(fields: FieldDef[], values: BlockValues) {
  const groups = new Map<string, FieldDef[]>();
  for (const f of fields) {
    if (!isVisible(f, values)) continue;
    const key = f.group ?? "כללי";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(f);
  }
  return Array.from(groups.entries()).filter(([, list]) => list.length > 0);
}

/** אייקון "i" קטן שבלחיצה פותח בועת הסבר - במקום טקסט קבוע שתמיד תופס מקום. */
function HintButton({ hint }: { hint: string }) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="w-4 h-4 rounded-full border border-ink-muted text-ink-muted text-[10px] flex items-center justify-center hover:border-accent hover:text-accent transition-colors shrink-0"
        aria-label={t("editor.hint")}
        aria-expanded={open}
      >
        i
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute z-20 top-6 start-0 w-64 max-w-[70vw] bg-base-panel2 border border-base-border rounded-lg p-3 text-[11px] leading-relaxed text-ink-secondary shadow-lg"
        >
          {hint}
        </span>
      )}
    </span>
  );
}

export function DynamicForm({
  fields,
  values,
  onChange,
  onAiImprove,
  aiBusyField,
}: {
  fields: FieldDef[];
  values: BlockValues;
  onChange: (id: string, value: string) => void;
  /** אופציונלי - אם לא מועבר, כפתורי "שפר עם AI" לא מוצגים בכלל */
  onAiImprove?: (field: FieldDef) => void;
  /** מזהה השדה שכרגע נשלח לשיפור (מציג "משפר..." ומנטרל את הכפתור) */
  aiBusyField?: string | null;
}) {
  const { t } = useLocale();
  return (
    <div className="space-y-5">
      {groupFields(fields, values).map(([group, groupFields]) => (
        <div key={group}>
          <p className="text-xs font-semibold text-ink-muted mb-2">{group}</p>
          <div className="space-y-3">
            {groupFields.map((field) => (
              <div
                key={field.id}
                className="bg-base-bg/60 border border-base-border rounded-xl p-3"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <label
                    htmlFor={field.id}
                    className="text-sm font-medium text-ink-primary flex items-center gap-2"
                  >
                    {field.label}
                    {field.hint && <HintButton hint={field.hint} />}
                    {field.serverOnly && (
                      <span
                        className="text-[10px] text-accent border border-accent/40 rounded-full px-2 py-0.5"
                        title={t("editor.serverOnlyTitle")}
                      >
                        {t("editor.serverOnly")}
                      </span>
                    )}
                  </label>
                  {field.aiAssist && onAiImprove && (
                    <button
                      type="button"
                      onClick={() => onAiImprove(field)}
                      disabled={!!aiBusyField}
                      className="text-[11px] text-accent hover:underline disabled:opacity-50 shrink-0"
                    >
                      {aiBusyField === field.id ? t("editor.improving") : `✨ ${t("editor.improve")}`}
                    </button>
                  )}
                </div>

                {field.type === "textarea" && (
                  <textarea
                    id={field.id}
                    value={values[field.id] ?? ""}
                    onChange={(e) => onChange(field.id, e.target.value)}
                    rows={3}
                    className="w-full bg-base-bg border border-base-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent transition-colors resize-y"
                  />
                )}

                {field.type === "text" && (
                  <input
                    id={field.id}
                    type="text"
                    value={values[field.id] ?? ""}
                    onChange={(e) => onChange(field.id, e.target.value)}
                    className="w-full bg-base-bg border border-base-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent transition-colors"
                  />
                )}

                {field.type === "password" && (
                  <input
                    id={field.id}
                    type="password"
                    autoComplete="off"
                    dir="ltr"
                    value={values[field.id] ?? ""}
                    onChange={(e) => onChange(field.id, e.target.value)}
                    className="w-full bg-base-bg border border-base-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent transition-colors font-mono"
                  />
                )}

                {field.type === "select" && (
                  <select
                    id={field.id}
                    value={values[field.id] ?? ""}
                    onChange={(e) => onChange(field.id, e.target.value)}
                    className="w-full bg-base-bg border border-base-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent transition-colors"
                  >
                    {field.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}

                {field.type === "color" && (
                  <div className="flex items-center gap-3 bg-base-bg border border-base-border rounded-lg px-3 py-2">
                    <input
                      id={field.id}
                      type="color"
                      value={values[field.id] ?? "#e8a33d"}
                      onChange={(e) => onChange(field.id, e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer bg-transparent"
                    />
                    <span dir="ltr" className="text-xs text-ink-muted font-mono">
                      {(values[field.id] ?? "").toUpperCase()}
                    </span>
                  </div>
                )}

              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
