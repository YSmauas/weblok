"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-provider";
import { copyText } from "@/lib/download";
import { AppIcon } from "@/components/ui/AppIcon";
import { GUIDE } from "./content";
import { SNIPPETS, type SnippetId } from "./snippets";

/** בלוק קוד: טקסט בלבד בתוך <pre> (אף פעם לא dangerouslySetInnerHTML) + כפתור העתקה. */
function CodeBlock({ id, label, copy, copied }: { id: SnippetId; label?: string; copy: string; copied: string }) {
  const [done, setDone] = useState(false);
  const code = SNIPPETS[id];
  return (
    <div className="mt-4 rounded-card border border-base-border overflow-hidden" dir="ltr">
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-base-panel2 border-b border-base-border">
        <span className="text-[11px] font-mono text-ink-muted truncate">{label ?? "js"}</span>
        <button
          type="button"
          onClick={async () => {
            setDone(await copyText(code));
            setTimeout(() => setDone(false), 1600);
          }}
          className="btn-outline btn-sm !px-3 !py-1 shrink-0"
          aria-live="polite"
        >
          <AppIcon name={done ? "check" : "copy"} className="!text-current" />
          {done ? copied : copy}
        </button>
      </div>
      <pre className="code-panel !rounded-none !border-0 max-h-[28rem] text-[12px] leading-relaxed" data-snippet={id}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function CookieGuide() {
  const { locale } = useLocale();
  const g = GUIDE[locale] ?? GUIDE.he;

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/blocks/popup" className="text-sm text-accent hover:underline">
        <span aria-hidden className="inline-block ltr:rotate-180">→</span> {g.back}
      </Link>

      <header className="mt-5 flex items-start gap-4">
        <span className="text-4xl shrink-0 mt-1" aria-hidden>
          <AppIcon name="cookie" />
        </span>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">{g.title}</h1>
          <p className="text-ink-secondary mt-3 leading-relaxed">{g.lead}</p>
        </div>
      </header>

      <nav aria-label={g.toc} className="mt-8 rounded-card border border-base-border bg-base-panel p-4">
        <p className="text-xs font-semibold text-ink-muted mb-2">{g.toc}</p>
        <ol className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm list-decimal ps-5">
          {g.sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-ink-secondary hover:text-accent transition-colors">
                {s.h}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {g.sections.map((s) => (
        <section key={s.id} id={s.id} className="mt-10 scroll-mt-24">
          <h2 className="text-xl font-bold">{s.h}</h2>
          {s.p?.map((p, i) => (
            <p key={i} className="mt-3 text-ink-secondary leading-relaxed">
              {p}
            </p>
          ))}
          {s.list && (
            <ul className="mt-3 space-y-2">
              {s.list.map((item, i) => (
                <li key={i} className="flex gap-2.5 text-ink-secondary leading-relaxed">
                  <span className="mt-1.5 shrink-0 text-accent text-sm" aria-hidden>
                    <AppIcon name="check" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
          {s.code && <CodeBlock id={s.code} label={s.codeLabel} copy={g.copy} copied={g.copied} />}
          {s.after?.map((p, i) => (
            <p key={i} className="mt-3 text-ink-secondary leading-relaxed">
              {p}
            </p>
          ))}
        </section>
      ))}

      <div className="mt-12">
        <Link href="/blocks/popup" className="btn-primary">
          {g.openEditor}
        </Link>
      </div>
    </article>
  );
}
