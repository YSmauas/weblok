import type { Metadata } from "next";
import { T } from "@/components/ui/T";
import { GuestInject } from "@/components/inject/GuestInject";

export const metadata: Metadata = {
  title: "הזרקת בלוק לפרויקט קיים",
  description:
    "מעלים קובץ HTML, בוחרים בלוק, וה-AI מוסיף אותו למקום הנכון - הכל בדפדפן שלכם, בלי העלאה לשרת ובלי הרשמה.",
  alternates: { canonical: "/tools/inject" },
  openGraph: { url: "/tools/inject" },
};

export default function InjectToolPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <span className="chip">
        <T k="tools.badge" />
      </span>
      <h1 className="text-3xl font-extrabold mt-3">
        <T k="inject.title" />
      </h1>
      <p className="text-ink-secondary mt-2 max-w-2xl leading-relaxed">
        <T k="inject.subtitle" />
      </p>
      <div className="mt-8">
        <GuestInject />
      </div>
    </div>
  );
}
