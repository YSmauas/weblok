# ספקי AI בבלוק "העוזר החכם" (`chatbot-assistant`)

**תאריך אימות: 30.9.2026.** ספקים משנים מדיניות CORS ושמות מודלים - לבדוק שוב לפני שינוי.

## העיקרון

הבלוק רץ כולו בדפדפן של המבקר באתר של הלקוח. **המבקר** מדביק מפתח API משלו בתוך
הווידג'ט; המפתח:

- נשמר רק בדפדפן שלו: `localStorage` אם סימן "לזכור במכשיר", אחרת `sessionStorage`
  (ואם האחסון חסום - בזיכרון בלבד). מפתח האחסון: `wbai-key:<provider>`.
- נשלח ישירות לספק, **בכותרת בלבד** (אף פעם לא ב-URL), עם `credentials: "omit"`.
- לא מגיע לשרתים של WEblok, לא לבעל האתר ולא לקוד שמיוצא. אין `console.log` בקוד.
- נמחק בכפתור "שכחו את המפתח".

הווידג'ט מציג למבקר הסבר קצר על הסיכון: כל מי שיש לו גישה לדפדפן, תוסף, או XSS באתר
המארח יכול לקרוא את המפתח; מומלץ מפתח ייעודי עם הגבלת תקציב.

ההוראות והמידע על העסק (שדה "מה העוזר יודע") **כן** נמצאים בקוד המיוצא - זה לא סוד, והיוצר
מקבל על כך אזהרה ב-hint. השדה הישן `systemPrompt` (שהיה serverOnly) לא נקרא יותר, כדי
שהוראות ישנות שנכתבו כ"סודיות" לא ייחשפו.

## איך אומת CORS

בקשת preflight (`OPTIONS` עם `Origin` ו-`Access-Control-Request-Headers`) ובקשת `POST`
אמיתית עם מפתח מזויף מכל ספק. ספק נתמך רק אם **גם** ה-preflight **וגם** תשובת השגיאה
(401) מחזירים `access-control-allow-origin` - אחרת הדפדפן לא יכול לקרוא אפילו את קוד השגיאה.

| ספק | Preflight | ACAO על תשובת 401 | נתמך |
|---|---|---|---|
| Google Gemini | ✓ (מחזיר את ה-Origin) | ✓ | כן |
| Anthropic | ✓ `*` (דורש `anthropic-dangerous-direct-browser-access: true`) | ✓ `*` | כן |
| OpenRouter | ✓ `*` | ✓ `*` | כן |
| Groq | ✓ `*` | ✓ `*` | כן |
| Mistral | ✓ `*` | ✓ `*` | כן |
| OpenAI | ✓ | **✗** (אין ACAO על 401) | **לא** |

## הספקים

### Google Gemini
- נקודת קצה: `https://generativelanguage.googleapis.com/v1beta/models/<model>:generateContent`
- כותרת מפתח: `x-goog-api-key`. מפתח מתחיל בדרך כלל ב-`AIza`.
- השגת מפתח: https://aistudio.google.com/app/apikey (יש שכבה חינמית עם מכסה יומית).
- מודלים: הרשימה המרכזית `GEMINI_MODELS` מ-`lib/ai/models.ts` מוטמעת בקוד המיוצא כשרשרת
  גיבוי (כרגע `gemini-3.8-flash` → `gemini-flash-latest` → `gemini-3.5-flash` →
  `gemini-3.5-flash-lite` → `gemini-2.5-flash`). על 404 או "model not found" עוברים לבא בתור.
  היוצר יכול לכתוב מודל מדויק שינוסה ראשון.
- מפתח לא תקין מחזיר **400** עם `API_KEY_INVALID` (לא 401). מכסה יומית: 429 עם `PerDay` בגוף.
- חסימת בטיחות: `promptFeedback.blockReason` או `finishReason: SAFETY`.
- **היחיד שעובד בתצוגה החיה בעורך** (ה-CSP של האתר מתיר רק אותו ב-`connect-src`).

### Anthropic Claude
- נקודת קצה: `https://api.anthropic.com/v1/messages`
- כותרות: `x-api-key`, `anthropic-version: 2023-06-01`, ו-`anthropic-dangerous-direct-browser-access: true`
  (בלעדיה ה-API מסרב לבקשות CORS). מפתח מתחיל ב-`sk-ant-`.
