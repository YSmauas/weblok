import type { Metadata } from "next";
import { CookieGuide } from "./CookieGuide";

export const metadata: Metadata = {
  title: "מדריך הסכמת עוגיות - Google Analytics ו-Consent Mode v2",
  description:
    "איך לגרום לפופאפ העוגיות של WEblok באמת להשפיע: טעינת Google Analytics רק אחרי אישור, מחיקת עוגיות _ga בדחייה, חסימת כל סקריפט עד הסכמה ו-Google Consent Mode v2 - עם קוד מוכן להעתקה.",
  alternates: { canonical: "/blocks/popup/cookies" },
  openGraph: {
    url: "/blocks/popup/cookies",
    title: "מדריך הסכמת עוגיות שבאמת עובדת",
    description: "טעינת Analytics רק אחרי אישור, מחיקת עוגיות בדחייה ו-Consent Mode v2 - קוד מוכן לפופאפ העוגיות של WEblok.",
    type: "article",
  },
};

/** מדריך טכני - התוכן עצמו (3 שפות) ב-content.ts, קטעי הקוד ב-snippets.ts. */
export default function CookieGuidePage() {
  return <CookieGuide />;
}
