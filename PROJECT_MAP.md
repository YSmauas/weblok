# WEblok — מפת פרויקט (למסירה ל-AI)

מסמך הקשר לפרויקט WEblok. המטרה: לתת ל-AI (Claude, ChatGPT, וכו') תמונת מצב
מלאה בלי לסרוק את כל הריפו - מה הפרויקט, איך הוא בנוי, ואיפה כל דבר נמצא.
מתאים לפתיחת שיחה חדשה: "הנה מפת הפרויקט שלי, בוא נמשיך מ-X".

## מה זה WEblok

ספריית בלוקים חכמים להטמעה באתרים - משתמש בוחר בלוק (כרגע: "עוזר חכם"
מבוסס-AI), מעצב אותו בעורך חי, ומקבל קוד הטמעה קצר ובטוח (תג `<script>` עם
`data-attributes`, בלי לחשוף מפתחות API) שהוא מדביק באתר שלו. הבלוק עצמו
(העורך + קטלוג הבלוקים) **עדיין לא נבנה בפועל** - זה החלק הבא.

## סטאק טכנולוגי

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS, עם משתני CSS למצב כהה/בהיר ותמיכת RTL/LTR מלאה
- Supabase: Postgres + RLS, Auth (Email + GitHub + Google OAuth), Storage (לא בשימוש עדיין)
- Vercel: אחסון, דיפלוי אוטומטי מ-`main`, Vercel Functions (Route Handlers) לצד שרת
- `@supabase/ssr` לניהול session בין דפדפן/שרת/middleware

## איך לעבוד עם הפרויקט הזה

- **שפת עבודה: עברית.** גם הערות קוד, גם תשובות.
- **תשובות תמציתיות** - המשתמש חוסך טוקנים בכוונה, לא לפרט יותר מהצורך.
- המשתמש עובד **מאנדרואיד בלבד**, בלי סביבת פיתוח מקומית. כל שינוי חייב
  להימסר כקובץ מוכן (או ZIP) עם נתיב מלא - הוא מעלה ידנית ל-GitHub דרך
  הדפדפן (Upload files) או מבקש מחבר לדחוף בשבילו. **אי אפשר להריץ
  `npm install`/`build`/`typecheck`** בסביבת ה-AI - כל שינוי קוד נבדק
  סטטית בלבד (resolve של imports, פרסינג TSX, תרגומים), לא runtime.
- למשתמש **אין** גישת רשת/git ישירה - אין דרך לדחוף קומיטים ישירות מה-AI,
  רק להכין קבצים.
- למשתמש יש גישת MCP ל-Supabase (יש להשתמש בה ישירות ל-migrations,
  בדיקות RLS, advisors וכו') ול-Vercel (read-only: פרויקטים, דיפלוי, לוגים).
- כשמבקשים "קבצים ששונו" - לתת נתיבים מלאים ותוכן מלא לכל קובץ, לא diff.
  כשיש הרבה קבצים - עדיף ZIP שלם (כולל תיקיות ריקות, לשמור על המבנה) על
  פני עשרות קבצים בודדים - למשתמש קשה לשים קבצים בודדים בנתיבים נכונים
  באנדרואיד.
- הפרויקט המקורי (`README.md`, `SECURITY.md`) נכתב עם הרבה TODO-ים -
  רובם הושלמו לאורך העבודה; `README.md` הוא המקור לאמת על מה שעוד חסר.
- **SECURITY.md חובה לקרוא** - האתר נועד להציג/לייצא קוד שמשתמשים
  עורכים, ולכן זהירות יתרה מפני XSS והזרקת קוד היא עיקרון מנחה בכל תוסף.

## מודל הרשאות

`guest → user → admin → owner`, לינארי, נאכף בשתי שכבות בלתי-תלויות:
`middleware.ts` (parseב-`lib/auth/roles.ts`, חוסם נתיבים לפי prefix) ו-RLS
ב-Supabase (חוסם ברמת שורה). כל בדיקת הרשאה כתובה גם ב-DB (בתוך הפונקציה
עצמה, לא רק בקוד השרת) - כלל שנלמד בכאב אחרי שנמצא באג עקיפת הרשאות
(ר' migration `stage2_hardening...`).

## מסד נתונים (Supabase project ref: `cvmlbpdmpjdrjusaekas`)

טבלאות: `profiles` (role/status/avatar, מקושר ל-`auth.users`),
`saved_designs`, `projects`, `contact_messages`, `api_keys`
(`encrypted_value` מוצפן AES-256-GCM, `lib/crypto.ts`), `analytics_events`,
`rate_limits`.

פונקציות מרכזיות (כולן `SECURITY DEFINER` עם בדיקת הרשאה פנימית):
`set_user_role`, `set_user_status`, `admin_list_users`, `admin_analytics`,
`public_stats` (ציבורי - לדף הבית), `email_registered` (בדיקה לפני
התחברות), `check_rate_limit` (service_role בלבד), `is_active`,
`current_role`.

`supabase/schema.sql` = הבסיס המקורי. `supabase/migrations/*.sql` = כל
שינוי מאז, כרונולוגי - **המקור לאמת על מצב ה-DB בפועל הוא הפרויקט
ב-Supabase עצמו** (יש לבדוק שם, לא רק בקבצים, כי חלק מהתיקונים הוזרמו
ישירות ולא תמיד תועדו בקובץ מקומי).

## עמודי תווך שכדאי להכיר לפני שנוגעים בקוד

- **מנוע הבלוקים בפועל, קיים ועובד:** `/blocks` (קטלוג) → `/blocks/[slug]`
  (עורך) → `components/blocks/BlockEditorClient.tsx` (client, מקבל רק
  `slug` - **לא** את אובייקט הבלוק, ראו "מלכודת" למטה) →
  `components/editor/DynamicForm.tsx` (פאנל הגדרות גנרי, תומך ב-
  `dependsOn` להסתרת שדות לא רלוונטיים ו-`aiAssist`/`aiDesignEditable`) →
  `lib/blocks-registry/export.ts` (`exportBlock`, 3 פורמטים) →
  `lib/download-zip.ts`. שני בלוקים קיימים: `chatbot-assistant`,
  `contact-form` (התבנית המלאה ביותר להעתיק ממנה בלוק חדש).
- **מלכודת אמיתית שכבר קרתה:** אסור להעביר את אובייקט `BlockDefinition`
  עצמו (מכיל פונקציות כמו `Preview`/`generate`/`toOutput`) בתור prop
  משרת (Server Component) ללקוח (Client Component) - React אוסר את זה
  ב-runtime (לא type error, קורס בפועל עם "Application error"). כל
  עמוד/קומפוננטת שרת שצריך להעביר בלוק ללקוח מעביר רק `slug` (מחרוזת),
  והלקוח קורא בעצמו ל-`getBlockDefinition(slug)`.
- `lib/auth/session.ts` (`getSession()`, שרת) ו-`lib/auth/use-session.ts`
  (`useSession()`, קליינט) - שני מקורות שונים לאותו מידע, בכוונה.
- `lib/supabase/{client,server,middleware}.ts` - שלושה קליינטים נפרדים.
  **מלכודת ידועה**: ב-Route Handler שמחזיר `NextResponse.redirect()` חדש,
  עוגיות שנכתבו דרך `cookies()` (next/headers) לא נדבקות אוטומטית - צריך
  לבנות את ה-response מראש ולכתוב עליו ישירות (ר' `app/auth/callback/route.ts`
  לדוגמה נכונה - זה היה באג אמיתי שתוקן).
- `lib/i18n/locale-provider.tsx` + `lib/i18n/locales/{he,en,es}.json` -
  **שלוש השפות חייבות תמיד אותו סט מפתחות בדיוק**. השפה נשמרת ב-localStorage
  בלבד (לא נגיש מהשרת) - רכיבי שרת לא יכולים להציג טקסט מתורגם ישירות; יש
  `components/ui/T.tsx` לגישור.
- `styles/globals.css` - טוקנים (`--bg`, `--panel`, `--accent` וכו') תחת
  `:root` (כהה) ו-`html.light` (בהיר). כל צבע בקוד חייב לעבור דרך הטוקנים
  האלה (או מחלקות Tailwind שממופות אליהם ב-`tailwind.config.ts`), אחרת
  זה נשבר במצב אחד מהשניים.
- `lib/rate-limit.ts` - הגבלת קצב גנרית (`rate_limits` table), משמש כל
  נתיב API ציבורי. `lib/supabase/admin.ts` - קליינט service_role, שרת בלבד.

## מבנה הפרויקט (כל קובץ, נתיב מלא + תיאור שורה אחת)

### שורש
- `.env.example` - כל משתני הסביבה הנדרשים (Supabase, `KEYS_ENCRYPTION_SECRET`)
- `.github/workflows/ci.yml` - typecheck/lint/build לפני מיזוג ל-main
- `README.md` - מקור האמת למה שהושלם/חסר בפרויקט
- `SECURITY.md` - מדיניות אבטחה, חובה לפני נגיעה ב-DB או בבלוקים
- `SETUP_GUIDE.md` - הקמת פרויקט Supabase חדש מאפס
- `middleware.ts` - אכיפת הרשאות בצד שרת לפי `PROTECTED_PREFIXES`
- `tailwind.config.ts`, `next.config.js` (כולל CSP), `tsconfig.json`, `vercel.json`

### `app/` (Next.js App Router)
- `layout.tsx` - שורש: `LocaleProvider`, `AnalyticsTracker`, פונטים
- `page.tsx` - דף הבית: `Hero` + `JourneyScroll` + `StatsSection` (מספרים אמיתיים מה-DB) + `ContactSection`
- `admin/layout.tsx`, `admin/page.tsx` (סקירה+אנליטיקה), `admin/users/page.tsx`, `admin/contacts/page.tsx` (עם כפתור תגובה במייל)
- `dashboard/layout.tsx` - נאב + באנר "מוזהר" אם רלוונטי
- `dashboard/page.tsx` (ברכה אישית), `profile/page.tsx`, `saved/page.tsx`, `projects/page.tsx`, `contact/page.tsx`
- `auth/login/page.tsx`, `auth/signup/page.tsx` - שניהם דרך `components/auth/AuthForm.tsx`
- `auth/callback/route.ts` - חזרה מ-OAuth/אימות מייל
- `auth/signout/route.ts` - POST בלבד
- `auth/suspended/page.tsx` - הודעה למשתמש מושעה שמנסה להיכנס לאזור אישי
- `api/contact/route.ts` - טופס יצירת קשר → `contact_messages`
- `api/keys/route.ts` - שמירה/מחיקה של מפתחות API (מוצפן)
- `api/analytics/route.ts` - אנליטיקה אנונימית (session id אקראי, בלי IP/משתמש)
- `api/admin/users/[id]/route.ts` - שינוי role/status של משתמש
- `api/auth/check-email/route.ts` - בודק אם אימייל רשום (להפניה חכמה בין login/signup)

### `components/`
- `layout/`: `SiteChrome` (עטיפה גלובלית), `Header`, `Sidebar` (מגירת ניווט,
  רגיש ל-role/login), `Footer`, `AboutModal` (טאבים: אודות/פרטיות/נגישות - תוכן אמיתי, לא placeholder)
- `home/`: `Hero`, `JourneyScroll` (אפקט גלילה דביק - שים לב: `dvh` לא `vh`, בגלל התנהגות סרגל הכתובת באנדרואיד), `StatsSection`, `ContactSection`
- `auth/AuthForm.tsx` - טופס משותף login+signup; אחרי הצלחה `window.location.href` (ניווט מלא, לא `router.replace` - תוקן בגלל באג עוגיות)
- `contact/ContactForm.tsx` - משותף לדף הבית ולאזור האישי
- `dashboard/`: `DashboardNav`, `Greeting` (שלום, {שם} - קליינט, בגלל i18n), `ProfileNameForm`, `ApiKeysManager` (מבחין בין שגיאת קונפיג לשגיאה רגילה), `GithubConnect` (`linkIdentity`), `RowActions` (מחיקה/יצירה גנרית ל-saved_designs/projects)
- `admin/`: `AdminNav`, `UsersTable` (פעולות הזהרה/השעיה/מינוי מנהל)
- `ui/`: `Card`, `Icons` (כולל `IconPuzzle` - עיצוב "זכוכית", תג הפאזל האחרון: מעלה זכר, ימין נקבה, מטה+שמאל חלק), `T` (טקסט מתורגם בתוך Server Components), `PuzzleBackground` (אנימציית ריחוף - `animate-float`/`floatSlow`), `BrowserFrame`, `ChatWidgetPreview`, `LanguageSwitcher`
- `editor/DynamicForm.tsx` - טופס גנרי לעריכת בלוק (חלק ממנגנון הבלוקים המתוכנן; לא מחובר ל-UI פעיל כרגע)
- `AnalyticsTracker.tsx` - שולח view/duration ל-`/api/analytics`, מכבד Do Not Track

### `lib/`
- `auth/roles.ts` (מודל הרשאות), `session.ts` (שרת), `use-session.ts` (קליינט), `redirect.ts` (מניעת open-redirect)
- `supabase/client.ts`, `server.ts`, `middleware.ts`, `admin.ts` (service_role, שרת בלבד)
- `blocks-registry/` - **הליבה של פיצ'ר הבלוקים**: `types.ts` (`FieldDef`, `BlockDefinition`), `index.ts` (הרישום), `chatbot-assistant/` (הבלוק הקיים היחיד כרגע: `meta.ts`, `config.schema.ts`, `generator.ts`, `preview.tsx`) - זה התבנית לכל בלוק חדש
- `i18n/locale-provider.tsx`, `locales/{he,en,es}.json`
- `crypto.ts` (AES-256-GCM ל-API keys), `rate-limit.ts`, `theme-provider.tsx`

### `supabase/`
- `schema.sql` - הבסיס
- `migrations/*.sql` - כרונולוגי; **תמיד לבדוק את מצב ה-DB האמיתי ב-Supabase**, לא רק את הקבצים

## מה עוד חסר (מה-README + מעבר לו)

- 4 בלוקים חדשים: **כותרת אתר, פוטר, וילון צד, ופופאפ (בלוק גנרי אחד** שמכסה קידום/עוגיות/exit-intent/הודעה - לא 4 בלוקים נפרדים) - עדיין לא נבנו, זה הצעד הבא
- קטלוג בלוקים נוספים מעבר ל-2 הקיימים (`chatbot-assistant`, `contact-form`)
- Leaked Password Protection ב-Supabase Auth - כבוי (Pro feature)
- אימות מייל בהרשמה - כרגע כבוי בכוונה (אין SMTP מהיר מוגדר - צריך דומיין משלו לחבר Resend/דומה)

## תוספות משמעותיות אחרי שהמפה הזו נכתבה במקור (חבר של המשתמש, עם Claude Code)

- **`lib/ai/*`** (`gemini.ts`, `client.ts`, `server.ts`, `key-vault.ts`, `prompts.ts`) - קליינט Gemini משותף לשרת+דפדפן, עם קודי שגיאה מסודרים (`GeminiError`), מצב JSON, ותמיכה במפתח ששמור רק בדפדפן (מוצפן ב-`localStorage`, לעולם לא מגיע לשרת). **זה מחליף** קריאות `fetch` ישירות ל-Gemini שהיו קודם ב-`app/api/ai/improve`/`redesign` - כל תוסף AI חדש צריך לעבור דרך זה, לא לקרוא ל-Gemini ישירות.
- **`lib/github/*`** + **`app/tools/github`** - חיבור וניהול GitHub (המנוע הכללי - "דחיפה לגיטהאב" מהתכנון המקורי).
- **`lib/inject/*`** + **`app/tools/inject`** + `components/inject/*` - מנגנון "הזרקת" בלוקים/עיצוב לפרויקט קיים.
- **`lib/projects/*`** (`db.ts`, `files.ts`, `types.ts`) + `app/dashboard/projects/[id]/page.tsx` + `components/projects/*` - "פרויקטים קטנים" עם קבצים אמיתיים (טבלת `project_files` חדשה ב-DB, כולל הגנה מפני path traversal בנתיב הקובץ).
- SEO: `app/sitemap.ts`, `app/robots.ts`, `app/opengraph-image.tsx`, `app/icon.svg`.
- `login_events` (DB) - ספירת כניסות אמיתית (טריגר על `auth.sessions`, סופר את כל שיטות ההתחברות), מוצג ב-`admin_analytics_v2`.
- `components/blocks/BlockEditor.tsx` הישן (לא בשימוש, משוכפל עם `BlockEditorClient.tsx`) **נמחק** - אם נתקלים בו בטעות זה שריד.

