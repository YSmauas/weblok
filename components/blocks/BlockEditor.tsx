"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { BrowserFrame } from "@/components/ui/BrowserFrame";
import { DynamicForm } from "@/components/editor/DynamicForm";
import { getBlockDefinition } from "@/lib/blocks-registry";
import type { BlockValues } from "@/lib/blocks-registry/types";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useSession } from "@/lib/auth/use-session";
import { createClient } from "@/lib/supabase/client";

type Status = { kind: "info" | "error"; key: string } | null;

/** עורך חי לבלוק: טופס הגדרות, תצוגה מקדימה, קוד הטמעה ושמירה לעיצובים השמורים. */
export function BlockEditor({ slug, designId }: { slug: string; designId: string | null }) {
  const def = getBlockDefinition(slug)!;
  const { t } = useLocale();
  const { loggedIn, loading } = useSession();
  const router = useRouter();

  const [values, setValues] = useState<BlockValues>(() => def.defaultValues());
  const [name, setName] = useState(def.meta.name);
  const [id, setId] = useState<string | null>(designId);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  // טעינת עיצוב שמור (?design=<id>). RLS מחזיר רק עיצובים של המשתמש עצמו.
  useEffect(() => {
    if (!designId) return;
    let alive = true;
    createClient()
      .from("saved_designs")
      .select("name, config, block_slug")
      .eq("id", designId)
      .maybeSingle()
      .then(({ data }) => {
        if (!alive) return;
        if (!data || data.block_slug !== slug) {
          setId(null);
          setStatus({ kind: "error", key: "blocks.designNotFound" });
          return;
        }
        const config = (data.config ?? {}) as Record<string, unknown>;
        const merged = def.defaultValues();
        for (const f of def.fields) {
          if (typeof config[f.id] === "string") merged[f.id] = config[f.id] as string;
        }
        setValues(merged);
        setName(data.name);
      });
    return () => {
      alive = false;
    };
  }, [designId, slug, def]);

  const code = useMemo(() => def.generate(values, id ?? undefined), [def, values, id]);

  async function save() {
    setBusy(true);
    setStatus(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setBusy(false);
      setStatus({ kind: "error", key: "blocks.loginToSave" });
      return;
    }

    const row = { name: name.trim() || def.meta.name, config: values, updated_at: new Date().toISOString() };
    const { data, error } = id
      ? await supabase.from("saved_designs").update(row).eq("id", id).select("id").single()
      : await supabase
          .from("saved_designs")
          .insert({ ...row, user_id: user.id, block_slug: slug })
          .select("id")
          .single();

    setBusy(false);
    if (error || !data) {
      setStatus({ kind: "error", key: "blocks.saveFailed" });
      return;
    }
    if (!id) {
      setId(data.id);
      router.replace(`/blocks/${slug}?design=${data.id}`, { scroll: false });
    }
    setStatus({ kind: "info", key: "blocks.saved" });
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* דפדפן בלי הרשאת clipboard - המשתמש יכול לסמן ולהעתיק ידנית */
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <Link href="/blocks" className="text-sm text-accent hover:underline">
        {t("blocks.all")}
      </Link>
      <div className="flex items-center gap-3 mt-3">
        <span className="text-3xl" aria-hidden>{def.meta.icon}</span>
        <div>
          <h1 className="text-2xl font-extrabold">{def.meta.name}</h1>
          <p className="text-sm text-ink-secondary">{def.meta.description}</p>
        </div>
      </div>

      <div className="mt-8 grid lg:grid-cols-[360px_1fr] gap-6 items-start">
        <Card title={t("blocks.settings")}>
          <label htmlFor="design-name" className="text-xs font-semibold text-ink-muted">
            {t("blocks.designName")}
          </label>
          <input
            id="design-name"
            value={name}
            maxLength={100}
            onChange={(e) => setName(e.target.value)}
            className="w-full mt-2 mb-5 bg-base-bg border border-base-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <DynamicForm
            fields={def.fields}
            values={values}
            onChange={(fid, v) => setValues((prev) => ({ ...prev, [fid]: v }))}
          />

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {loggedIn ? (
              <button
                onClick={save}
                disabled={busy}
                className="bg-accent text-base-bg font-semibold rounded-full px-5 py-2 text-sm hover:bg-accent-hover transition-colors disabled:opacity-60"
              >
                {t(busy ? "blocks.saving" : "blocks.save")}
              </button>
            ) : (
              !loading && (
                <Link
                  href={`/auth/login?next=${encodeURIComponent(`/blocks/${slug}`)}`}
                  className="text-sm text-accent hover:underline"
                >
                  {t("blocks.loginToSave")}
                </Link>
              )
            )}
            <button
              onClick={() => setValues(def.defaultValues())}
              className="text-sm text-ink-muted hover:text-ink-primary"
            >
              {t("blocks.reset")}
            </button>
          </div>
          {status && (
            <p
              role="status"
              className={`mt-3 text-sm ${status.kind === "error" ? "text-danger" : "text-success"}`}
            >
              {t(status.key)}
            </p>
          )}
        </Card>

        <div className="space-y-6 min-w-0">
          <div>
            <h2 className="text-sm font-semibold text-ink-muted mb-2">{t("blocks.preview")}</h2>
            <BrowserFrame url="your-site.com">
              <div className="h-[480px] bg-base-bg">
                <def.Preview values={values} />
              </div>
            </BrowserFrame>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-ink-muted">{t("blocks.code")}</h2>
              <button onClick={copy} className="text-sm text-accent hover:underline">
                {t(copied ? "common.copied" : "common.copy")}
              </button>
            </div>
            <pre
              dir="ltr"
              className="text-xs bg-base-panel2 border border-base-border rounded-xl p-4 overflow-x-auto whitespace-pre"
            >
              <code>{code}</code>
            </pre>
            <p className="text-xs text-ink-muted mt-2">{t("blocks.codeHint")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
