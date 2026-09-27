"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getBlockDefinition } from "@/lib/blocks-registry";
import type { BlockValues, FieldDef } from "@/lib/blocks-registry/types";
import { exportBlock, type ExportFormat } from "@/lib/blocks-registry/export";
import { downloadAsZip } from "@/lib/download-zip";
import { createClient } from "@/lib/supabase/client";
import { DynamicForm } from "@/components/editor/DynamicForm";

const FORMATS: { id: ExportFormat; label: string }[] = [
  { id: "html", label: "HTML מאוחד" },
  { id: "html-css-js", label: "HTML + CSS + JS" },
  { id: "jsx", label: "JSX" },
];

export function BlockEditorClient({
  slug,
  userId,
  initialValues,
  initialName,
  savedId,
}: {
  slug: string;
  userId: string | null;
  initialValues?: BlockValues;
  initialName?: string;
  savedId?: string;
}) {
  const router = useRouter();
  // הרישום (blocks-registry) הוא לוגיקה טהורה בצד לקוח - אין שום סיבה
  // (וגם אי אפשר, כי block.Preview/generate/toOutput הן פונקציות) להעביר
  // את האובייקט הזה משרת ללקוח. הקומפוננטה טוענת אותו בעצמה לפי ה-slug.
  const block = getBlockDefinition(slug);
  const [values, setValues] = useState<BlockValues>(initialValues ?? block?.defaultValues() ?? {});
  const [name, setName] = useState(initialName ?? block?.meta.name ?? "");
  const [previewWidth, setPreviewWidth] = useState<"mobile" | "desktop">("desktop");
  const [format, setFormat] = useState<ExportFormat>("html");
  const [aiField, setAiField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);
  const [usedAi, setUsedAi] = useState(false);
  const [aiRedesignOpen, setAiRedesignOpen] = useState(false);
  const [aiDescription, setAiDescription] = useState("");
  const [aiRedesignBusy, setAiRedesignBusy] = useState(false);
  const [aiRedesignError, setAiRedesignError] = useState<string | null>(null);

  const set = (id: string, v: string) => setValues((prev) => ({ ...prev, [id]: v }));

  const output = useMemo(
    () => (block?.toOutput ? block.toOutput(values) : null),
    [block, values]
  );
  const exported = useMemo(
    () => (output ? exportBlock(output, format) : null),
    [output, format]
  );

  if (!block) {
    return <p className="text-sm text-danger">הבלוק &quot;{slug}&quot; לא נמצא ברישום.</p>;
  }

  async function improveWithAi(field: FieldDef) {
    setAiField(field.id);
    const res = await fetch("/api/ai/improve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: values[field.id] ?? "", label: field.label }),
    }).catch(() => null);
    const data = await res?.json().catch(() => null);
    setAiField(null);
    if (res?.ok && data?.text) {
      set(field.id, data.text);
    } else if (data?.error === "no_key") {
      router.push("/dashboard/profile");
    }
  }

  async function applyAiRedesign() {
    if (!aiDescription.trim()) return;
    setAiRedesignBusy(true);
    setAiRedesignError(null);
    const res = await fetch("/api/ai/redesign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blockSlug: slug, description: aiDescription, values }),
    }).catch(() => null);
    const data = await res?.json().catch(() => null);
    setAiRedesignBusy(false);
    if (res?.ok && data?.changes) {
      setValues((prev) => ({ ...prev, ...data.changes }));
      setUsedAi(true);
      setAiDescription("");
      setAiRedesignOpen(false);
      return;
    }
    if (data?.error === "no_key") {
      router.push("/dashboard/profile");
      return;
    }
    setAiRedesignError("לא הצלחתי להחיל את הבקשה. נסו לנסח אחרת.");
  }

  async function saveDesign() {
    if (!userId) {
      router.push(`/auth/login?redirectedFrom=/blocks/${slug}`);
      return;
    }
    setSaving(true);
    setSaveState("idle");
    const supabase = createClient();
    const { error } = savedId
      ? await supabase
          .from("saved_designs")
          .update({ name, config: values, ai_edited: usedAi, updated_at: new Date().toISOString() })
          .eq("id", savedId)
      : await supabase
          .from("saved_designs")
          .insert({ user_id: userId, block_slug: slug, name, config: values, ai_edited: usedAi });
    setSaving(false);
    setSaveState(error ? "error" : "saved");
    setSaveErrorMsg(error ? error.message : null);
    if (!error) router.refresh();
  }

  function download() {
    if (!exported) return;
    if (Object.keys(exported.files).length > 1) {
      downloadAsZip(exported.files, `${slug}.zip`);
      return;
    }
    const [fileName, content] = Object.entries(exported.files)[0] as [string, string];
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const copyCode = () => {
    if (!exported) return;
    const text = Object.entries(exported.files)
      .map(([n, c]) => (Object.keys(exported.files).length > 1 ? `// ${n}\n${c}` : c))
      .join("\n\n");
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="grid lg:grid-cols-[380px_1fr] gap-6">
      {/* פאנל תצוגה + ייצוא - קודם במובייל, כדי לראות תוצאה מיד */}
      <div className="space-y-4 order-1 lg:order-2">
        <div className="flex items-center justify-between">
          <div className="flex gap-1 bg-base-panel2 rounded-full p-1 border border-base-border">
            {(["mobile", "desktop"] as const).map((w) => (
              <button
                key={w}
                onClick={() => setPreviewWidth(w)}
                className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                  previewWidth === w
                    ? "bg-accent text-base-bg font-semibold"
                    : "text-ink-secondary hover:text-ink-primary"
                }`}
              >
                {w === "mobile" ? "📱 מובייל" : "🖥️ דסקטופ"}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-card border border-base-border bg-base-bg overflow-hidden flex justify-center">
          <div
            className="h-[420px] transition-all"
            style={{ width: previewWidth === "mobile" ? "380px" : "100%" }}
          >
            <block.Preview values={values} />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={saveDesign}
            disabled={saving}
            className="bg-accent text-base-bg font-semibold rounded-full px-5 py-2 text-sm hover:bg-accent-hover transition-colors disabled:opacity-60"
          >
            {saving ? "שומר..." : saveState === "saved" ? "נשמר ✓" : "שמירת עיצוב"}
          </button>
          <button
            onClick={() => setAiRedesignOpen((v) => !v)}
            className="border border-accent/50 text-accent rounded-full px-5 py-2 text-sm hover:bg-accent/10 transition-colors"
          >
            🎨 עריכה עם AI
          </button>
          {!userId && <p className="text-xs text-ink-muted self-center">יש להתחבר כדי לשמור</p>}
          {saveState === "error" && (
            <p role="alert" className="text-xs text-danger self-center">
              {saveErrorMsg || "משהו השתבש, נסו שוב."}
            </p>
          )}
        </div>

        {aiRedesignOpen && (
          <div className="rounded-card border border-accent/40 bg-accent-soft p-3 space-y-2">
            <p className="text-xs text-ink-secondary">
              תארו איך תרצו שהבלוק ייראה, או איך להתאים אותו לאתר שלכם - למשל
              &quot;תעשה את זה יותר מינימליסטי בגוונים כהים&quot; או &quot;אין לי מקום ל-footer, שים את זה כווידג&apos;ט&quot;.
              ה-AI יכול לשנות רק עיצוב וכמה הגדרות תצוגה, לא תוכן.
            </p>
            <div className="flex gap-2">
              <input
                value={aiDescription}
                onChange={(e) => setAiDescription(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyAiRedesign()}
                placeholder="לדוגמה: עיצוב זכוכית כהה עם מגע כחול..."
                maxLength={500}
                className="flex-1 bg-base-bg border border-base-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent"
              />
              <button
                onClick={applyAiRedesign}
                disabled={aiRedesignBusy || !aiDescription.trim()}
                className="bg-accent text-base-bg font-semibold rounded-lg px-4 py-2 text-sm disabled:opacity-60 shrink-0"
              >
                {aiRedesignBusy ? "..." : "בצע"}
              </button>
            </div>
            {aiRedesignError && (
              <p role="alert" className="text-xs text-danger">{aiRedesignError}</p>
            )}
          </div>
        )}

        {exported ? (
          <>
            <div className="flex gap-1 bg-base-panel2 rounded-full p-1 border border-base-border w-fit">
              {FORMATS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id)}
                  className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                    format === f.id
                      ? "bg-accent text-base-bg font-semibold"
                      : "text-ink-secondary hover:text-ink-primary"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={download}
                className="border border-base-border rounded-full px-5 py-2 text-sm hover:border-accent transition-colors"
              >
                {Object.keys(exported.files).length > 1 ? "הורדת ZIP" : "הורדת קובץ"}
              </button>
              <button
                onClick={copyCode}
                className="border border-base-border rounded-full px-5 py-2 text-sm hover:border-accent transition-colors"
              >
                העתקת קוד
              </button>
            </div>

            <div className="rounded-card border border-base-border bg-[#0d1117] p-4 overflow-x-auto space-y-4">
              {Object.entries(exported.files).map(([fileName, content]) => (
                <div key={fileName}>
                  <p className="text-[11px] text-ink-muted mb-1" dir="ltr">{fileName}</p>
                  <pre className="text-xs text-[#a5d6ff] font-mono whitespace-pre-wrap break-all" dir="ltr">
                    {content}
                  </pre>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-ink-muted">
            הבלוק הזה עדיין לא תומך בייצוא העצמאי החדש.
          </p>
        )}
      </div>

      {/* פאנל הגדרות */}
      <div className="space-y-4 order-2 lg:order-1">
        <div className="rounded-card border border-base-border bg-base-panel/80 p-4">
          <label className="text-xs text-ink-muted mb-1 block">שם העיצוב</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            className="w-full bg-base-bg border border-base-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>

        <div className="rounded-card border border-base-border bg-base-panel/80 p-4">
          <DynamicForm
            fields={block.fields}
            values={values}
            onChange={set}
            onAiImprove={improveWithAi}
            aiBusyField={aiField}
          />
        </div>
      </div>
    </div>
  );
}
