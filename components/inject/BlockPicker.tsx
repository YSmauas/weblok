"use client";

import { getBlockDefinition } from "@/lib/blocks-registry";
import type { InjectBlock } from "@/lib/inject/core";
import { useLocale } from "@/lib/i18n/locale-provider";

/** רשימת בלוקים לבחירה (תיבות סימון), עם תגית מקור: ברירת מחדל / עיצוב שמור / מהעורך. */
export function BlockPicker({
  options,
  selected,
  onChange,
}: {
  options: InjectBlock[];
  selected: string[];
  onChange: (keys: string[]) => void;
}) {
  const { t } = useLocale();

  if (options.length === 0) {
    return <p className="text-sm text-ink-muted">{t("inject.noBlocks")}</p>;
  }

  const toggle = (key: string) =>
    onChange(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key]);

  return (
    <ul className="grid sm:grid-cols-2 gap-2">
      {options.map((b) => {
        const def = getBlockDefinition(b.slug);
        const checked = selected.includes(b.key);
        const origin = b.key === "draft" ? "inject.fromEditor" : b.key.startsWith("design:") ? "inject.fromSaved" : "inject.fromDefault";
        return (
          <li key={b.key}>
            <label
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 cursor-pointer transition-colors ${
                checked ? "border-accent bg-accent-soft" : "border-base-border bg-base-bg/40 hover:border-accent/50"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(b.key)}
                className="accent-[var(--accent)] shrink-0"
              />
              <span className="text-xl shrink-0" aria-hidden>
                {def?.meta.icon ?? "🧩"}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium truncate">{b.name}</span>
                <span className="chip mt-0.5">{t(origin)}</span>
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
