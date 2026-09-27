import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import "../styles/globals.css";
import { ThemeProvider } from "@/lib/theme-provider";
import { LocaleProvider } from "@/lib/i18n/locale-provider";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import {
  CREDIT_URL,
  GITHUB_PROJECT,
  METADATA_BASE,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
} from "@/lib/site";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "600", "800"],
  variable: "--font-heebo",
  display: "swap",
});

const DEFAULT_TITLE = "WEblok — בלוקים חכמים לאתר שלך";

export const metadata: Metadata = {
  metadataBase: METADATA_BASE,
  title: { default: DEFAULT_TITLE, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  generator: SITE_NAME,
  keywords: SITE_KEYWORDS,
  authors: [{ name: "י.מ. מאואס", url: "https://github.com/YSmauas" }],
  creator: "י.מ. מאואס",
  publisher: SITE_NAME,
  category: "technology",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "he_IL",
    alternateLocale: ["en_US", "es_ES"],
    url: "/",
    title: DEFAULT_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  formatDetection: { telephone: false, email: false, address: false },
  other: { "source-code": GITHUB_PROJECT },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0d0a" },
    { media: "(prefers-color-scheme: light)", color: "#f5f6f1" },
  ],
};

/** נתונים מובנים (schema.org) - עוזרים למנועי חיפוש להבין מה האתר עושה */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: SITE_NAME,
      url: CREDIT_URL,
      description: SITE_DESCRIPTION,
      inLanguage: ["he", "en", "es"],
    },
    {
      "@type": "SoftwareApplication",
      name: SITE_NAME,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web",
      url: CREDIT_URL,
      description: SITE_DESCRIPTION,
      offers: { "@type": "Offer", price: "0", priceCurrency: "ILS" },
      author: { "@type": "Person", name: "י.מ. מאואס", url: "https://github.com/YSmauas" },
    },
  ],
};

const initScript = `
try {
  var t = localStorage.getItem('weblok-theme');
  if (t === 'light') document.documentElement.classList.add('light');
  var l = localStorage.getItem('weblok-locale');
  if (l && l !== 'he') {
    document.documentElement.lang = l;
    document.documentElement.dir = 'ltr';
  }
} catch (e) {}
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: initScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
      </head>
      <body className="font-sans antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-[100] focus:bg-accent focus:text-base-bg focus:px-4 focus:py-2 focus:rounded-full"
        >
          דלג לתוכן
        </a>
        <ThemeProvider>
          <LocaleProvider>{children}</LocaleProvider>
          <AnalyticsTracker />
        </ThemeProvider>
      </body>
    </html>
  );
}
