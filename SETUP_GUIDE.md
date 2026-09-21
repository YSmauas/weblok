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