- השגת מפתח: https://platform.claude.com/settings/keys (בתשלום, צריך קרדיט).
- ברירת מחדל: `claude-sonnet-5-5`. אפשרויות: `claude-opus-5-5`, `claude-haiku-4-5`
  (Haiku 4.5 - פרישה "לא לפני 15.10.2026", לכן לא ברירת מחדל). מקור:
  https://platform.claude.com/docs/en/about-claude/models/overview
- `temperature` **לא נשלח**: במודלים החדשים (Sonnet 5.5 ומעלה) ערך לא-ברירת-מחדל מחזיר 400.
- במודלי 4.6+/5 נשלח `output_config: { effort: "low" }` (חשיבה קצרה לצ'אט); Haiku לא מקבל effort.
- `stop_reason: "refusal"` → הודעת חסימה; `max_tokens` → "נקטע". קרדיט חסר: 400 עם "credit balance".

### OpenRouter
- נקודת קצה: `https://openrouter.ai/api/v1/chat/completions` (פורמט OpenAI).
- כותרת: `Authorization: Bearer <key>`; נשלח גם `X-Title` (שם העוזר, ASCII בלבד). מפתח מתחיל ב-`sk-or-`.
- השגת מפתח: https://openrouter.ai/settings/keys
- ברירת מחדל: `google/gemini-3.8-flash` (אומת ברשימת https://openrouter.ai/api/v1/models).
  אפשרויות נוספות: `openrouter/auto`, `openrouter/free`, `anthropic/claude-sonnet-5.5`.
- 402 = אין קרדיט.

### Groq
- נקודת קצה: `https://api.groq.com/openai/v1/chat/completions`. מפתח מתחיל ב-`gsk_`.
- השגת מפתח: https://console.groq.com/keys (שכבה חינמית עם הגבלות קצב).
- ברירת מחדל: `llama-3.3-70b-versatile`. אפשרויות: `llama-3.1-8b-instant`,
  `openai/gpt-oss-120b`, `openai/gpt-oss-20b`. מקור: https://console.groq.com/docs/models

### Mistral AI
- נקודת קצה: `https://api.mistral.ai/v1/chat/completions`. למפתח אין תחילית קבועה.
- השגת מפתח: https://console.mistral.ai/api-keys
- ברירת מחדל: `mistral-small-latest` (alias שמצביע על Mistral Small העדכני; דף המודלים הרשמי
  מציג בעיקר מזהים עם תאריך, למשל `mistral-small-2506` / `mistral-medium-2508`).
  מקור: https://docs.mistral.ai/getting-started/models

### OpenAI - לא נתמך
preflight עובר, אבל תשובות שגיאה (401) מ-`api.openai.com` לא כוללות
`access-control-allow-origin`, ויש דיווחים שגם תשובות רגילות נחסמות. OpenAI ממליצה במפורש
על שרת ביניים. אם זה ישתנה - אפשר להוסיף כספק "OpenAI-like" נוסף (אותו קוד כמו Groq).

## טיפול בשגיאות (בשפת הווידג'ט)

| מצב | זיהוי |
|---|---|
| מפתח לא תקין | 401/403, או `API_KEY_INVALID` / `authentication_error` / `invalid_api_key` |
| מכסה יומית | 429 + `PerDay`/`daily`/`free_tier` בגוף |
| הגבלת קצב | 429 אחר |
| אין קרדיט | 402, או "credit balance"/"insufficient credits" |
| מודל לא זמין | 404 (ב-Gemini - מעבר למודל הבא) |
| חסימת בטיחות | refusal / SAFETY / content_filter |
| עומס | 500/502/503/529 |
| רשת / CORS / CSP | `fetch` נכשל בלי סטטוס |
| זמן | אין תשובה תוך 90 שניות |
| נקטע | `MAX_TOKENS` / `max_tokens` / `length` - התשובה מוצגת עם הערה |

גוף שגיאת הספק לא מוצג ולא נרשם (OpenAI למשל מחזיר חלק מהמפתח בהודעה).

## מגבלות ידועות

- בלי streaming (בכוונה - פשוט ועמיד יותר); יש כפתור עצירה (AbortController).
- אורך התשובה נשלט בהוראה למודל + תקרת טוקנים עם מרווח לחשיבה (מודלים "חושבים" סופרים
  גם את טוקני החשיבה).
- מפתח בדפדפן חשוף לכל קוד שרץ באותו origin (כולל XSS באתר המארח). זה המחיר של "בלי שרת";
  לכן ההסבר למבקר וההמלצה למפתח מוגבל.
- בתצוגה החיה בעורך רק Gemini עובד; האתר לא מרחיב את ה-CSP שלו בכוונה.
