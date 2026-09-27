import { SiteChrome } from "@/components/layout/SiteChrome";

/** קטלוג הבלוקים והעורך - עם ההדר, התפריט והפוטר של האתר (עד עכשיו הוצגו בלעדיהם). */
export default function BlocksLayout({ children }: { children: React.ReactNode }) {
  return <SiteChrome>{children}</SiteChrome>;
}
