# WEblok

ספריית בלוקים חכמים להטמעה באתרים — כל בלוק ניתן לעריכה חיה בעורך, ומופק כקוד הטמעה קצר ובטוח (ללא חשיפת מפתחות API).

## סטאק טכנולוגי

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** — עיצוב מבוסס משתני CSS למצב כהה/בהיר, עם תמיכת RTL/LTR מלאה
- **Supabase** — DB (Postgres + RLS), Auth (GitHub + Google OAuth), ו-Storage לתמונות/קבצים
- **Vercel** — אחסון ופריסה, כולל Vercel Functions לצד שרת (proxy למפתחות AI)

ראו [`SECURITY.md`](./SECURITY.md) למדיניות האבטחה המלאה — חובה לקרוא לפני חיבור ה-DB.

## הרצה מקומית

```bash
npm install
npm run dev
```

האתר יעלה בכתובת `http://localhost:3000`.

בדיקות לפני קומיט:

```bash
npm run typecheck
npm run lint
npm run build
```

## משתני סביבה

```bash
cp .env.example .env.local
```

ראו את הקובץ `.env.example` לרשימה המלאה (Supabase, OAuth, מפתחות AI, מפתח הצפנה).

## מבנה הפרויקט

```
middleware.ts              אכיפת הרשאות בצד שרת (guest/user/admin/owner)

app/
  page.tsx                  דף הבית
  blocks/                   קטלוג הבלוקים ועורך לכל בלוק
  dashboard/                אזור אישי (מוגן: user+) - פרופיל, מפתחות API, עיצובים שמורים, פרויקטים
  admin/                    פאנל ניהול (מוגן: admin+) - משתמשים, אנליטיקה, פניות
  auth/                     התחברות / הרשמה (GitHub + Google OAuth)
  api/                      Route Handlers (צד שרת - proxy ל-AI, GitHub API וכו')

components/
  layout/                   הדר, וילון צד, מודאל אודות, פוטר
  home/                     קטעי דף הבית
  dashboard/, admin/        רכיבי הדשבורד והניהול
  ui/                       רכיבים גנריים

lib/
  blocks-registry/          ליבת מנוע הבלוקים - כל בלוק בתיקייה משלו
  auth/
    roles.ts                 מודל ההרשאות
    session.ts                שכבת session (TODO: לחבר ל-Supabase Auth)
  i18n/
    locale-provider.tsx       ניהול שפה, t(), ותמיכת RTL/LTR דינמית
    locales/{he,en,es}.json   מילוני מחרוזות
  theme-provider.tsx          ניהול מצב כהה/בהיר
```

### הוספת בלוק חדש

1. תיקייה חדשה תחת `lib/blocks-registry/<slug>/` עם `meta.ts`, `config.schema.ts`, `generator.ts`, `preview.tsx`, לפי ה-interface שב-`types.ts`.
2. רישום ב-`lib/blocks-registry/index.ts`.

### הוספת טקסט חדש ל-i18n

1. מוסיפים מפתח לכל שלושת קבצי `lib/i18n/locales/*.json`.
2. בקומפוננטת client: `const { t } = useLocale(); t("key")`.

## הרשאות

ארבע דרגות: `guest → user → admin → owner`. נאכף בשתי שכבות בלתי-תלויות: `middleware.ts` (חוסם נתיבים שלמים) ו-RLS ב-Supabase (חוסם ברמת שורת ה-DB). רק הבעלים יכול למנות/להסיר מנהלים (`canManageAdmins()` ב-`lib/auth/roles.ts`). פירוט מלא ב-[`SECURITY.md`](./SECURITY.md).

## פריסה

הריפו מחובר ל-Vercel — כל `push` ל-`main` מפרוס אוטומטית. `.github/workflows/ci.yml` מריץ typecheck/lint/build לפני מיזוג.

## מצב נוכחי

- [x] דף הבית + i18n (עברית/אנגלית/ספרדית)
- [x] מנוע רישום בלוקים + בלוק "העוזר החכם" לדוגמה
- [x] אזור אישי (`/dashboard`) ופאנל ניהול (`/admin`) - UI מלא, ממתין לחיבור DB
- [x] מודל הרשאות + middleware לאכיפה
- [ ] קטלוג בלוקים (`/blocks`) ועמוד עורך לבלוק בודד
- [ ] חיבור Supabase בפועל (Auth + DB + RLS policies)
- [ ] קטלוג בלוקים נוספים
