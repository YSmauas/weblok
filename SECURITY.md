# מדיניות אבטחה - WEblok

הפרויקט קוד פתוח (כל אחד יכול לקרוא את קוד המקור בגיטהאב) ומאפשר למשתמשים להדביק/לייצא/להריץ קוד — שני גורמים שמחייבים רמת זהירות גבוהה מהרגיל. מסמך זה הוא מדיניות מחייבת, לא המלצה.

## 1. מודל הרשאות (Defense in Depth)

ארבע דרגות: `guest → user → admin → owner` (מוגדר ב-`lib/auth/roles.ts`).

**עיקרון מרכזי: בדיקת הרשאה בצד לקוח (הסתרת כפתור, `if (isAdmin)` ב-React) היא נוחות UX בלבד ולעולם לא אבטחה.** כל פעולה רגישה חייבת שתי שכבות בדיקה בלתי-תלויות:

1. **Middleware** (`middleware.ts`) — חוסם גישה לנתיבים שלמים (`/admin/*`, `/dashboard/*`) לפני שהעמוד נטען.
2. **RLS ב-Supabase** — כל טבלה חייבת policy שבודק את ה-`role` מול `auth.uid()`. גם אם מישהו יעקוף את ה-middleware (למשל קריאה ישירה ל-API), ה-DB עצמו יסרב.

זכור/י: `is_admin`/`role` הם שדות שמשתמש **לעולם לא** כותב לעצמו ישירות — רק פונקציית DB מאובטחת (`SECURITY DEFINER`) שרק הבעלים יכול להפעיל, בדיוק כמו בדוגמת כושרמט. `canManageAdmins()` מוודא זאת ב-UI, אבל ה-policy ב-Supabase הוא מה שבאמת עוצר משתמש זדוני.

## 2. סודות (Secrets)

| סוג | איפה מותר | הערה |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | client | מיועד להיחשף, מוגבל לגמרי ע"י RLS |
| `SUPABASE_SECRET_KEY` | server בלבד | עוקף RLS לגמרי - חשיפה = פריצה מלאה. לעולם לא `NEXT_PUBLIC_*` |
| `SUPABASE_JWKS_URL` | server בלבד | לאימות טוקנים (JWT) מהיר ב-middleware בלי לפנות ל-Supabase בכל בקשה |
| מפתחות AI של משתמשים (Gemini) | מוצפנים ב-DB (`KEYS_ENCRYPTION_SECRET`) או בדפדפן בלבד, לבחירת המשתמש | ראו `ApiKeysManager` |
| `KEYS_ENCRYPTION_SECRET` | server בלבד | base64 של 32 בתים (`openssl rand -base64 32`). אסור להחליף אחרי שנשמרו מפתחות. משמש גם כסוד ל-hash של IP |
| טוקן GitHub אישי | דפדפן בלבד (מוצפן, רק אם סימנו "זכור") | Fine-grained, רק הריפו הנבחר: Contents R/W, Pull requests R/W, Metadata R |
| מפתח AI של מבקר בבלוק "העוזר החכם" | הדפדפן של המבקר בלבד (sessionStorage, או localStorage אם ביקש) | לעולם לא בקוד המיוצא ולא אצלנו. הסיכון מוסבר למבקר בווידג'ט |
| `*_OAUTH_CLIENT_SECRET` | server בלבד | חובה עבור GitHub/Google OAuth |

- `.env*` (חוץ מ-`.env.example`) חסום ב-`.gitignore` — לוודא שזה כך תמיד.
- אם מפתח סודי נחשף אפילו לרגע (כמו שקרה בפרויקט כושרמט לדוגמה) — **Rotate מיידי**, לא רק מחיקה מההיסטוריה.
- ב-GitHub: להפעיל **Secret scanning** ו-**Push protection** (חינמי לריפו ציבורי) כדי שגיטהאב יחסום commit שמכיל מפתח בטעות.

## 3. תוכן שמשתמשים מדביקים/מייצרים (הסיכון המרכזי של האתר הזה)

