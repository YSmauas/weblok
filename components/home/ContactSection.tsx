"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useSession } from "@/lib/auth/use-session";
import { ContactForm } from "@/components/contact/ContactForm";

export function ContactSection() {
  const { t } = useLocale();
  const { loggedIn } = useSession();

  if (loggedIn) {
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
      <div className="mt-8">
        <ContactForm panel showSubject={false} />
      </div>
    </section>
  );
}
