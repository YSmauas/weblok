<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./public/brand/logo-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="./public/brand/logo-light.svg">
    <img alt="WEblok" src="./public/brand/logo-dark.svg" width="360">
  </picture>
</p>

# WEblok

ספריית בלוקים חכמים להטמעה באתרים — כל בלוק ניתן לעריכה חיה בעורך, ומופק כקוד הטמעה עצמאי ובטוח (ללא חשיפת מפתחות API). בנוסף: **מבנים** — פרויקטים שלמים (כרגע: אישורי הגעה לאירועים) שמוכנים לפריסה ב-Vercel שלכם.

> **עובדים עם כלי AI?** תנו לו את [`PROJECT_MAP.md`](./PROJECT_MAP.md) — מפת הפרויקט המלאה (מבנה, ייעוד, מלכודות ידועות). אבטחה: [`SECURITY.md`](./SECURITY.md). הקמה מאפס: [`SETUP_GUIDE.md`](./SETUP_GUIDE.md).

## סטאק טכנולוגי

- **Next.js 15.5** (App Router) + **React 19** + TypeScript
- **Tailwind CSS** — עיצוב מבוסס משתני CSS למצב כהה/בהיר, עם תמיכת RTL/LTR מלאה
- **Supabase** — DB (Postgres + RLS), Auth (Email + GitHub + Google OAuth), ו-Storage
- **Vercel** — אחסון ופריסה, כולל Vercel Functions לצד שרת
- **Gemini** — תכונות ה-AI בעורך ובהזרקה (מפתח המשתמש; ראו "AI" למטה)

ראו [`SECURITY.md`](./SECURITY.md) למדיניות האבטחה המלאה — חובה לקרוא לפני חיבור ה-DB.

## הרצה מקומית

```bash
npm install
npm run dev
```

האתר יעלה בכתובת `http://localhost:3000`.

בדיקות לפני קומיט:

```bash
npm run check:i18n   # שלוש השפות עם אותם מפתחות
npm run typecheck
npm run lint
npm run build
```

## משתני סביבה

```bash
cp .env.example .env.local
```

ראו את `.env.example` לרשימה המלאה. שניים שכדאי להכיר:

- **`KEYS_ENCRYPTION_SECRET`** — מפתח ההצפנה למפתחות API שנשמרים בשרת. חייב להיות מחרוזת base64 של **32 בתים בדיוק** (`openssl rand -base64 32`). בלעדיו שמירת מפתחות בשרת נכשלת. **אל תחליפו ואל תמחקו אותו** אחרי שנשמרו מפתחות — הם לא יפוענחו יותר. שמרו עותק במקום בטוח.
- **`NEXT_PUBLIC_SITE_URL`** — אופציונלי. כתובת האתר לצורכי SEO ולקרדיט בקוד המיוצא. אם לא הוגדר, נלקח הדומיין הראשי של Vercel אוטומטית.

## מבנה הפרויקט

```
middleware.ts              אכיפת הרשאות בצד שרת (guest/user/admin/owner)

app/
  page.tsx                  דף הבית
  blocks/                   קטלוג הבלוקים ועורך לכל בלוק
  tools/                    כלים מתקדמים: הזרקה לפרויקט קיים, ניהול מאגר GitHub
  dashboard/                אזור אישי (מוגן: user+) - פרופיל, מפתחות API, עיצובים שמורים, פרויקטים
  admin/                    פאנל ניהול (מוגן: admin+) - משתמשים, אנליטיקה, פניות
  auth/                     התחברות / הרשמה (GitHub + Google OAuth)
  api/                      Route Handlers (צד שרת - AI, מפתחות, אנליטיקה וכו')
  sitemap.ts, robots.ts     SEO

components/
  layout/                   הדר, וילון צד, מודאל אודות, פוטר
  home/                     קטעי דף הבית
  dashboard/, admin/        רכיבי הדשבורד והניהול
  ui/                       רכיבים גנריים; AppIcon.tsx = אייקוני SVG של בלוקים וכלים

lib/
  supabase/                 קליינטים: client (דפדפן), server, middleware
  crypto.ts                 הצפנת מפתחות API (AES-256-GCM)
  blocks-registry/          ליבת מנוע הבלוקים - כל בלוק בתיקייה משלו
    _shared/util.ts           סניטציה (esc/jsStr/safeLink), פענוח קישורים, שדות עיצוב משותפים
  ai/                       Gemini (שרת+דפדפן), פרומפטים ו-guardrails משותפים
  inject/                   מנוע ההזרקה: עריכות find/replace מאומתות, הזרקה פשוטה, חותמת generator
  projects/, github/        כללי קבצים ומכסה, פעולות DB, ייבוא/דחיפה ל-GitHub מהדפדפן
  site.ts                   שם/כתובת האתר - למטא, ל-sitemap ולקרדיט בקוד המיוצא
  auth/                     roles.ts (מודל ההרשאות), session.ts, use-session.ts
  i18n/                     locale-provider.tsx + locales/{he,en,es}.json
  theme-provider.tsx        ניהול מצב כהה/בהיר

public/icons/               google.png (כפתור ההתחברות), topmentors.png (פוטר ומודאל אודות)
public/brand/               לוגו WEblok: logo-dark/light (SVG+PNG), logo-mark, social-preview.png
```

