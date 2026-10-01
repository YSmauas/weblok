import { SiteChrome } from "@/components/layout/SiteChrome";

/** קטלוג המבנים והעורך שלהם - עם ההדר, התפריט והפוטר של האתר (עד עכשיו הוצגו בלעדיהם). */
export default function StructuresLayout({ children }: { children: React.ReactNode }) {
  return <SiteChrome>{children}</SiteChrome>;
}
