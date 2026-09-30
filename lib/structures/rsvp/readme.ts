import { CREDIT_URL, SITE_NAME } from "@/lib/site";
import type { EventConfig } from "./config";

/** טקסט חופשי שנכנס ל-Markdown: בלי תגיות HTML ובלי תווי markup שישברו כותרת */
const md = (s: string) => s.replace(/[<>]/g, "").replace(/[\\`*_[\]#|]/g, (c) => `\\${c}`).replace(/\s+/g, " ").trim();

/** README בעברית - מדריך פריסה קצר, שנכנס לשורש הפרויקט המיוצא */
export function readme(cfg: EventConfig): string {
  const title = md(cfg.title) || "אישורי הגעה";
  return `# ${title} - אישורי הגעה

אתר הזמנה + טופס אישור הגעה + דף ניהול מאובטח. נוצר ב-[${SITE_NAME}](${CREDIT_URL}).

**הכל רץ אצלכם:** האתר על ה-Vercel שלכם, הנתונים ב-Supabase שלכם. ל-${SITE_NAME} אין שום גישה
לאורחים, לתשובות או לסיסמאות.

## פריסה ב-5 צעדים (בערך 10 דקות)

### 1. מסד נתונים - Supabase
1. נכנסים ל-[supabase.com](https://supabase.com) ← **New project** (החבילה החינמית מספיקה).
2. בתפריט: **SQL Editor** ← **New query** ← מדביקים את כל התוכן של \`supabase/schema.sql\` ← **Run**.
3. **Project Settings ← API** (או **Data API** / **API Keys**) ומעתיקים שני ערכים:
   - **Project URL** ← זה \`SUPABASE_URL\`
   - **Secret key** (\`sb_secret_...\`) או בפרויקט ישן **service_role** ← זה \`SUPABASE_SECRET_KEY\`

   ⚠️ המפתח הסודי עוקף את כל ההרשאות. לא לשתף, לא לשים בקוד, לא לתת לו קידומת \`NEXT_PUBLIC_\`.

### 2. GitHub
אם הורדתם ZIP: יוצרים ריפו חדש (עדיף **Private**) ומעלים את כל הקבצים (Add file ← Upload files).
אם דחפתם ישירות מ-${SITE_NAME} - הצעד הזה כבר בוצע.

### 3. Vercel
1. [vercel.com/new](https://vercel.com/new) ← **Import** את הריפו. Vercel מזהה Next.js לבד.
2. לפני **Deploy**, פותחים **Environment Variables** ומוסיפים:

| שם | ערך |
|---|---|
| \`SUPABASE_URL\` | ה-Project URL משלב 1 |
| \`SUPABASE_SECRET_KEY\` | המפתח הסודי משלב 1 |
| \`ADMIN_PASSWORD\` | סיסמה לדף הניהול (לפחות 10 תווים, מומלץ 16+) |
| \`ADMIN_SESSION_SECRET\` | מחרוזת אקראית של 32+ תווים (למשל \`openssl rand -hex 32\`) |

3. **Deploy**. בסיום מקבלים כתובת כמו \`https://your-event.vercel.app\` - זה הקישור לשלוח לאורחים.

### 4. בדיקה
- פותחים את האתר, שולחים אישור לדוגמה.
- נכנסים ל-\`/admin\` (למשל \`https://your-event.vercel.app/admin\`) עם \`ADMIN_PASSWORD\` - התשובה מופיעה שם.
- אפשר למחוק את תשובת הבדיקה מדף הניהול.

### 5. שליחה לאורחים
שולחים את הקישור בוואטסאפ/SMS. אפשר לחבר דומיין משלכם ב-Vercel ← Settings ← Domains.

## עריכה אחרי הפריסה
- **טקסטים, תאריך, מיקום, עיצוב:** בקובץ \`config/event.json\` (עריכה ישירה בגיטהאב ← Commit ← Vercel מעדכן לבד תוך דקה).
- **תמונת רקע:** מחליפים את \`public/bg.jpg\` / \`bg.png\` / \`bg.webp\` (אותו שם) ומעדכנים \`background\` ב-\`config/event.json\`.
- **החלפת סיסמת ניהול:** משנים את \`ADMIN_PASSWORD\` ב-Vercel ← Redeploy. כל הכניסות הקיימות מתנתקות.

## אבטחה - מה כבר מובנה
- הנתונים ב-Supabase מוגנים ב-RLS **בלי שום הרשאה ציבורית** - רק השרת (עם המפתח הסודי) ניגש אליהם.
- המפתח הסודי והסיסמה נמצאים רק במשתני הסביבה של Vercel - לא בקוד ולא בדפדפן.
- כניסת מנהל: עוגייה חתומה (HMAC) מסוג \`httpOnly\` + \`Secure\` + \`SameSite=Strict\`, תוקף 8 שעות,
  השוואת סיסמה בזמן קבוע, ו-5 ניסיונות כניסה לכל 15 דקות.
- טופס האישור: בדיקת שדות ואורכים בצד השרת, תקרת גודל לבקשה, מלכודת בוטים, הגבלת קצב לפי IP
  (נשמר רק hash, לא הכתובת עצמה), ובדיקת מקור (CSRF).
- כותרות אבטחה ו-CSP הדוק (\`next.config.js\`): האתר לא טוען שום דבר משרתים חיצוניים.
- האתר מסומן \`noindex\` - לא יופיע בגוגל.
- ייצוא CSV מוגן מפני הזרקת נוסחאות לאקסל.

## פיתוח מקומי (לא חובה)
\`\`\`bash
cp .env.example .env.local   # וממלאים ערכים
npm install
npm run dev                  # http://localhost:3000
\`\`\`

## פרטיות
הטופס אוסף שם, טלפון (לפי ההגדרה), תשובה ומספר מגיעים - רק לצורך האירוע. אחרי האירוע מומלץ
לייצא CSV אם צריך, ולמחוק את הנתונים (או את כל פרויקט ה-Supabase).
`;
}
