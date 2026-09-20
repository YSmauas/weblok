"use client";

import type { FieldDef, BlockValues } from "@/lib/blocks-registry/types";

function groupFields(fields: FieldDef[]) {
  const groups = new Map<string, FieldDef[]>();
  for (const f of fields) {
    const key = f.group ?? "כללי";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(f);
  }
  return Array.from(groups.entries());
}

export function DynamicForm({
  fields,
  values,
  onChange,
}: {
  fields: FieldDef[];
  values: BlockValues;
  onChange: (id: string, value: string) => void;
}) {
  return (
    <div className="space-y-5">
      {groupFields(fields).map(([group, groupFields]) => (
        <div key={group}>
          <p className="text-xs font-semibold text-ink-muted mb-2">{group}</p>
          <div className="space-y-3">
            {groupFields.map((field) => (
              <div
                key={field.id}
                className="bg-base-bg/60 border border-base-border rounded-xl p-3"
              >
                <label
                  htmlFor={field.id}
                  className="text-sm font-medium text-ink-primary flex items-center gap-2 mb-2"
                >
                  {field.label}
                  {field.serverOnly && (
                    <span
                      className="text-[10px] text-accent border border-accent/40 rounded-full px-2 py-0.5"
                      title="שדה זה נשמר בצד שרת בלבד ולא נכנס לקוד ההטמעה"
                    >
                      בצד שרת
                    </span>
                  )}
                </label>

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

                {field.hint && (
                  <p className="text-[11px] text-ink-muted mt-2">{field.hint}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
