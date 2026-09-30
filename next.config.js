/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // כותרות אבטחה גלובליות. חשוב במיוחד כאן כי האתר מציג/מייצא קוד
  // שמשתמשים מדביקים - חייבים לצמצם ככל האפשר מה שדפדפן מרשה לבצע.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          // מונע הטמעת האתר שלנו בתוך iframe של אתר זר (clickjacking)
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // HTTPS בלבד לשנתיים (Vercel מגיש HTTPS תמיד; זה מונע downgrade בביקור הבא)
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          // חלון שנפתח מהאתר לא מקבל גישה ל-window שלנו (ההתחברות עם OAuth היא redirect, לא popup)
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          // חוסם גישה ל-API רגישים של הדפדפן שהאתר לא צריך
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            // TODO: להוסיף nonce דינמי לפני production ולהחליף 'unsafe-inline'.
            // connect-src מוגדר מפורש: הדומיין העצמי, Supabase, ושני שירותים שהדפדפן
            // פונה אליהם ישירות בכלי ההזרקה - Gemini (עם המפתח של המשתמש, שלא עובר
            // דרכנו) ו-GitHub API (ייבוא/דחיפה של פרויקטים; codeload - הורדת ריפו כ-ZIP). כל השאר נחסם, כדי שקוד
            // שמשתמש הדביק/העלה לתצוגה מקדימה לא יוכל "לזלוג" בקשות לשרתים זרים.
            value: [
              "default-src 'self'",
              // ב-next dev ה-webpack משתמש ב-eval ל-source maps; ב-production לא
              `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"}`,
              // הגופן של האתר עצמו מקומי (app/fonts) ולא צריך מקור חיצוני. Google Fonts
              // נשאר פתוח רק בשביל התצוגה המקדימה של בלוקים (iframe srcdoc יורש את ה-CSP),
              // כשהמשתמש בחר בבלוק גופן של Google במקום גופן המערכת (ברירת המחדל).
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://generativelanguage.googleapis.com https://api.github.com https://codeload.github.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "manifest-src 'self'",
              "worker-src 'self' blob:",
              // רק ב-Vercel (HTTPS); מקומית ב-http זה היה שובר את טעינת המשאבים
              ...(process.env.VERCEL ? ["upgrade-insecure-requests"] : []),
            ].join("; "),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
