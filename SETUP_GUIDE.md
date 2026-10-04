# מדריך חיבור לשרת - WEblok

## שלב 1: יצירת פרויקט ב-Supabase

1. נכנסים ל-https://supabase.com/dashboard ויוצרים פרויקט חדש (חינמי).
2. **SQL Editor → New query**, מדביקים את כל התוכן של `supabase/schema.sql`, ולוחצים **Run**.
   זה יוצר את כל הטבלאות, ההרשאות (RLS) והפונקציות המאובטחות (בדיוק כמו בפרויקט כושרמט ששלחת).
3. **Project Settings → API** — מעתיקים ארבעה ערכים:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `Publishable key` → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `Secret key` → `SUPABASE_SECRET_KEY` (**סודי לגמרי, לא לשים ב-`NEXT_PUBLIC_*`**)
   - `JWKS URL` → `SUPABASE_JWKS_URL` (server-only, לאימות טוקנים מהיר ב-middleware)

## שלב 2: התחברות עם GitHub ו-Google

**Project Settings → Authentication → Providers:**

- **GitHub**: צריך ליצור OAuth App ב-https://github.com/settings/developers (Callback URL: `<כתובת-הפרויקט-בסופאבייס>/auth/v1/callback`), ולהדביק את ה-Client ID/Secret שם ב-Supabase.
- **Google**: אותו דבר דרך https://console.cloud.google.com/apis/credentials.

## שלב 3: הפיכת עצמך ל-Owner (פעם אחת בלבד)

1. נרשמים לאתר פעם אחת (אחרי שהכל מחובר).
2. ב-SQL Editor: `select id, name from public.profiles;` ומעתיקים את ה-`id` שלכם.
3. מריצים:
   ```sql
   update public.profiles set role = 'owner' where id = 'ה-UUID-שלכם';
   ```
   (זה השדה היחיד שנקבע ידנית ב-SQL ולא דרך הפונקציה `set_user_role` - כי אין עדיין owner שיריץ אותה).

## שלב 4: משתני סביבה

**מקומית** - `.env.local` (לפי `.env.example`).

**ב-Vercel** - Project Settings → Environment Variables, אותם ערכים בדיוק. לאחר השמירה - **Redeploy** (Vercel לא קורא env vars חדשים ל-deployment קיים).

---

## שלב 5: מצב הקוד

כל חיבורי ה-DB כבר בקוד (אין יותר TODO): session ו-middleware אמיתיים, ניהול משתמשים, פניות, מפתחות API מוצפנים, אווטאר, עיצובים ופרויקטים.
מה שנשאר לעשות ידנית: להריץ את `supabase/schema.sql` ואחריו `supabase/migrations/0002_stage2_hardening.sql` (אם הפרויקט חדש), להגדיר `KEYS_ENCRYPTION_SECRET` (`openssl rand -base64 32`), להפעיל Manual Linking ב-Supabase Auth (לחיבור GitHub מהפרופיל), ולהפעיל Leaked Password Protection.

---

## שלב 6: פרויקטים קטנים והזרקה (migration 0004)

להריץ ב-SQL Editor את `supabase/migrations/0004_projects_files.sql`. הוא מוסיף:
- `saved_designs.ai_edited` (העורך כבר כותב אליה - בלעדיה שמירת עיצוב נכשלת),
- טבלת `project_files` עם RLS וטריגר שאוכף מכסה של 5MB לכל משתמש,
- `projects.github_branch`.

