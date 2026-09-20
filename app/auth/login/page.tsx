"use client";

import Link from "next/link";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { Card } from "@/components/ui/Card";
import { IconGithub, IconGoogle } from "@/components/ui/Icons";
import { useLocale } from "@/lib/i18n/locale-provider";

export default function LoginPage() {
  const { t } = useLocale();

  return (
    <SiteChrome>
      <div className="max-w-sm mx-auto px-6 py-20">
        <h1 className="text-2xl font-bold text-center">{t("auth.loginTitle")}</h1>
        <p className="text-ink-secondary text-center mt-1 text-sm">
          {t("auth.noAccount")}{" "}
          <Link href="/auth/signup" className="text-accent hover:underline">
            {t("auth.signup")}
          </Link>
        </p>

        <Card className="mt-8">
          <div className="space-y-2">
            <button className="w-full flex items-center justify-center gap-2 border border-base-border rounded-full py-2.5 text-sm hover:border-accent transition-colors">
              <IconGithub className="w-4 h-4" />
              {t("auth.continueGithub")}
            </button>
            <button className="w-full flex items-center justify-center gap-2 border border-base-border rounded-full py-2.5 text-sm hover:border-accent transition-colors">
              <IconGoogle className="w-4 h-4" />
              {t("auth.continueGoogle")}
            </button>
          </div>

          <div className="flex items-center gap-3 my-5">
            <span className="h-px flex-1 bg-base-border" />
            <span className="text-xs text-ink-muted">{t("auth.or")}</span>
            <span className="h-px flex-1 bg-base-border" />
          </div>

          <form className="space-y-3">
            <input
              type="email"
              placeholder={t("auth.email")}
              dir="ltr"
              className="w-full bg-base-bg border border-base-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
            <input
              type="password"
              placeholder={t("auth.password")}
              dir="ltr"
              className="w-full bg-base-bg border border-base-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
            <button
              type="submit"
              className="w-full bg-accent text-base-bg font-semibold rounded-full py-2.5 text-sm hover:bg-accent-hover transition-colors"
            >
              {t("auth.loginSubmit")}
            </button>
          </form>
        </Card>
      </div>
    </SiteChrome>
  );
}
