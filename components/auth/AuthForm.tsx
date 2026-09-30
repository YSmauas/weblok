"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { Card } from "@/components/ui/Card";
import { IconGithub } from "@/components/ui/Icons";
import { useLocale } from "@/lib/i18n/locale-provider";
import { createClient } from "@/lib/supabase/client";
import { safeNext } from "@/lib/auth/redirect";

type Mode = "login" | "signup";
type Provider = "github" | "google";

const inputClass =
  "w-full bg-base-bg border border-base-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-accent";
const oauthClass =
  "w-full min-h-[44px] flex items-center justify-center gap-2.5 border border-base-border bg-base-panel2 rounded-full py-2.5 px-4 text-sm font-medium text-ink-primary hover:border-accent transition-colors disabled:opacity-60";

export function AuthForm({ mode }: { mode: Mode }) {
  const { t } = useLocale();
  const params = useSearchParams();
  const next = safeNext(params.get("redirectedFrom") ?? params.get("next"));

  const [name, setName] = useState("");
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get("error") ? t("auth.errorGeneric") : null
  );
  // הגיע מניסיון התחברות עם אימייל שלא רשום - מסבירים למה הוא בדף ההרשמה
  const [info, setInfo] = useState<string | null>(
    mode === "signup" && params.get("notice") === "no-account" ? t("auth.noAccountFound") : null
  );

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
        // בלי חשבון בכלל? מפנים להרשמה במקום להציג "סיסמה שגויה" מבלבל.
        const check = await fetch("/api/auth/check-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }).then((r) => r.json()).catch(() => null);
        if (check && check.registered === false) {
          const qs = new URLSearchParams({ email, notice: "no-account", next });
          window.location.href = `/auth/signup?${qs}`;
          return;
        }
        setError(t("auth.errorInvalid"));
        setBusy(false);
        return;
      }
      // ניווט מלא (לא router.replace) - כדי שהעוגיות של ה-session יגיעו
      // בוודאות ל-middleware בבקשה הבאה. זה מה שגרם לתחושה ש"ההתחברות
      // הצליחה אבל שום דבר לא קורה".
      window.location.href = next;
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name }, emailRedirectTo: callbackUrl() },
    });
    if (error) {
      const exists = error.code === "user_already_exists" || /already registered/i.test(error.message);
      setError(t(exists ? "auth.errorExists" : "auth.errorGeneric"));
      setBusy(false);
      return;
    }
    if (data.session) {
      window.location.href = next;
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
            href={`${isLogin ? "/auth/signup" : "/auth/login"}?next=${encodeURIComponent(next)}`}
            className="text-accent hover:underline"
          >
            {t(isLogin ? "auth.signup" : "auth.login")}
          </Link>
        </p>

        <Card className="mt-8">
          <div className="space-y-2">
            <button type="button" disabled={busy} onClick={() => oauth("github")} className={oauthClass}>
              <IconGithub className="w-5 h-5 shrink-0" />
              {t("auth.continueGithub")}
            </button>
            <button type="button" disabled={busy} onClick={() => oauth("google")} className={oauthClass}>
              {/* לפי הנחיות המותג של Google: ה-G הצבעוני תמיד על רקע לבן - גם במצב כהה (חריג מכוון לטוקנים) */}
              <span className="shrink-0 w-6 h-6 rounded-full bg-[#fff] flex items-center justify-center" aria-hidden="true">
                <Image src="/icons/google.png" alt="" width={16} height={16} />
              </span>
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
              dir={email ? "ltr" : undefined}
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
              dir={password ? "ltr" : undefined}
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
