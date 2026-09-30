import localFont from "next/font/local";

/**
 * Heebo כגופן מקומי (woff2 משתני, משקלים 300-800) - בלי פנייה ל-Google Fonts
 * בזמן build ובזמן ריצה. זה פותר את קריסת ה-build של next/font/google
 * (vercel/next.js#99114) ומוריד תלות חיצונית מה-CSP.
 *
 * שתי תת-קבוצות בלבד: עברית ולטינית (מספיק ל-he/en/es). כל אחת מוגדרת כמשפחה
 * נפרדת עם unicode-range, והדפדפן מוריד רק את מה שהעמוד צריך; ב-font-family
 * הלטינית קודמת, ואותיות עבריות "נופלות" לקובץ העברי.
 * מקור: fonts.gstatic.com/s/heebo/v28 (רישיון OFL - ראו OFL.txt).
 */
export const heeboLatin = localFont({
  src: "./heebo-latin.woff2",
  weight: "300 800",
  style: "normal",
  display: "swap",
  variable: "--font-heebo-latin",
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
    },
  ],
});

export const heeboHebrew = localFont({
  src: "./heebo-hebrew.woff2",
  weight: "300 800",
  style: "normal",
  display: "swap",
  variable: "--font-heebo-hebrew",
  declarations: [{ prop: "unicode-range", value: "U+0307-0308, U+0590-05FF, U+200C-2010, U+20AA, U+25CC, U+FB1D-FB4F" }],
});

export const fontVariables = `${heeboLatin.variable} ${heeboHebrew.variable}`;
