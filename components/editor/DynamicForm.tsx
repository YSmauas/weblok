"use client";

import { useEffect, useState } from "react";
import type { FieldDef, BlockValues } from "@/lib/blocks-registry/types";
import { AppIcon } from "@/components/ui/AppIcon";
import { Popover } from "@/components/ui/Popover";
import { useTf } from "@/components/editor/useTf";

/**
 * שדה מוצג רק אם התנאי שלו מתקיים *וגם* השדה שהוא תלוי בו מוצג בעצמו
 * (תלות שרשרת: "טקסט כפתור השקה" תלוי ב"כפתור השקה", שמוסתר בעוגיות).
 */
function isVisible(field: FieldDef, values: BlockValues, byId: Map<string, FieldDef>, depth = 0): boolean {
  if (!field.dependsOn) return true;
  if (!field.dependsOn.equals.includes(values[field.dependsOn.field])) return false;
  const parent = byId.get(field.dependsOn.field);
  return !parent || depth > 5 || isVisible(parent, values, byId, depth + 1);
}

const DEFAULT_GROUP = "כללי";

function groupFields(fields: FieldDef[], values: BlockValues) {
  const byId = new Map(fields.map((f) => [f.id, f]));
  const groups = new Map<string, FieldDef[]>();
  for (const f of fields) {
    if (!isVisible(f, values, byId)) continue;
    const key = f.group ?? DEFAULT_GROUP;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(f);
  }
  return Array.from(groups.entries()).filter(([, list]) => list.length > 0);
}

/**
 * שמות הקבוצות בסכמות הם מחרוזות עבריות (ככה נשמרו מאז ומתמיד) - ממופים כאן
 * למפתח תרגום + אייקון. קבוצה לא מוכרת מוצגת כמו שהיא, עם אייקון כללי.
 */
const GROUPS: Record<string, { key: string; icon: string }> = {
  סוג: { key: "type", icon: "layers" },
  תוכן: { key: "content", icon: "text" },
  התנהגות: { key: "behavior", icon: "clock" },
  תצוגה: { key: "display", icon: "layout" },
  עיצוב: { key: "design", icon: "palette" },
  אנימציה: { key: "animation", icon: "wand" },
  מותג: { key: "brand", icon: "tag" },
  ניווט: { key: "nav", icon: "compass" },
  קישורים: { key: "links", icon: "link" },
  יעד: { key: "target", icon: "send" },
  שדות: { key: "fields", icon: "list" },
  [DEFAULT_GROUP]: { key: "general", icon: "sliders" },
};

const SWATCHES = ["#38bdf8", "#6366f1", "#a855f7", "#ec4899", "#ef4444", "#f59e0b", "#10b981", "#0f172a"];

