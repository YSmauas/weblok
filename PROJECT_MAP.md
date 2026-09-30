# WEblok — מפת פרויקט (למסירה לכל כלי AI)

מסמך הקשר מלא: מה האתר, איך הוא בנוי, איפה כל דבר, **למה** הוא בנוי כך, ומה כבר נשבר בעבר.
פותחים שיחה חדשה עם AI? הדביקו את הקובץ הזה ואמרו "בוא נמשיך מ-X".
עודכן לאחרונה: ספטמבר 2026.

---

## 1. מטרה וייעוד

**WEblok** היא ספריית "חלקים" לאתרים, קוד פתוח, בעברית (ובאנגלית/ספרדית):

- **בלוקים** — רכיב אחד לאתר קיים (טופס יצירת קשר, צ'אט AI, הדר, פוטר, וילון צד, פופאפ). מעצבים בעורך חי, ומורידים **קוד עצמאי לגמרי** (HTML מאוחד / HTML+CSS+JS / JSX) — בלי שרת שלנו, בלי script חיצוני ובלי מפתחות חשופים.
- **מבנים** — פרויקט **שלם** שמוכן לפריסה (Next.js + Supabase משלכם). הראשון: מערכת אישורי הגעה לאירועים (RSVP). מעצבים, מייצאים ZIP או דוחפים לגיטהאב, ופורסים ב-Vercel של הלקוח. **שום נתון לא עובר דרכנו.**
- **כלים** — הזרקת בלוקים לקובץ HTML קיים (עם AI או בבחירת מיקום ידנית), וניהול מאגר GitHub מהדפדפן.
- **אזור אישי** — עיצובים שמורים, מפתחות API, "פרויקטים קטנים" (קבצים + ייבוא/דחיפה לגיטהאב + הזרקה).

קהל יעד: בעלי אתרים ומפתחים מתחילים, בעיקר דוברי עברית.

## 2. פרטי הפרויקט

| | |
|---|---|
| ריפו | https://github.com/YSmauas/weblok (ציבורי) |
| אתר | https://weblok-alpha.vercel.app (דומיין חינמי של Vercel) |
| Supabase project ref | `cvmlbpdmpjdrjusaekas` |
| פריסה | Vercel, אוטומטית מ-`main`. Preview לכל ענף/PR (מסומן `noindex`) |
| Search Console | מאומת (URL prefix, קובץ `public/google60885fcb8d60a516.html`), sitemap נשלח |
| בעלים | י.מ. מאואס (GitHub: YSmauas) |

## 3. סטאק

- **Next.js 15.5** (App Router) + **React 19** + TypeScript 5.5
- Tailwind CSS 3.4 — כל הצבעים דרך משתני CSS (טוקנים), מצב כהה/בהיר, RTL/LTR
- Supabase: Postgres + RLS, Auth (Email/GitHub/Google), `@supabase/ssr`
- Gemini (Google) לכל תכונות ה-AI באתר; המשתמש מביא מפתח משלו
- jszip (ייצוא/ייבוא ZIP בדפדפן). אין תלויות נוספות בכוונה.
- גופן: Heebo **מקומי** (`app/fonts`, woff2, עברית+לטינית) דרך `next/font/local`

## 4. כללי עבודה עם הבעלים

- **שפת עבודה: עברית** — תשובות והערות קוד. **תשובות קצרות ותמציתיות** (חוסך טוקנים בכוונה).
- הבעלים עובד בעיקר **מאנדרואיד, בלי סביבת פיתוח מקומית**. בסביבת AI בלי הרצה: למסור קבצים מלאים עם נתיב מלא (או ZIP עם מבנה התיקיות), לא diff.
- כשיש לכלי סביבה אמיתית (Claude Code וכו'): **חובה** להריץ `npm run check:i18n`, `npm run typecheck`, `npm run lint`, `npm run build` ולתקן עד שהכל עובר. בעבר תקלות נתפסו רק ב-CI/Vercel.
- לבעלים יש גישת MCP ל-Supabase (migrations, advisors) ול-Vercel (read-only).
- **SECURITY.md מחייב.** האתר מציג ומייצא קוד שמשתמשים עורכים — XSS והזרקת קוד הם הסיכון המרכזי.
- לא לגעת ב-`public/google*.html` (שם/תוכן), לא להוסיף תגית `verification` ל-layout.

## 5. מודל הרשאות

`guest → user → admin → owner` (לינארי, `lib/auth/roles.ts`). נאכף בשתי שכבות בלתי-תלויות:
1. `middleware.ts` — חוסם נתיבים לפי `PROTECTED_PREFIXES` (`/dashboard` = user+, `/admin` = admin+), קורא role/status מ-`profiles` (לא מעוגייה), fail-closed.
2. RLS + פונקציות `SECURITY DEFINER` ב-DB שבודקות הרשאה **בתוך הפונקציה** (לקח מבאג עקיפת הרשאות — migration 0002).

בדיקה ב-UI (הסתרת כפתור) = נוחות בלבד. רק owner ממנה admins. משתמש `suspended` נחסם מהאזור האישי ומכל API.

## 6. מסד נתונים

טבלאות: `profiles`, `saved_designs` (+`ai_edited`), `projects` (+`github_repo/branch`), `project_files` (מכסה 5MB למשתמש בטריגר), `contact_messages`, `api_keys` (`encrypted_value` — AES-256-GCM, `lib/crypto.ts`), `analytics_events`, `rate_limits`, `login_events`.

פונקציות: `set_user_role`, `set_user_status`, `admin_list_users`, `admin_analytics`, `admin_analytics_v2`, `public_stats`, `public_stats_totals` (ציבורית — מספרים מצטברים בלבד), `email_registered` (service_role), `check_rate_limit` (service_role), `is_active`, `current_role`, `log_login_event` (טריגר על `auth.sessions`).

`supabase/schema.sql` = בסיס; `supabase/migrations/000N_*.sql` = שינויים כרונולוגיים (להריץ ידנית ב-SQL Editor, כולם בטוחים להרצה חוזרת). **מקור האמת הוא הפרויקט ב-Supabase עצמו** — חלק מהתיקונים הוזרמו ישירות.

## 7. מבנה הקבצים (כל קובץ ותפקידו)

### שורש
| קובץ | תפקיד |
|---|---|
| `middleware.ts` | אכיפת הרשאות + רענון session. ה-matcher **מחריג** `google*.html`, `robots.txt`, `sitemap.xml`, סטטיים |
| `next.config.js` | כותרות אבטחה + CSP (ר' סעיף 10) |
| `tailwind.config.ts` | מיפוי טוקנים (`base-*`, `ink-*`, `accent`, `success`, `danger`, `surface`) + אנימציות |
| `styles/globals.css` | הטוקנים (`:root` = כהה, `html.light` = בהיר), `.surface` (משטח צף אטום), `.overlay`, `.glass` (הדר בלבד), כפתורים/שדות |
| `.env.example` | כל משתני הסביבה עם הסבר |
| `.github/workflows/ci.yml` | check:i18n → typecheck → lint → build |
| `scripts/check-i18n.mjs` | בודק ששלוש השפות זהות, ושמפתחות בקוד קיימים; `--unused` מדפיס חשודים (מכיר תבניות דינמיות) |
| `scripts/i18n-merge.mjs` | ממזג קבצי `i18n-pending/*.json` (`{key:{he,en,es}}`) לשלוש השפות |
| `docs/assistant-providers.md` | ספקי ה-AI של בלוק "העוזר החכם": CORS, מודלים, מגבלות |
| `README.md` / `SECURITY.md` / `SETUP_GUIDE.md` | סקירה / מדיניות אבטחה / הקמה מאפס + Search Console |

### `app/`
| נתיב | תפקיד |
|---|---|
| `layout.tsx` | שורש: גופן מקומי, Theme/Locale/Session providers, JSON-LD, robots לפי `IS_PRODUCTION_DEPLOY`, קישור "דלג לתוכן" |
| `fonts/` | `index.ts` (next/font/local), שני קבצי woff2, `OFL.txt` |
| `page.tsx` | דף הבית: Hero, JourneyScroll, ToolsShowcase, מונה (`public_stats` + `public_stats_totals`), יצירת קשר |
| `blocks/page.tsx`, `blocks/[slug]/page.tsx` | קטלוג + עורך (שרת: טוען עיצוב שמור לפי `?design=`, מעביר ללקוח **רק slug**) |
| `blocks/popup/cookies/` | מדריך "אישור עוגיות" (page, CookieGuide, content בשלוש שפות, snippets — קוד שנבדק בדפדפן) |
| `structures/page.tsx`, `structures/[slug]/page.tsx` | קטלוג מבנים + עורך (סטטי, `generateStaticParams`) |
| `tools/` | `page.tsx` (רשימה), `inject/` (הזרקה), `github/` (ניהול מאגר) |
| `dashboard/` | layout (noindex), ברכה, profile (מפתחות API, GitHub), saved, projects, `projects/[id]`, contact |
| `admin/` | layout (noindex), סקירה+אנליטיקה (`DailyChart`), users, contacts |
| `auth/` | login/signup (`AuthForm`), `callback/route.ts` (OAuth), `signout/route.ts` (POST), suspended |
| `api/ai/improve`, `api/ai/redesign` | AI בשרת עם מפתח המשתמש המוצפן (rate limit לפי user.id) |
| `api/keys` | שמירה/מחיקה של מפתח (מוצפן; לעולם לא מוחזר ללקוח) |
| `api/analytics` | אנליטיקה אנונימית (sid אקראי, בלי IP/משתמש/עוגיות) |
| `api/contact`, `api/auth/check-email`, `api/admin/users/[id]` | טופס פנייה / בדיקת רישום (fail-closed) / ניהול משתמש |
| `sitemap.ts`, `robots.ts`, `opengraph-image.tsx`, `icon.svg`, `not-found.tsx` | SEO |

### `components/`
- `layout/`: `SiteChrome` (עטיפה), `Header` (לוגו `IconLogo`, ניווט), `Sidebar` (מגירה: בלוקים/מבנים/כלים), `Footer`, `AboutModal` (אודות/פרטיות/נגישות, מלכודת פוקוס), `PromoPopup` (קידום לבלוק הפופאפ, מגבלת תדירות)
- `home/`: `Hero`, `JourneyScroll` (דביק, `dvh`), `ToolsShowcase`, `StatsSection`, `ContactSection`
- `blocks/`: `BlockEditorClient` (העורך), `LivePreview` (iframe מבודד בגדלי מכשיר, דף לדוגמה, replay), `previewDoc.ts` (בונה את מסמך התצוגה)
- `editor/`: `DynamicForm` (קבוצות מתקפלות, `dependsOn`, `Popover` להסברים), `useTf.ts` (t עם גיבוי)
- `structures/`: `StructureEditorClient`, `StructureForm` (כולל תאריך/שעה/מספר/תמונה), `StructureGithubPush`, `SecretsHelper` (מייצר סיסמאות בדפדפן), `StructureGuide`
- `inject/`: `InjectWorkbench` (AI או מיקום ידני, לפני/אחרי, קוד), `GuestInject`, `BlockPicker`, `ApiKeyInput`
- `projects/`: `ProjectWorkspace`, `ProjectBlocks`, `ProjectFiles` (העלאה, ייבוא ודחיפה לגיטהאב עם PR), `ProjectInject`
- `tools/GithubManager.tsx`, `dashboard/*`, `admin/*` (`UsersTable`, `DailyChart`, `AdminNav`)
- `ui/`: `AppIcon` (אייקוני SVG לפי מפתח — בלוקים/כלים/ממשק), `Icons` (לוגו, גלובוס, שמש/ירח, GitHub...), `Popover` (בועה אטומה שמתהפכת/נצמדת לגבולות המסך), `HtmlPreview` (iframe sandbox), `BrowserFrame`, `Card`, `T` (טקסט מתורגם בתוך Server Component), `LanguageSwitcher`, `CountUp`, `Reveal`, `PuzzleBackground`
- `AnalyticsTracker.tsx` — צפייה + זמן שהייה; מכבד DNT/GPC

### `lib/`
- `ai/`: `models.ts` (**מקום יחיד** לשמות מודלים + `NEXT_PUBLIC_GEMINI_MODELS`), `gemini.ts` (קריאה + fallback בין מודלים + סיווג שגיאות), `client.ts` (דפדפן: מפתח בדפדפן או דרך השרת; `AiErrorCode` → `ai.err.<code>`), `server.ts` (אימות משתמש, rate limit, פענוח מפתח), `prompts.ts` (guardrails משותפים), `key-vault.ts` (הצפנת מפתחות/טוקנים בדפדפן — מפתח non-extractable ב-IndexedDB)
- `blocks-registry/`: `types.ts`, `index.ts` (רישום), `export.ts` + `export-types.ts` (3 פורמטים + קרדיט), `_shared/util.ts` (`esc`, `jsStr`, `safeLink`, `safeAsset`, שדות עיצוב, גופן מערכת כברירת מחדל, אנימציות), ותיקייה לכל בלוק (`meta`, `config.schema`, `generator`, `preview`): `chatbot-assistant` (+`strings.ts`), `contact-form` (+`themes.ts`), `site-header`, `site-footer`, `site-sidebar`, `popup`
- `structures/`: `types.ts`, `catalog.ts` (מטא בלבד — לתפריט), `index.ts`, `image.ts` (בדיקת magic bytes), `export.ts` (ZIP), `rsvp/` (`fields`, `config` — סניטציה, `generator`, `templates` — קבצי הפרויקט המיוצא, `strings`, `theme`, `readme`, `preview`, `meta`)
- `inject/`: `core.ts` (הזרקת AI: prompt → עריכות find/replace → אימות), `guard.ts` (**שומר סף**: עריכה מותרת להוסיף רק את קוד הבלוק שלנו + עטיפות פשוטות), `placement.ts` (הזרקה לפי מיקום, זיהוי הדר קבוע/כפתורים צפים, סולם z-index), `options.ts`
- `github/`: `client.ts` (בקשות + שגיאות, ייבוא), `manager.ts` (ריפוים, `pushEntries` — קומיט או ענף+PR), `sync.ts` (דחיפה חזרה של פרויקט: רק קבצים ששונו לפי git blob SHA, ענף מה-commit שיובא, זיהוי קונפליקטים), `files.ts`
- `projects/`: `db.ts`, `files.ts` (כללי קבצים, מכסה, path traversal), `types.ts`
- `auth/`: `roles.ts`, `session.ts` (שרת), `use-session.tsx` (לקוח), `redirect.ts` (`safeNext` — נגד open-redirect)
- `supabase/`: `client.ts`, `server.ts`, `middleware.ts`, `admin.ts` (service_role — שרת בלבד)
- `i18n/`: `locale-provider.tsx`, `locales/{he,en,es}.json`
- `crypto.ts`, `rate-limit.ts` (hash של IP עם סוד), `http.ts` (`readJson`: מגבלת גודל + same-origin), `site.ts` (שם/כתובת, `IS_PRODUCTION_DEPLOY`, `CONTENT_UPDATED`), `download.ts`, `download-zip.ts`, `theme-provider.tsx`

### אחר
- `public/google60885fcb8d60a516.html` — אימות Search Console. **לא לגעת.**
- `public/icons/google.png` (כפתור התחברות; שחזור — להחליף בנכס הרשמי לפני פרסום רחב), `public/icons/topmentors.png` (לא לגעת)
- `supabase/migrations/0006_public_visit_stats.sql` — מונה ביקורים ציבורי + אינדקס

## 8. למה המבנה נראה כך

- **הכל בדפדפן כשאפשר.** הזרקה, ייצוא, GitHub, מבנים ובלוק ה-AI רצים בצד הלקוח: קבצים ומפתחות של משתמשים לא עוברים בשרת שלנו → פחות אחריות, פחות עלות, פחות סיכון. השרת משמש רק ל-auth, DB ו-AI עם מפתח מוצפן.
- **קוד מיוצא עצמאי.** בלוק לא תלוי ב-WEblok בזמן ריצה (אין CDN שלנו) — האתר של הלקוח לא נופל אם אנחנו נופלים. לכן גם הגופן בבלוקים הוא גופן מערכת כברירת מחדל.
- **רישום (registry) מונחה-נתונים.** בלוק = תיקייה + רשומה ב-`index.ts`; העורך, הקטלוג, ה-sitemap וההזרקה קוראים מהרישום בלי שינוי קוד.
- **`generate`/`toOutput` נפרדים מה-UI.** הבלוק הוא לוגיקה טהורה שאפשר לבדוק בלי React; ה-`Preview` הוא רק הדמיה.
- **שתי שכבות הרשאה** — כי אחת כבר נעקפה פעם.
- **AI לא כותב קוד חופשי.** "עריכה עם AI" משנה רק ערכי select/color מותרים; ההזרקה מקבלת מהמודל רק עריכות קטנות שעוברות `guard.ts`.
- **מבנים בנפרד מבלוקים** — פרויקט שלם עם שרת/DB של הלקוח; שונה מהותית מקטע HTML.

## 9. מלכודות שכבר קרו (לא לחזור עליהן)

1. **אובייקט עם פונקציות משרת ללקוח.** אסור להעביר `BlockDefinition` (יש בו `Preview`/`generate`) כ-prop מ-Server Component ל-Client Component — קורס ב-runtime ("Application error"), לא שגיאת טיפוס. מעבירים **רק `slug`**, והלקוח קורא `getBlockDefinition(slug)` / `getStructureDefinition(slug)`.
2. **עוגיות ב-Route Handler עם redirect.** עוגיות שנכתבו דרך `cookies()` לא נדבקות ל-`NextResponse.redirect()` חדש. בונים את ה-response מראש וכותבים עליו (`app/auth/callback/route.ts`). גם ב-middleware — מעתיקים עוגיות ל-redirect.
3. **מפתחות i18n דינמיים.** `blocks.cat.${category}`, `ai.err.${code}`, `inject.err.*`, `inject.place.*`, `github.err.*`, `editor.group.*`, `structures.*` ועוד — כלי "מפתחות לא בשימוש" ימחק אותם בטעות. `scripts/check-i18n.mjs --unused` מכיר תבניות, אבל **תמיד לבדוק ידנית** לפני מחיקה.
4. **שם מודל Gemini.** גוגל הסירה/הגבילה מודלים (2.5 → 404 "no longer available" למפתחות חדשים). שמות רק ב-`lib/ai/models.ts`, עם fallback, ואפשר לעקוף ב-`NEXT_PUBLIC_GEMINI_MODELS`.
5. **`next/font/google` שבר build ב-Vercel** (שינוי בתגובת Google Fonts). לכן גופן מקומי.
6. **Next 14 פגיע** (עקיפת middleware CVE-2025-29927, RCE ב-Image Optimizer ועוד) — שודרג ל-15.5. ב-15: `params`/`searchParams`/`cookies()` הם Promise.
7. **`window.location.href` אחרי התחברות** (לא `router.replace`) — אחרת session לא נקלט (באג עוגיות).
8. **`100vh` באנדרואיד** קופץ עם סרגל הכתובת — להשתמש ב-`dvh`, ו-`env(safe-area-inset-*)` (`viewportFit: "cover"`).
9. **canonical בלייאאוט השורש** "הוריש" `/` לכל דף בלי canonical — הוסר; כל דף מגדיר משלו.
10. **משטחים שקופים** (`.glass`) בחלונות צפים = טקסט לא קריא במצב בהיר. חלונות צפים → `.surface`.

## 10. אבטחה — תקציר (הפירוט ב-SECURITY.md)

- CSP: `default-src 'self'`; `connect-src` רק Supabase, Gemini, GitHub API; `script-src 'self' 'unsafe-inline'` (אין nonce עדיין); Google Fonts פתוח רק לתצוגת בלוקים שבחרו גופן Google. + HSTS, COOP, X-Frame-Options DENY, `frame-ancestors 'none'`.
- תצוגה מקדימה: `iframe sandbox` **בלי** `allow-same-origin`.
- קוד מיוצא: כל ערך משתמש דרך `esc`/`jsStr`/`safeLink`; select נבדק מול הסכמה; ב-JS של הווידג'ט בונים DOM עם `textContent`.
- נתיבי API: `readJson` (גודל + same-origin), rate limit (`lib/rate-limit.ts`), ולידציה.
- מפתחות: בשרת מוצפנים (AES-256-GCM, `KEYS_ENCRYPTION_SECRET`), בדפדפן מוצפנים (key-vault). לעולם לא בלוגים/בקוד מיוצא/ב-URL.

## 11. באגים ומגבלות ידועים

- **לא נבדק מול שרתים אמיתיים בסבב האחרון:** Supabase advisors, זרימות התחברות אמיתיות, דחיפה לגיטהאב אמיתית, פריסת פרויקט RSVP ל-Vercel — צריך מעבר ידני ב-Preview.
- `script-src 'unsafe-inline'` (גם באתר וגם בפרויקט RSVP) — צריך nonce ב-middleware כדי להסיר.
- בסיס הייבוא של "פרויקטים קטנים" (commit SHA) נשמר ב-localStorage — בדפדפן אחר מקבלים אזהרה/PR מה-head הנוכחי.
- זיהוי מבנה הדף בהזרקה ידנית הוא heuristic (regex), לא parser.
- בלוק "העוזר החכם": בתצוגה המקדימה בעורך רק Gemini עובד (CSP); OpenAI לא נתמך (אין CORS בתשובות שגיאה). מפתח בדפדפן של המבקר חשוף ל-XSS באתר המארח (מוסבר למבקר).
- חלק מטקסטי הממשק בתוך הבלוקים המיוצאים עדיין בעברית קבועה.
- `next lint` מסומן deprecated ב-Next 15 (עדיין עובד) — מעבר ל-ESLint CLI בהמשך.
- Leaked Password Protection כבוי (Pro); אימות מייל בהרשמה כבוי (אין SMTP).
- `npm audit`: נשארה אזהרת postcss פנימית של Next (build-time בלבד).

## 12. הוספת דברים

- **בלוק:** תיקייה ב-`lib/blocks-registry/<slug>/` (meta/config.schema/generator/preview) → רישום ב-`index.ts` → אייקון ב-`AppIcon` → אם קטגוריה חדשה: טיפוס + `blocks.cat.<cat>` בשלוש השפות. sitemap מתעדכן לבד.
- **מבנה:** תיקייה ב-`lib/structures/<slug>/` → `catalog.ts` + `index.ts` → sitemap מתעדכן לבד.
- **טקסט:** קובץ ב-`i18n-pending/*.json` ואז `npm run i18n:merge` (או עריכה ישירה של שלושת הקבצים). `npm run check:i18n` חייב לעבור.
- **AI:** רק דרך `lib/ai/*`. שם מודל — רק ב-`lib/ai/models.ts`.
