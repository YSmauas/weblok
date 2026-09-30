"use client";

import { useLocale } from "@/lib/i18n/locale-provider";
import { Card } from "@/components/ui/Card";

const STEPS = ["design", "supabase", "github", "vercel", "test", "share"] as const;
const SECURITY = ["where", "weblok", "db", "admin", "form", "you"] as const;

const ENV_VARS = [
  { name: "SUPABASE_URL", key: "structures.guide.env.url" },
  { name: "SUPABASE_SECRET_KEY", key: "structures.guide.env.secret" },
  { name: "ADMIN_PASSWORD", key: "structures.guide.env.password" },
  { name: "ADMIN_SESSION_SECRET", key: "structures.guide.env.session" },
];

/** מדריך ייצוא ופריסה + הסבר אבטחה ("מה נשאר אצלכם, מה נשאר אצלנו: כלום") */
export function StructureGuide() {
  const { t } = useLocale();
  return (
    <section id="guide" className="mt-14 space-y-6 scroll-mt-24">
      <div>
        <h2 className="text-2xl font-extrabold">{t("structures.guide.title")}</h2>
        <p className="text-ink-secondary mt-1">{t("structures.guide.subtitle")}</p>
      </div>

      <ol className="space-y-3">
        {STEPS.map((step, i) => (
          <li key={step} className="rounded-card border border-base-border bg-base-panel/80 p-4 flex gap-3">
            <span
              aria-hidden
              className="w-8 h-8 shrink-0 rounded-full bg-accent text-base-bg font-bold text-sm flex items-center justify-center"
            >
              {i + 1}
            </span>
            <div className="min-w-0">
              <h3 className="font-semibold">{t(`structures.guide.${step}.title`)}</h3>
              <p className="text-sm text-ink-secondary mt-1 leading-relaxed whitespace-pre-line">{t(`structures.guide.${step}.text`)}</p>
              {step === "vercel" && (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <tbody>
                      {ENV_VARS.map((v) => (
                        <tr key={v.name} className="border-b border-base-border last:border-0">
                          <td className="py-2 pe-3 font-mono text-ink-primary whitespace-nowrap" dir="ltr">
                            {v.name}
                          </td>
                          <td className="py-2 text-ink-secondary [overflow-wrap:anywhere]">{t(v.key)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>

      <Card title={`🔒 ${t("structures.security.title")}`} description={t("structures.security.subtitle")}>
        <ul className="space-y-3">
          {SECURITY.map((k) => (
            <li key={k} className="text-sm leading-relaxed">
              <strong className="text-ink-primary">{t(`structures.security.${k}.title`)}</strong>{" "}
              <span className="text-ink-secondary">{t(`structures.security.${k}.text`)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