אופציונלי: `NEXT_PUBLIC_SITE_URL` (ר' `.env.example`) - לתגיות מטא ולקרדיט בקוד המיוצא.

## שלב 7: ספירת כניסות ואנליטיקה (migration 0005)

להריץ ב-SQL Editor את `supabase/migrations/0005_login_stats_analytics.sql`. הוא מוסיף ספירת כניסות (טריגר על `auth.sessions`, עם השלמת היסטוריה מיומן האימות אם קיים), את `public_stats_totals()` לדף הבית, ואת `admin_analytics_v2()` לפאנל הניהול. עד ההרצה - המספרים החדשים מוצגים כ"—".

## שלב 8: מונה ביקורים ציבורי (migration 0006)

להריץ ב-SQL Editor את `supabase/migrations/0006_public_visit_stats.sql`. מעדכן את `public_stats_totals()` כך שדף הבית מציג **ביקורים** (כל גולש, גם לא רשום) ולא רק כניסות, ומוסיף אינדקס לספירה. עד ההרצה המספרים החדשים מוצגים כ"—".

## שלב 9: מפתחות, AI ומשתני סביבה - סיכום

| משתנה | חובה? | הערה |
|---|---|---|
| `KEYS_ENCRYPTION_SECRET` | כן (לשמירת מפתחות בשרת) | base64 של **32 בתים בדיוק**: `openssl rand -base64 32`. אסור להחליף/למחוק אחרי שנשמרו מפתחות - הם לא יפוענחו יותר. משמש גם כ"מלח" ל-hash של IP בהגבלת קצב. |
| `NEXT_PUBLIC_GEMINI_MODELS` | לא | רשימת מודלים מופרדת בפסיקים שעוקפת את ברירת המחדל ב-`lib/ai/models.ts`. שימושי כשגוגל משנה שמות מודלים: משנים ב-Vercel ועושים Redeploy, בלי שינוי קוד. |
| `NEXT_PUBLIC_SITE_URL` | לא | כתובת האתר ל-SEO ולקרדיט בקוד המיוצא. בלעדיו נלקח הדומיין הראשי של Vercel. |
| `GEMINI_API_KEY` | לא | לא בשימוש כרגע: כל משתמש מביא מפתח משלו (בפרופיל, או בדפדפן בלבד). |

## שלב 10: חיבור Google Search Console לדומיין חדש

האתר הנוכחי (`https://weblok-alpha.vercel.app`) **כבר מחובר ומאומת** - אין צורך לחזור על זה. לדומיין חדש:

1. https://search.google.com/search-console → **Add property** → **URL prefix** → הכתובת המלאה (כולל `https://`).
2. שיטת אימות: **HTML file**. מורידים את הקובץ (`google<קוד>.html`), שמים אותו בתיקייה `public/` בלי לשנות שם או תוכן, ודוחפים. אחרי הפריסה בודקים שהכתובת `https://<הדומיין>/google<קוד>.html` נפתחת ישירות (200, בלי הפניה ובלי התחברות) - ה-matcher ב-`middleware.ts` כבר מחריג קבצים כאלה. לוחצים **Verify**.
   - **לא למחוק את הקובץ אחרי האימות** - גוגל בודקת אותו שוב מדי פעם.
3. **Sitemaps** → מזינים `sitemap.xml` → Submit.
4. **URL inspection** → כתובת דף הבית → **Request indexing** (יש מכסה יומית; מספיק לדף הבית ולדפים הראשיים - השאר יתגלו דרך ה-sitemap).
5. הופעה בתוצאות החיפוש לוקחת בדרך כלל **כמה ימים עד כמה שבועות**. הדוח "Pages" ב-Search Console מראה מה נסרק ולמה דפים לא אונדקסו.

הערות:
- בדיפלוי **Preview** של Vercel האתר מסומן `noindex` וה-`robots.txt` חוסם הכל (`IS_PRODUCTION_DEPLOY` ב-`lib/site.ts`), כך שכתובות preview לא מתחרות בדומיין הראשי.
- כשמוסיפים/מסירים דף ציבורי (בלוק, כלי, מבנה) - לעדכן את `app/sitemap.ts`; בלוקים נכנסים אוטומטית מהרישום. כשתוכן משתנה באמת - לעדכן את התאריך ב-`CONTENT_UPDATED` (`lib/site.ts`).

## שלב 11: כפתור "המשך עם Google" - הנכס הרשמי

`public/icons/google.png` הוא שחזור של סמל ה-`G`. לפני פרסום רחב (ובוודאי לפני שמבקשים מגוגל לאמת את האפליקציה) מחליפים אותו בנכס הרשמי:

1. נכנסים ל-https://developers.google.com/identity/branding-guidelines
2. בסעיף **Download Pre-Approved Brand Icons** מורידים את החבילה (`signin-assets.zip`) ומפרקים אותה.
3. בוחרים מתוכה את קובץ ה-`G` הצבעוני (PNG או SVG) בגודל שמתאים - הכפתור מציג אותו ב-18px, ולכן 48px ומעלה מספיק לצפיפות גבוהה.
4. מעלים אותו ל-`public/icons/` **בשם `google.png`** (או משנים את הנתיב ב-`components/auth/AuthForm.tsx`) ופורסים.

כללים מהמדריך של גוגל (לוודא מול הדף העדכני):
- לא משנים את הצבעים או היחסים של ה-`G`. גודל מותאם מתחילים מאחד הגדלים שבחבילה.
- ערכות הכפתור המותרות: **Light** (רקע `#FFFFFF`, מסגרת `#747775`, טקסט `#1F1F1F`), **Dark** (רקע `#131314`, מסגרת `#8E918F`, טקסט `#E3E3E3`) ו-**Neutral** (רקע `#F2F2F2`).
- נוסח מומלץ: "Sign in with Google" / "Sign up with Google" / "Continue with Google". הכפתור צריך להיות בולט לפחות כמו שיטות התחברות אחרות.
- הדרישות מחייבות לצורך אימות אפליקציה (OAuth verification). אם לא ביקשתם אימות, אין בדיקה, אבל כדאי להתאים מראש.