- **אסור בהחלט** `dangerouslySetInnerHTML` על תוכן שמקורו במשתמש או ב-AI, בשום מקום באתר עצמו (React בורח (escapes) מטקסט רגיל אוטומטית — זו ברירת המחדל שצריך לשמור עליה).
- כל תצוגה חיה ("preview") של קוד HTML/JS שמשתמש הדביק חייבת לרוץ בתוך `<iframe sandbox="allow-scripts">` **בלי** `allow-same-origin` — כך שגם אם הקוד זדוני, הוא לא יכול לקרוא cookies, localStorage או session של האתר שלנו.
- ה-CSP (`next.config.js`) מגביל `connect-src` לדומיין העצמי, Supabase, Gemini ו-GitHub API בלבד, כדי שקוד שהודבק לא "יזלוג" נתונים לשרת זר. הגופן של האתר מקומי; Google Fonts פתוח רק לתצוגה מקדימה של בלוק שבחר גופן Google. בנוסף: HSTS, COOP, `frame-ancestors 'none'`.
- **קוד מיוצא** (בלוקים, מבנים): כל ערך משתמש עובר `esc`/`jsStr`/`safeLink`/`safeAsset` (`_shared/util.ts`), ערכי select נבדקים מול הסכמה, `javascript:`/`data:` נחסמים. בווידג'טים, תוכן דינמי (למשל תשובת AI) נבנה עם `textContent` — לעולם לא `innerHTML`. במבנים, ערכי המשתמש נכתבים רק ל-JSON (`JSON.stringify`) ונבדקים שוב בזמן ריצה.
- **הזרקת AI**: המודל מחזיר רק עריכות find/replace, ו-`lib/inject/guard.ts` מאשר עריכה רק אם כל מה שהיא מוסיפה הוא קוד הבלוק שלנו (בדיוק), עטיפות פשוטות בלי מאפייני אירוע, והערות. כל `<script>`, `on*=`, `javascript:` או מחיקת תוכן = דחייה.
- **הזרקה בלי AI**: רק קוד הבלוקים שלנו נכנס, במיקום שנבחר; לעולם לא HTML גולמי של משתמש.
- כל טקסט חופשי שמוצג בחזרה למשתמשים אחרים (שם, ביו, הודעת צ'אט) עובר דרך React JSX רגיל — לא בונים HTML strings ידנית.

## 4. Rate Limiting

- **נתיבי ה-AI proxy** (`/api/chat` וכו') — חובה rate limit לפי `user.id`, לא רק לפי IP (כדי שלא ינצלו לרעה את מכסת ה-API של משתמש אחר/של המערכת).
- **נתיבי Auth** (login/signup) — הגנה מפני brute-force (Supabase Auth כולל את זה מובנה, לוודא שמופעל).
- מומלץ Upstash Redis (יש טיר חינמי) או Vercel's built-in rate limiting לצורך זה.

## 4א. נתיבי API

- כל נתיב קורא גוף עם `readJson` (`lib/http.ts`): מגבלת גודל (לפי כותרת ובפועל) ודחיית Origin זר (שכבה נוספת מעל SameSite=Lax).
- הגבלת קצב (`lib/rate-limit.ts`, טבלת `rate_limits`) בכל נתיב ציבורי; בבדיקת אימייל fail-closed.
- הפניות אחרי התחברות רק דרך `safeNext` (`lib/auth/redirect.ts`) — נתיב פנימי בלבד.
- `middleware.ts` לא נוגע בקובץ האימות של Search Console, ב-robots.txt וב-sitemap.xml.

## 5. תלויות (Dependencies)

- להפעיל **Dependabot** ו-**CodeQL** בהגדרות הריפו בגיטהאב (חינמי לריפו ציבורי) — מזהים אוטומטית חבילות עם חולשות ידועות.
- Next.js שודרג ל-15.5 (ספטמבר 2026) — גרסאות 14 פגיעות לעקיפת middleware (CVE-2025-29927) ול-RCE ב-Image Optimizer. הפרויקט המיוצא של "מבנים" נועל גם הוא Next 15.5. לבדוק `npm audit` אחרי כל עדכון.
- כשמוסיפים ספרייה חדשה (כולל הצעות מ-AI בזמן פיתוח!) — לבדוק שהיא באמת נחוצה, מתוחזקת, ולא חבילה חדשה/חשודה.

## 6. CSRF ו-Cookies

- Supabase Auth משתמש ב-cookies עם `SameSite=Lax` כברירת מחדל — לא לשנות ל-`None` בלי סיבה טובה.
- פעולות עם תופעות לוואי (מחיקה, שינוי הרשאות) חייבות להיות `POST`/`DELETE`, לעולם לא `GET`.

## 7. דיווח על פרצה

אם מוצאים חולשת אבטחה — **לא** לפתוח Issue ציבורי בגיטהאב (זה מודיע לתוקפים פוטנציאליים לפני שהיא מתוקנת). לדווח פרטית לבעלים ישירות, ולתת זמן סביר לתיקון לפני חשיפה פומבית.
