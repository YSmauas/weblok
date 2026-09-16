import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "../styles/globals.css";
import { ThemeProvider } from "@/lib/theme-provider";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "600", "800"],
  variable: "--font-heebo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "WEblok — בלוקים חכמים לאתר שלך",
  description:
    "ספריית בלוקים מוכנים להטמעה באתרים, עם עריכה חיה והורדת קוד עצמאי.",
};

const themeInitScript = `
try {
  var t = localStorage.getItem('weblok-theme');
  if (t === 'light') document.documentElement.classList.add('light');
} catch (e) {}
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
