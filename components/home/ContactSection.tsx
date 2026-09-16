"use client";

import Link from "next/link";

// TODO: יוחלף בבדיקת session אמיתית מ-Auth.js
const isLoggedIn = false;

export function ContactSection() {
  if (isLoggedIn) {
    return (
      <section className="max-w-xl mx-auto px-6 py-20 text-center">
        <h2 className="text-2xl font-bold">משתמש רשום?</h2>
        <p className="mt-3 text-ink-secondary">
          אפשר לשלוח לנו הודעה ישירות מהאזור האישי שלכם.
        </p>
        <Link
          href="/dashboard/contact"
          className="mt-6 inline-block bg-accent text-base-bg font-semibold rounded-full px-6 py-3 hover:bg-accent-hover transition-colors"
        >
          מעבר ליצירת קשר באזור האישי
        </Link>
      </section>
    );
  }

  return (
    <section className="max-w-xl mx-auto px-6 py-20">
      <h2 className="text-2xl font-bold text-center">יש שאלה? דברו איתנו</h2>
      <p className="mt-3 text-ink-secondary text-center">
        משתמש רשום? אפשר לשלוח ישירות מהאזור האישי.
      </p>
      <form className="mt-8 space-y-4">
        <input
          type="text"
          placeholder="שם מלא"
          className="w-full bg-base-panel border border-base-border rounded-xl px-4 py-3 text-sm outline-none focus:border-accent transition-colors"
        />
        <input
          type="email"
          placeholder="אימייל"
          className="w-full bg-base-panel border border-base-border rounded-xl px-4 py-3 text-sm outline-none focus:border-accent transition-colors"
        />
        <textarea
          placeholder="ההודעה שלכם"
          rows={4}
          className="w-full bg-base-panel border border-base-border rounded-xl px-4 py-3 text-sm outline-none focus:border-accent transition-colors resize-y"
        />
        <button
          type="submit"
          className="w-full bg-accent text-base-bg font-semibold rounded-full px-6 py-3 hover:bg-accent-hover transition-colors"
        >
          שליחה
        </button>
      </form>
    </section>
  );
}
