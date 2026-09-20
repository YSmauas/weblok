import Link from "next/link";
import { Card } from "@/components/ui/Card";

const QUICK_LINKS = [
  { href: "/dashboard/profile", title: "פרופיל ומפתחות API", desc: "עדכון פרטים אישיים וניהול מפתחות" },
  { href: "/dashboard/saved", title: "עיצובים שמורים", desc: "כל הבלוקים שערכת ושמרת" },
  { href: "/dashboard/projects", title: "פרויקטים קטנים", desc: "ייצוא ל-ZIP או דחיפה לגיטהאב" },
  { href: "/dashboard/contact", title: "יצירת קשר", desc: "פנייה ישירה לצוות המערכת" },
];

export default function DashboardOverviewPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">אזור אישי</h1>
      <p className="text-ink-secondary mt-1">
        ברוכים השבים. כאן מרוכז כל מה שקשור לחשבון שלך.
      </p>

      <div className="mt-8 grid sm:grid-cols-2 gap-4">
        {QUICK_LINKS.map((l) => (
          <Link key={l.href} href={l.href}>
            <Card className="hover:border-accent/60 transition-colors h-full">
              <h3 className="font-semibold">{l.title}</h3>
              <p className="text-sm text-ink-secondary mt-1">{l.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
