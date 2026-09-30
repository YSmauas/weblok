/**
 * פרטי האתר במקום אחד - משמשים את תגיות המטא (SEO), ה-sitemap, והקרדיט
 * שנכנס לכל קוד שמיוצא או מוזרק ("חותמת יצרן").
 *
 * הכתובת נלקחת מ-NEXT_PUBLIC_SITE_URL, ואם לא הוגדר - מהדומיין הראשי ש-Vercel
 * חושף אוטומטית. בלי שניהם (פיתוח מקומי) הקרדיט מפנה לריפו בגיטהאב, כדי שלא
 * ייכנס "localhost" לקוד של אף אחד.
 */
export const SITE_NAME = "WEblok";
export const GITHUB_PROJECT = "https://github.com/YSmauas/weblok";

function resolveSiteUrl(): string | null {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;
  return null;
}

export const SITE_URL = resolveSiteUrl();

/** כתובת בסיס ל-metadata/sitemap (חייבת להיות מוחלטת גם בפיתוח). */
export const METADATA_BASE = new URL(SITE_URL ?? "http://localhost:3000");

/**
 * האם זה הדיפלוי הציבורי (Production). ב-Vercel Preview (כל ענף/PR) האתר מסומן
 * noindex וה-robots.txt חוסם הכל, כדי שכתובות preview לא ייכנסו לאינדקס
 * ויתחרו בדומיין הראשי. מחוץ ל-Vercel (פיתוח מקומי/אחסון עצמי) - כמו production.
 */
export const IS_PRODUCTION_DEPLOY = !process.env.VERCEL_ENV || process.env.VERCEL_ENV === "production";

/**
 * תאריכי עדכון תוכן ל-sitemap. מעדכנים ידנית כשתוכן הדף משתנה באמת - כך
 * lastModified לא "קופץ" בכל build, ו-Google ממשיך לסמוך עליו.
 */
export const CONTENT_UPDATED = {
  home: "2026-09-30",
  blocks: "2026-09-30",
  tools: "2026-09-30",
  structures: "2026-09-30",
} as const;

/** לאן מפנה הקרדיט בקוד המיוצא. */
export const CREDIT_URL = SITE_URL ?? GITHUB_PROJECT;

/** תוכן תגית <meta name="generator"> שנוספת לדפים שהזרקנו אליהם בלוק. */
export const GENERATOR_META = `${SITE_NAME} - ${CREDIT_URL}`;

export const SITE_DESCRIPTION =
  "ספריית בלוקים חכמים להטמעה באתרים: טפסי יצירת קשר, ווידג'טים ועוד - עריכה חיה, עריכה עם AI, הורדת קוד עצמאי והזרקה אוטומטית לפרויקט קיים.";

export const SITE_KEYWORDS = [
  "WEblok",
  "בלוקים לאתר",
  "טופס יצירת קשר",
  "ווידג'ט לאתר",
  "קוד הטמעה",
  "עורך בלוקים",
  "בינה מלאכותית",
  "הזרקת קוד",
  "HTML",
  "website blocks",
  "embed widgets",
  "contact form generator",
];
