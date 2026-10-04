<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./public/brand/logo-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="./public/brand/logo-light.svg">
    <img alt="WEblok" src="./public/brand/logo-dark.svg" width="360">
  </picture>
</p>

<p align="center">
  <b>בלוקים חכמים לאתר שלכם — מעצבים בעורך חי, מורידים קוד עצמאי.</b><br>
  <a href="https://weblok-alpha.vercel.app">לאתר החי</a> ·
  <a href="./SETUP_GUIDE.md">הקמה מאפס</a> ·
  <a href="./SECURITY.md">אבטחה</a> ·
  <a href="./PROJECT_MAP.md">מפת הפרויקט</a>
</p>

<p align="center">
  <img alt="Next.js 15" src="https://img.shields.io/badge/Next.js-15-black">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178c6">
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-Postgres%20%2B%20RLS-3ecf8e">
  <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-green">
</p>

> **English summary:** WEblok is an open-source library of self-contained website blocks (header, footer, sidebar, popup, contact form, AI chat assistant) with a live editor. You design a block, then download plain HTML/CSS/JS or JSX with no server, no external script and no exposed API keys. It also ships full deployable **structures** (first: an event RSVP project for your own Vercel + Supabase), an HTML **injection** tool (AI-assisted or manual placement) and a GitHub manager that runs in the browser. UI languages: Hebrew, English, Spanish.

# WEblok

ספריית בלוקים חכמים להטמעה באתרים. כל בלוק ניתן לעריכה חיה בעורך, ומופק כקוד הטמעה **עצמאי ובטוח** — בלי שרת שלנו, בלי script חיצוני ובלי חשיפת מפתחות API.

## מה יש כאן

- **בלוקים** — רכיב אחד לאתר קיים: כותרת, פוטר, וילון צד, פופאפ (קידום / הסכמת עוגיות / exit-intent / הודעה), טופס יצירת קשר ועוזר AI. מעצבים, מעתיקים או מורידים (HTML מאוחד, HTML+CSS+JS, או JSX).
- **מבנים** — פרויקט **שלם** שמוכן לפריסה על Vercel + Supabase **שלכם**. הראשון: אישורי הגעה לאירועים (הזמנה, טופס, Waze/Maps, קובץ יומן, ניהול מאובטח וייצוא CSV). שום נתון לא עובר דרך WEblok.
- **כלים** — הזרקת בלוקים לקובץ HTML קיים (עם AI או בבחירת מיקום ידנית) וניהול מאגר GitHub מהדפדפן.
- **אזור אישי** — עיצובים שמורים, מפתחות API, ופרויקטים קטנים (קבצים, ייבוא מגיטהאב, הזרקה ודחיפה חזרה כ-PR).

כל ממשק האתר זמין בעברית, אנגלית וספרדית, במצב כהה ובהיר, עם תמיכה מלאה ב-RTL/LTR.

## עקרונות

- **הכל בדפדפן כשאפשר.** הזרקה, ייצוא, GitHub ובלוק ה-AI רצים בצד הלקוח, ולכן קבצים ומפתחות של משתמשים לא עוברים בשרת. השרת משמש רק ל-Auth, ל-DB ול-AI עם מפתח מוצפן.
- **קוד מיוצא עצמאי.** בלוק לא תלוי ב-WEblok בזמן ריצה. האתר של הלקוח לא נופל אם אנחנו נופלים.
- **AI לא כותב קוד חופשי.** "עריכה עם AI" משנה רק ערכים מותרים, וההזרקה מקבלת עריכות קטנות שעוברות שומר סף.
- **אבטחה קודם.** סניטציה לכל ערך משתמש בקוד המיוצא, CSP הדוק, שתי שכבות הרשאה (middleware + RLS). פירוט ב-[`SECURITY.md`](./SECURITY.md).

## סטאק

- **Next.js 15.5** (App Router) + **React 19** + TypeScript
- **Tailwind CSS** — משתני CSS למצב כהה/בהיר, RTL/LTR
- **Supabase** — Postgres + RLS, Auth (Email, GitHub, Google), Storage
- **Vercel** — אחסון ופריסה
- **Gemini** — תכונות ה-AI. **כל משתמש מביא מפתח משלו**; אין מפתח משותף.

## הרצה מקומית

דרישות: Node 18.18 ומעלה (מומלץ 20) ופרויקט Supabase (ראו [`SETUP_GUIDE.md`](./SETUP_GUIDE.md)).

