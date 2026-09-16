# WEblok

ספריית בלוקים חכמים להטמעה באתרים — כל בלוק ניתן לעריכה חיה בעורך, ומופק כקוד הטמעה קצר ובטוח (ללא חשיפת מפתחות API).

## סטאק טכנולוגי

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** — עיצוב מבוסס משתני CSS למצב כהה/בהיר
- **Auth.js (NextAuth)** — התחברות/הרשמה *(עתידי, עדיין לא מחובר)*
- **Vercel** — אחסון ופריסה, כולל Vercel Functions לצד שרת
- DB מתוכנן: **Neon** או **Supabase** (Postgres, טיר חינמי) *(עתידי)*

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

מעתיקים את `.env.example` לקובץ `.env.local` וממלאים לפי הצורך:

```bash
cp .env.example .env.local
```

| משתנה | תיאור |
|---|---|
| `DATABASE_URL` | חיבור למסד הנתונים (Neon/Supabase) |
| `AUTH_SECRET` | מפתח הצפנה של Auth.js |
| `NEXTAUTH_URL` | כתובת הבסיס של האתר |
| `GEMINI_API_KEY` / `GROQ_API_KEY` | מפתחות ברירת מחדל של המערכת — **תמיד בצד שרת בלבד** |

## מבנה הפרויקט

```
app/                      עמודים (App Router)
  page.tsx                 דף הבית
  blocks/                  קטלוג הבלוקים ועורך לכל בלוק
  dashboard/                אזור אישי למשתמש מחובר
  admin/                    פאנל ניהול
  api/                      Route Handlers (צד שרת)

components/
  layout/                  הדר, וילון צד, מודאל אודות, פוטר
  home/                    קטעי דף הבית (Hero, JourneyScroll וכו')
  editor/                  טופס עריכה דינמי לבלוקים
  ui/                      רכיבים גנריים (אייקונים, מסגרות וכו')

lib/
  blocks-registry/         ליבת מנוע הבלוקים - כל בלוק בתיקייה משלו
    <slug>/
      meta.ts               שם, תיאור, קטגוריה
      config.schema.ts       הגדרת השדות הניתנים לעריכה
      generator.ts            הפקת קוד ההטמעה הבטוח
      preview.tsx              תצוגה חיה בעורך (React)
  theme-provider.tsx        ניהול מצב כהה/בהיר
```

### הוספת בלוק חדש

1. יוצרים תיקייה חדשה תחת `lib/blocks-registry/<slug>/` עם ארבעת הקבצים שמופיעים למעלה, לפי אותו ה-interface שמוגדר ב-`lib/blocks-registry/types.ts`.
2. רושמים את הבלוק ב-`lib/blocks-registry/index.ts`.
3. זהו — הקטלוג, העורך וה-API קוראים אוטומטית מהרשימה הזו, בלי לשנות קוד קיים.

## אבטחה

שדות שמסומנים `serverOnly` בסכמת הבלוק (כמו הוראות ה-AI) **לא נכנסים לקוד ההטמעה** שיוצא ללקוח. הם נשמרים ב-DB ומקושרים דרך `blockId`; קריאות ל-AI עוברות רק דרך ה-API Routes בצד השרת, יחד עם מפתחות ה-API של המשתמש.

## פריסה

הריפו מחובר ל-Vercel — כל `push` ל-`main` מפרוס אוטומטית, וכל PR מקבל Preview URL משלו. קובץ `.github/workflows/ci.yml` מריץ typecheck/lint/build לפני מיזוג.

## מצב נוכחי

- [x] דף הבית
- [x] מנוע רישום בלוקים + בלוק "העוזר החכם" לדוגמה
- [ ] קטלוג בלוקים (`/blocks`) ועמוד עורך לבלוק בודד
- [ ] התחברות/הרשמה (Auth.js)
- [ ] אזור אישי (`/dashboard`) — פרופיל, מפתחות API, עיצובים שמורים
- [ ] פאנל ניהול (`/admin`)
- [ ] חיבור מסד נתונים וסטטיסטיקות אמיתיות
