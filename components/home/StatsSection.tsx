const STATS = [
  { label: "משתמשים רשומים", value: "—" },
  { label: "כניסות החודש", value: "—" },
  { label: "בלוקים בספרייה", value: "1" },
];

export function StatsSection() {
  return (
    <section className="border-y border-base-border bg-base-panel/40">
      <div className="max-w-4xl mx-auto px-6 py-16 grid grid-cols-3 gap-6 text-center">
        {STATS.map((s) => (
          <div key={s.label}>
            <p className="text-3xl md:text-4xl font-extrabold text-accent">
              {s.value}
            </p>
            <p className="mt-2 text-sm text-ink-secondary">{s.label}</p>
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-ink-muted pb-8">
        * המספרים יתעדכנו אוטומטית לאחר חיבור מסד הנתונים
      </p>
    </section>
  );
}
