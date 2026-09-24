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
          // חוסם גישה ל-API רגישים של הדפדפן שהאתר לא צריך
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            // TODO: להוסיף nonce דינמי לפני production ולהחליף 'unsafe-inline'.
            // connect-src מוגדר מפורש ל-Supabase בלבד + הדומיין העצמי,
            // כדי שקוד שמשתמש הדביק בעורך לא יוכל "לזלוג" בקשות לשרתים זרים.
            value: [
              "default-src 'self'",
              // ב-next dev ה-webpack משתמש ב-eval ל-source maps; ב-production לא
              `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"}`,
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