```bash
git clone https://github.com/YSmauas/weblok.git
cd weblok
npm install
cp .env.example .env.local   # ממלאים את הערכים
npm run dev                  # http://localhost:3000
```

בדיקות לפני כל קומיט / PR (רצות גם ב-CI):

```bash
npm run check:i18n   # שלוש השפות עם אותם מפתחות
npm run typecheck
npm run lint
npm run build
```

### משתני סביבה

| משתנה | חובה | תיאור |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | כן | חיבור Supabase בדפדפן |
| `SUPABASE_SECRET_KEY` | כן | מפתח שרת בלבד (service role). **לעולם לא `NEXT_PUBLIC`** |
| `SUPABASE_JWKS_URL` | לא | שמור לעתיד (server-only), לא בשימוש כרגע |
| `KEYS_ENCRYPTION_SECRET` | כן | מחרוזת base64 של **32 בתים** (`openssl rand -base64 32`). מצפין מפתחות API בשרת. **אל תחליפו ואל תמחקו** אחרי ששמורים מפתחות — הם לא יפוענחו יותר |
| `NEXT_PUBLIC_SITE_URL` | לא | כתובת האתר ל-SEO ולקרדיט בקוד המיוצא. ברירת מחדל: הדומיין של Vercel |
| `NEXT_PUBLIC_GEMINI_MODELS` | לא | עקיפת רשימת מודלי Gemini בלי שינוי קוד (ראו "AI") |

## פריסה

הריפו מתאים ל-Vercel: חיבור הריפו, הגדרת משתני הסביבה, ו-`push` ל-`main` מפרוס אוטומטית. לכל PR נבנה Preview (מסומן `noindex`). `.github/workflows/ci.yml` מריץ את הבדיקות לפני מיזוג.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FYSmauas%2Fweblok)

לפני הפריסה צריך פרויקט Supabase עם ה-migrations מ-`supabase/` — מדריך שלב-אחר-שלב ב-[`SETUP_GUIDE.md`](./SETUP_GUIDE.md).

## AI

- כל קריאה ל-Gemini עוברת דרך `lib/ai/*`: בשרת (`/api/ai/*`, המפתח מוצפן ב-DB) או ישירות מהדפדפן (מפתח "בדפדפן בלבד", מוצפן בכספת מקומית).
- שמות המודלים רק ב-`lib/ai/models.ts`, עם **fallback אוטומטי** למודל הבא כשמודל לא זמין (404), חרג ממכסה (429) או עמוס (5xx). אפשר לעקוף ב-`NEXT_PUBLIC_GEMINI_MODELS`.
- לפני שמירת מפתח נבדק מול Google שהוא תקין ושיש לו גישה למודלים.
- שגיאות מוצגות לפי קוד, יחד עם פרטים טכניים לא רגישים (`HTTP 503 · UNAVAILABLE · <model>`) שמקלים על אבחון.
- בלוק "העוזר החכם": **המבקר באתר הלקוח** מזין מפתח משלו (Gemini / Anthropic / OpenRouter / Groq / Mistral). פירוט: [`docs/assistant-providers.md`](./docs/assistant-providers.md).

## הרשאות

ארבע דרגות: `guest → user → admin → owner`, נאכף בשתי שכבות בלתי-תלויות: `middleware.ts` (חוסם נתיבים) ו-RLS ב-Supabase (חוסם ברמת שורה). רק הבעלים ממנה ומסיר מנהלים.

## מבנה הפרויקט

```
middleware.ts              אכיפת הרשאות בצד שרת

app/
  page.tsx                  דף הבית
  blocks/                   קטלוג הבלוקים ועורך לכל בלוק (+ מדריך אישור עוגיות)
  structures/               מבנים (אישורי הגעה)
  tools/                    הזרקה לפרויקט קיים, ניהול מאגר GitHub
  dashboard/                אזור אישי: פרופיל, מפתחות API, עיצובים, פרויקטים
  admin/                    פאנל ניהול: משתמשים, אנליטיקה, פניות
  auth/                     התחברות / הרשמה
  api/                      Route Handlers: AI, מפתחות, אנליטיקה, פניות
  sitemap.ts, robots.ts     SEO

components/                 layout, home, blocks, editor, structures, inject, projects, dashboard, admin, ui
lib/
  blocks-registry/          ליבת מנוע הבלוקים - כל בלוק בתיקייה משלו (+ _shared/util.ts)
  structures/               מבנים (פרויקטים לייצוא)
  ai/                       Gemini, פרומפטים, guardrails
  inject/                   מנוע ההזרקה + שומר סף
  github/, projects/        ייבוא/דחיפה ל-GitHub, פרויקטים קטנים
  supabase/, auth/, i18n/   תשתיות

public/brand/               לוגו WEblok (SVG + PNG)
public/icons/               google.png, topmentors.png
scripts/                    check-i18n, i18n-merge
supabase/                   schema + migrations
docs/                       מסמכי עזר
```

