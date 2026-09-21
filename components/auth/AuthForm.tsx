"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { Card } from "@/components/ui/Card";
import { IconGithub, IconGoogle } from "@/components/ui/Icons";
import { useLocale } from "@/lib/i18n/locale-provider";
import { createClient } from "@/lib/supabase/client";
import { safeNext } from "@/lib/auth/redirect";

type Mode = "login" | "signup";
type Provider = "github" | "google";

const inputClass =
  "w-full bg-base-bg border border-base-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-accent";
const oauthClass =
  "w-full flex items-center justify-center gap-2 border border-base-border rounded-full py-2.5 text-sm hover:border-accent transition-colors disabled:opacity-60";

export function AuthForm({ mode }: { mode: Mode }) {
  const { t } = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("redirectedFrom") ?? params.get("next"));

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get("error") ? t("auth.errorGeneric") : null
  );
  const [info, setInfo] = useState<string | null>(null);

  const isLogin = mode === "login";
  const callbackUrl = () =>
    `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function oauth(provider: Provider) {
    setError(null);
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: callbackUrl() },
    });
    if (error) {
      setError(t("auth.errorGeneric"));
      setBusy(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    const supabase = createClient();

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(t("auth.errorInvalid"));
        setBusy(false);
        return;
      }
      router.replace(next);
      router.refresh();
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name }, emailRedirectTo: callbackUrl() },
    });
    if (error) {
      setError(t("auth.errorGeneric"));
      setBusy(false);
      return;
    }
    if (data.session) {
      router.replace(next);
      router.refresh();
      return;
    }
    setInfo(t("auth.checkEmail"));
    setBusy(false);
  }

  return (
    <SiteChrome>
      <div className="max-w-sm mx-auto px-6 py-20">
        <h1 className="text-2xl font-bold text-center">
          {t(isLogin ? "auth.loginTitle" : "auth.signupTitle")}
        </h1>
        <p className="text-ink-secondary text-center mt-1 text-sm">
          {t(isLogin ? "auth.noAccount" : "auth.haveAccount")}{" "}
          <Link
            href={isLogin ? "/auth/signup" : "/auth/login"}
            className="text-accent hover:underline"
          >
            {t(isLogin ? "auth.signup" : "auth.login")}
          </Link>
        </p>

        <Card className="mt-8">
          <div className="space-y-2">
            <button type="button" disabled={busy} onClick={() => oauth("github")} className={oauthClass}>
              <IconGithub className="w-4 h-4" />
              {t("auth.continueGithub")}
            </button>
            <button type="button" disabled={busy} onClick={() => oauth("google")} className={oauthClass}>
              <IconGoogle className="w-4 h-4" />
              {t("auth.continueGoogle")}
            </button>
          </div>

          <div className="flex items-center gap-3 my-5">
            <span className="h-px flex-1 bg-base-border" />
            <span className="text-xs text-ink-muted">{t("auth.or")}</span>
            <span className="h-px flex-1 bg-base-border" />
          </div>

          <form className="space-y-3" onSubmit={onSubmit}>
            {!isLogin && (
              <input
                type="text"
                required
                maxLength={80}
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("auth.fullName")}
                className={inputClass}
              />
            )}
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("auth.email")}
              dir="ltr"
              className={inputClass}
            />
            <input
              type="password"
              required
              minLength={8}
              autoComplete={isLogin ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("auth.password")}
              dir="ltr"
              className={inputClass}
            />

            {error && (
              <p role="alert" className="text-sm text-red-500">
                {error}
              </p>
            )}
            {info && (
              <p role="status" className="text-sm text-ink-secondary">
                {info}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-accent text-base-bg font-semibold rounded-full py-2.5 text-sm hover:bg-accent-hover transition-colors disabled:opacity-60"
            >
              {t(isLogin ? "auth.loginSubmit" : "auth.signupSubmit")}
            </button>
          </form>
        </Card>
      </div>
    </SiteChrome>
  );
}
