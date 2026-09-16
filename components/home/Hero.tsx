import Link from "next/link";
import { PuzzleBackground } from "../ui/PuzzleBackground";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <PuzzleBackground />
      <div className="relative max-w-3xl mx-auto px-6 pt-24 pb-32 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold leading-[1.15] tracking-tight">
          בלוקים חכמים שמתחברים לאתר שלך
          <br />
          <span className="text-accent">בלחיצה, לא בפרויקט</span>
        </h1>
        <p className="mt-5 text-ink-secondary text-lg leading-relaxed max-w-xl mx-auto">
          בוחרים בלוק, מעצבים אותו בעורך חי, ומקבלים קוד הטמעה מוכן —
          בלי לחשוף מפתחות API ובלי לבנות הכל מאפס.
        </p>
        <div className="mt-9 flex items-center justify-center gap-4">
          <Link
            href="/blocks"
            className="bg-accent text-base-bg font-semibold rounded-full px-7 py-3 hover:bg-accent-hover transition-colors"
          >
            מתחילים
          </Link>
          <Link
            href="/auth/login"
            className="border border-base-border rounded-full px-7 py-3 hover:border-accent transition-colors"
          >
            הרשמה / התחברות
          </Link>
        </div>
      </div>
    </section>
  );
}
