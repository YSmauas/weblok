import { Card } from "@/components/ui/Card";

// TODO: יוחלפו בנתוני DB אמיתיים
const STATS = [
  { label: "משתמשים רשומים", value: "—" },
  { label: "כניסות היום", value: "—" },
  { label: "זמן גלישה ממוצע", value: "—" },
  { label: "פניות פתוחות", value: "—" },
];

const POPULAR_BLOCKS = [{ name: "העוזר החכם", pct: 100 }];

export default function AdminOverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">סקירה ואנליטיקה</h1>
        <p className="text-ink-secondary mt-1">
          נתונים כלליים על השימוש במערכת. יתחברו למקור אמת לאחר חיבור ה-DB.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <Card key={s.label}>
            <p className="text-2xl font-extrabold text-accent">{s.value}</p>
            <p className="text-xs text-ink-secondary mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      <Card title="בלוקים פופולריים" description="לפי מספר עריכות/ייצוא קוד">
        <div className="space-y-3">
          {POPULAR_BLOCKS.map((b) => (
            <div key={b.name}>
              <div className="flex justify-between text-sm mb-1">
                <span>{b.name}</span>
                <span className="text-ink-muted">{b.pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-base-bg overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full"
                  style={{ width: `${b.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