פירוט מלא של כל קובץ, ההחלטות מאחורי המבנה והמלכודות שכבר קרו: [`PROJECT_MAP.md`](./PROJECT_MAP.md).

### הוספת בלוק חדש

1. תיקייה `lib/blocks-registry/<slug>/` עם `meta.ts`, `config.schema.ts`, `generator.ts`, `preview.tsx` לפי `types.ts`. בלוקי הפריסה (`site-*`, `popup`) הם התבנית הנוחה להעתקה.
2. רישום ב-`lib/blocks-registry/index.ts`.
3. אייקון: `meta.icon` הוא *מפתח* אייקון — מוסיפים SVG ל-`ICONS` ב-`components/ui/AppIcon.tsx`.
4. קטגוריה חדשה: מוסיפים לטיפוס ב-`types.ts` ומפתח `blocks.cat.<category>` בשלוש השפות.
5. אבטחה: כל ערך משתמש עובר סניטציה (`esc`, `jsStr`, `safeLink`, `safeAsset`) לפני שנכנס ל-HTML/JS המיוצא, וערכי `select` נבדקים מול הסכמה.

### תרגום

מוסיפים מפתח לשלושת `lib/i18n/locales/*.json` (אותו סט בדיוק) ומשתמשים ב-`t("key")`. חלק מהמפתחות נבנים דינמית (`blocks.cat.<category>`, `ai.err.<code>`) — אל תמחקו אותם כ"לא בשימוש".

## תרומה

1. פותחים ענף ו-PR (לא ישר ל-`main`).
2. מריצים `check:i18n`, `typecheck`, `lint`, `build` — אותן בדיקות שה-CI מריץ.
3. לפני שינוי בקוד שמייצא HTML/JS או מזריק לקבצים: קראו את [`SECURITY.md`](./SECURITY.md).
4. דיווח על פרצת אבטחה: לפי סעיף "דיווח על פרצה" ב-[`SECURITY.md`](./SECURITY.md) (לא בכרטיס ציבורי).

## SEO

האתר כולל metadata, Open Graph, `sitemap.xml`, `robots.txt` ו-JSON-LD. דפי `/dashboard`, `/admin`, `/api`, `/auth` חסומים לסריקה, ודיפלוי Preview מסומן `noindex`. חיבור Google Search Console לדומיין חדש מתואר ב-[`SETUP_GUIDE.md`](./SETUP_GUIDE.md); **אל תמחקו או תשנו את `public/google*.html`**.

## מצב נוכחי

- [x] 6 בלוקים עם עיצובים ואנימציות (מכבדים `prefers-reduced-motion`) ותצוגה חיה בגדלי מכשיר
- [x] עוזר AI אמיתי עם מפתח של המבקר, בלי שרת
- [x] מדריך "אישור עוגיות" עם קוד שנבדק בדפדפן
- [x] מבנים: אישורי הגעה לאירועים (ZIP או דחיפה לגיטהאב)
- [x] הזרקה עם AI (שומר סף נגד קוד זר) ובבחירת מיקום ידנית
- [x] פרויקטים קטנים: ייבוא מגיטהאב, הזרקה, דחיפה חזרה כ-PR
- [x] מצב בהיר/כהה בניגודיות AA, גופן מקומי, מובייל
- [x] אנליטיקה ומונה ביקורים ציבורי (מכבד DNT/GPC)
- [x] SEO + Search Console

### בעבודה / מתוכנן

- [ ] מעבר ידני ב-Vercel Preview מול Supabase ו-GitHub אמיתיים
- [ ] nonce ל-CSP במקום `'unsafe-inline'`
- [ ] מעבר מ-`next lint` ל-ESLint CLI; שדרוג ל-Next 16 (`middleware` → `proxy`)
- [ ] תרגום הטקסטים הקבועים בתוך הבלוקים המיוצאים
- [ ] החלפת `public/icons/google.png` בנכס הרשמי של גוגל
- [ ] מבנים נוספים

## קרדיטים ורישיון

נבנה באהבה ע"י י.מ. מאואס — צוות cloud. הגופן Heebo ברישיון OFL (`app/fonts/OFL.txt`). הקוד ברישיון [MIT](./LICENSE).