function useOpenGroups(storageKey: string | undefined, groupNames: string[]) {
  const storeKey = storageKey ? `weblok-editor-groups:${storageKey}` : null;
  const [state, setState] = useState<Record<string, boolean>>({});

  // נטען אחרי mount (localStorage לא קיים בשרת); עטוף ב-try - מצב פרטי/חסום לא שובר את הטופס
  useEffect(() => {
    if (!storeKey) return;
    try {
      const raw = window.localStorage.getItem(storeKey);
      if (raw) setState(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, [storeKey]);

  // ברירת מחדל: שתי הקבוצות הראשונות פתוחות, השאר מקופלות
  const isOpen = (g: string) => state[g] ?? groupNames.indexOf(g) < 2;
  const toggle = (g: string) => {
    setState((prev) => {
      const next = { ...prev, [g]: !(prev[g] ?? groupNames.indexOf(g) < 2) };
      if (storeKey) {
        try {
          window.localStorage.setItem(storeKey, JSON.stringify(next));
        } catch {
          /* ignore */
        }
      }
      return next;
    });
  };
  return { isOpen, toggle };
}

/** אייקון "i" קטן שבלחיצה פותח בועת הסבר קריאה (Popover) - במקום טקסט קבוע שתמיד תופס מקום. */
function HintButton({ hint }: { hint: string }) {
  const { t } = useTf();
  return (
    <Popover
      label={t("editor.hint")}
      trigger={<AppIcon name="info" className="!text-current" />}
      triggerClassName="w-5 h-5 -my-1 rounded-full inline-flex items-center justify-center text-ink-muted hover:text-accent focus-visible:text-accent transition-colors shrink-0 text-[15px]"
    >
      {hint}
    </Popover>
  );
}

export function DynamicForm({
  fields,
  values,
  onChange,
  onAiImprove,
  aiBusyField,
  storageKey,
}: {
  fields: FieldDef[];
  values: BlockValues;
  onChange: (id: string, value: string) => void;
  /** אופציונלי - אם לא מועבר, כפתורי "שפר עם AI" לא מוצגים בכלל */
  onAiImprove?: (field: FieldDef) => void;
  /** מזהה השדה שכרגע נשלח לשיפור (מציג "משפר..." ומנטרל את הכפתור) */
  aiBusyField?: string | null;
  /** מפתח לזכירת קבוצות פתוחות/סגורות (למשל slug הבלוק). בלי - לא נשמר. */
  storageKey?: string;
}) {
  const { t, tf } = useTf();
  const grouped = groupFields(fields, values);
  const { isOpen, toggle } = useOpenGroups(storageKey, grouped.map(([g]) => g));

  const inputCls =
    "w-full bg-base-bg border border-base-border rounded-lg px-3 py-2 text-sm text-ink-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/25 transition";

  return (
    <div className="space-y-3">
      {grouped.map(([group, list], gi) => {
        const meta = GROUPS[group];
        const title = meta ? tf(`editor.group.${meta.key}`, group) : group;
        const open = isOpen(group);
        const panelId = `grp-${storageKey ?? "form"}-${gi}`;
        return (
          <section key={group} className="rounded-xl border border-base-border bg-base-bg/40 overflow-hidden">
            <h3>
              <button
                type="button"
                onClick={() => toggle(group)}
                aria-expanded={open}
                aria-controls={panelId}
                className="w-full flex items-center gap-2.5 px-3.5 py-3 text-start hover:bg-base-panel2/70 transition-colors"
              >
                <span className="w-7 h-7 rounded-lg bg-accent-soft flex items-center justify-center text-[15px] shrink-0">
                  <AppIcon name={meta?.icon ?? "sliders"} />
                </span>
                <span className="font-semibold text-sm text-ink-primary flex-1">{title}</span>
                <span className="text-[11px] text-ink-muted tabular-nums">{list.length}</span>
                <AppIcon name="chevron" className={`!text-ink-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
              </button>
            </h3>
            {open && (
              <div id={panelId} className="px-3.5 pb-3.5 pt-1 space-y-3 animate-fadeInUp">
                {list.map((field) => (
                  <div key={field.id}>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="flex items-center gap-1.5 min-w-0">
                        <label htmlFor={field.id} className="text-[13px] font-medium text-ink-secondary">
                          {field.label}
                        </label>
                        {field.hint && <HintButton hint={field.hint} />}
                        {field.serverOnly && (
                          <span
                            className="text-[10px] text-accent border border-accent/40 rounded-full px-2 py-0.5"
                            title={t("editor.serverOnlyTitle")}
                          >
                            {t("editor.serverOnly")}
                          </span>
                        )}
                      </span>
                      {field.aiAssist && onAiImprove && (
                        <button
                          type="button"
                          onClick={() => onAiImprove(field)}
                          disabled={!!aiBusyField}
                          className="inline-flex items-center gap-1 text-[11px] text-accent hover:underline disabled:opacity-50 shrink-0"
                        >
                          <AppIcon name="sparkles" className="!text-current" />
                          {aiBusyField === field.id ? t("editor.improving") : t("editor.improve")}
                        </button>
                      )}
                    </div>

                    {field.type === "textarea" && (
                      <textarea
                        id={field.id}
                        value={values[field.id] ?? ""}
                        onChange={(e) => onChange(field.id, e.target.value)}
                        rows={3}
                        className={`${inputCls} resize-y`}
                      />
                    )}

                    {field.type === "text" && (
                      <input id={field.id} type="text" value={values[field.id] ?? ""} onChange={(e) => onChange(field.id, e.target.value)} className={inputCls} />
                    )}

                    {field.type === "password" && (
                      <input
                        id={field.id}
                        type="password"
                        autoComplete="off"
                        dir="ltr"
                        value={values[field.id] ?? ""}
                        onChange={(e) => onChange(field.id, e.target.value)}
                        className={`${inputCls} font-mono`}
                      />
                    )}

                    {field.type === "select" && (
                      <select id={field.id} value={values[field.id] ?? ""} onChange={(e) => onChange(field.id, e.target.value)} className={inputCls}>
                        {field.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    )}

                    {field.type === "color" && (
                      <div className="flex flex-wrap items-center gap-2 bg-base-bg border border-base-border rounded-lg px-3 py-2">
                        <input
                          id={field.id}
                          type="color"
                          value={values[field.id] ?? "#e8a33d"}
                          onChange={(e) => onChange(field.id, e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer bg-transparent"
                        />
                        <span dir="ltr" className="text-xs text-ink-muted font-mono me-auto">
                          {(values[field.id] ?? "").toUpperCase()}
                        </span>
                        <span className="flex flex-wrap gap-1.5" role="group" aria-label={field.label}>
                          {SWATCHES.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => onChange(field.id, c)}
                              aria-label={c}
                              aria-pressed={(values[field.id] ?? "").toLowerCase() === c}
                              className="w-5 h-5 rounded-full border border-base-border transition-transform hover:scale-110 aria-pressed:ring-2 aria-pressed:ring-accent aria-pressed:ring-offset-1 aria-pressed:ring-offset-base-bg"
                              style={{ background: c }}
                            />
                          ))}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
