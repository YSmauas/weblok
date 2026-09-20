"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-provider";

// TODO: יוחלף בבדיקת session אמיתית מ-Auth.js
const isLoggedIn = false;

export function ContactSection() {
  const { t } = useLocale();

  if (isLoggedIn) {
    return (
      <section className="max-w-xl mx-auto px-6 py-20 text-center">
        <h2 className="text-2xl font-bold">{t("contact.loggedInTitle")}</h2>
        <p className="mt-3 text-ink-secondary">{t("contact.loggedInText")}</p>
        <Link
          href="/dashboard/contact"
          className="mt-6 inline-block bg-accent text-base-bg font-semibold rounded-full px-6 py-3 hover:bg-accent-hover transition-colors"
        >
          {t("contact.loggedInCta")}
        </Link>
      </section>
    );
  }

  return (
    <section className="max-w-xl mx-auto px-6 py-20">
      <h2 className="text-2xl font-bold text-center">{t("contact.title")}</h2>
      <p className="mt-3 text-ink-secondary text-center">{t("contact.subtitle")}</p>
      <form className="mt-8 space-y-4">
        <input
          type="text"
          placeholder={t("contact.name")}
          className="w-full bg-base-panel border border-base-border rounded-xl px-4 py-3 text-sm outline-none focus:border-accent transition-colors"
        />
        <input
          type="email"
          placeholder={t("contact.email")}
          className="w-full bg-base-panel border border-base-border rounded-xl px-4 py-3 text-sm outline-none focus:border-accent transition-colors"
        />
        <textarea
          placeholder={t("contact.message")}
          rows={4}
          className="w-full bg-base-panel border border-base-border rounded-xl px-4 py-3 text-sm outline-none focus:border-accent transition-colors resize-y"
        />
        <button
          type="submit"
          className="w-full bg-accent text-base-bg font-semibold rounded-full px-6 py-3 hover:bg-accent-hover transition-colors"
        >
          {t("contact.submit")}
        </button>
      </form>
    </section>
  );
}