## הבלוקים

| בלוק | slug | קטגוריה |
|------|------|---------|
| העוזר החכם (צ'אט) | `chatbot-assistant` | assistant |
| טופס יצירת קשר | `contact-form` | forms |
| כותרת אתר (Header) | `site-header` | layout |
| פוטר אתר (Footer) | `site-footer` | layout |
| וילון צד (Sidebar) | `site-sidebar` | layout |
| פופאפ — קידום / עוגיות / exit-intent / הודעה (בלוק גנרי אחד, לפי `popupType`) | `popup` | marketing |

כל בלוק מייצא קוד עצמאי (HTML מאוחד, HTML+CSS+JS, או JSX), בלי שרת שלנו.

### הוספת בלוק חדש

1. תיקייה חדשה תחת `lib/blocks-registry/<slug>/` עם `meta.ts`, `config.schema.ts`, `generator.ts`, `preview.tsx`, לפי ה-interface שב-`types.ts`. בלוקי הפריסה (`site-*`, `popup`) הם התבנית הנוחה להעתקה, והם משתמשים ב-`_shared/util.ts`.
2. רישום ב-`lib/blocks-registry/index.ts`.
3. **אייקון:** `meta.icon` הוא *מפתח* אייקון ולא אימוג'י. מוסיפים אייקון SVG חדש ל-`ICONS` ב-`components/ui/AppIcon.tsx`.
4. **קטגוריה חדשה:** מוסיפים אותה לטיפוס ב-`types.ts` ומפתח `blocks.cat.<category>` לכל שלושת קבצי השפה.
5. **אבטחה:** כל ערך שמגיע מהמשתמש עובר סניטציה לפני שנכנס ל-HTML/JS המיוצא (`esc`, `jsStr`, `safeLink`, `safeAsset`), וערכי `select` נבדקים מול האפשרויות שבסכמה.

### הוספת טקסט חדש ל-i18n

1. מוסיפים מפתח לכל שלושת קבצי `lib/i18n/locales/*.json` (אותו סט מפתחות בדיוק).
2. בקומפוננטת client: `const { t } = useLocale(); t("key")`.
3. שימו לב: חלק מהמפתחות נבנים דינמית (למשל `blocks.cat.<category>`, `ai.err.<code>`), אל תמחקו אותם כ"לא בשימוש".

## AI

- כל קריאה ל-Gemini עוברת דרך `lib/ai/*` — בשרת (`/api/ai/*`, מפתח מוצפן ב-DB) או בדפדפן (מפתח "בדפדפן בלבד", מוצפן ב-IndexedDB/`localStorage`).
- **שמות המודלים רק ב-`lib/ai/models.ts`** (כרגע: `gemini-3.8-flash` → `gemini-flash-latest` → 3.5 → 2.5, עם fallback אוטומטי). כשגוגל משנה שמות — אפשר לעקוף בלי קוד עם `NEXT_PUBLIC_GEMINI_MODELS` ב-Vercel.
- שגיאות AI מוצגות לפי קוד (`ai.err.<code>`): מפתח לא תקין, מכסה יומית, הגבלת קצב, מודל לא זמין, אזור, API לא מופעל, חסימה, רשת.
- בלוק "העוזר החכם" לא משתמש במפתח שלנו או של יוצר הבלוק: **המבקר באתר הלקוח** מזין מפתח משלו (Gemini/Anthropic/OpenRouter/Groq/Mistral). פירוט: [`docs/assistant-providers.md`](./docs/assistant-providers.md).

## הרשאות

ארבע דרגות: `guest → user → admin → owner`. נאכף בשתי שכבות בלתי-תלויות: `middleware.ts` (חוסם נתיבים שלמים) ו-RLS ב-Supabase (חוסם ברמת שורת ה-DB). רק הבעלים יכול למנות/להסיר מנהלים (`canManageAdmins()` ב-`lib/auth/roles.ts`). פירוט מלא ב-[`SECURITY.md`](./SECURITY.md).

## פריסה

הריפו מחובר ל-Vercel — כל `push` ל-`main` מפרוס אוטומטית. `.github/workflows/ci.yml` מריץ typecheck/lint/build לפני מיזוג.

## SEO ואינדוקס בגוגל

- האתר כולל metadata, Open Graph, `sitemap.xml`, `robots.txt` ו-JSON-LD. דפי `/dashboard`, `/admin`, `/api`, `/auth` חסומים לסריקה.
- **Google Search Console** מחובר בשיטת "URL prefix" עם אימות בקובץ `public/google*.html`. **אל תמחקו, תשנו שם או תשנו תוכן של הקובץ הזה** — האימות יישבר. הקובץ חייב להישאר נגיש בלי redirect ובלי התחברות.
- חיבור לדומיין חדש: הוסיפו property מסוג URL prefix, אמתו בקובץ HTML, שלחו `sitemap.xml` ובקשו אינדוקס לדף הבית. הופעה בחיפוש לוקחת בדרך כלל כמה ימים עד שבועות.

## מבנים

פרויקט שלם לייצוא (ZIP או דחיפה לגיטהאב) שרץ על Vercel + Supabase **של הלקוח**. הראשון: `/structures/rsvp` — הזמנה + טופס אישור הגעה, ניווט Waze/Maps, קובץ יומן, ודף ניהול מאובטח (סיסמה ב-env, עוגייה חתומה, rate limit, honeypot, RLS בלי גישה ציבורית, ייצוא CSV). שום נתון לא עובר דרך WEblok. מדריך פריסה בתוך העורך וב-README של הפרויקט המיוצא.

## מצב נוכחי

- [x] דף הבית + i18n מלא (עברית/אנגלית/ספרדית) עם בדיקת זהות מפתחות ב-CI
- [x] 6 בלוקים עם עיצובים ואנימציות מודרניים (מכבדים `prefers-reduced-motion`), תצוגה חיה בגדלי מכשיר עם דף לדוגמה
- [x] בלוק "העוזר החכם" — עוזר AI אמיתי עם מפתח של המבקר, בלי שרת
- [x] מדריך "אישור עוגיות" (`/blocks/popup/cookies`) עם קוד שנבדק בדפדפן
- [x] מבנים: אישורי הגעה לאירועים
- [x] הזרקה: עם AI (עם שומר סף שמונע הזרקת קוד זר) או בבחירת מיקום ידנית, עם טיפול בהדר קבוע וכפתורים צפים
- [x] פרויקטים קטנים: ייבוא מגיטהאב, הזרקה, ודחיפה חזרה כ-PR (רק קבצים ששונו, זיהוי קונפליקטים)
- [x] מצב בהיר/כהה בניגודיות AA, משטחים אטומים, אייקוני SVG, גופן מקומי, מובייל (`dvh`, safe-area)
- [x] אנליטיקה: גרף יומי מתוקן; מונה ביקורים ציבורי לכל גולש (מכבד DNT/GPC)
- [x] SEO: canonical לכל דף, `noindex` ב-Preview, sitemap יציב; Search Console מחובר
- [x] Next 15.5 (תיקוני אבטחה), מגבלת גודל ו-same-origin לנתיבי API

## בעבודה / מתוכנן

- [ ] מעבר ידני ב-Vercel Preview על כל הזרימות מול Supabase ו-GitHub אמיתיים
- [ ] nonce ל-CSP במקום `'unsafe-inline'`
- [ ] מעבר מ-`next lint` ל-ESLint CLI
- [ ] תרגום הטקסטים הקבועים בתוך הבלוקים המיוצאים (חלקם בעברית בלבד)
- [ ] מבנים נוספים
