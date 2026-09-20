import { Card } from "@/components/ui/Card";

export default function DashboardContactPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">יצירת קשר</h1>
      <p className="text-ink-secondary mt-1">
        פנייה נשלחת ישירות לצוות המערכת, מקושרת אוטומטית לחשבון שלך.
      </p>

      <Card className="mt-6">
        <form className="space-y-4">
          <div>
            <label className="text-xs text-ink-muted mb-1 block">נושא</label>
            <input className="w-full bg-base-bg border border-base-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent" />
          </div>
          <div>
            <label className="text-xs text-ink-muted mb-1 block">הודעה</label>
            <textarea
              rows={4}
              className="w-full bg-base-bg border border-base-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent resize-y"
            />
          </div>
          <button
            type="submit"
            className="bg-accent text-base-bg font-semibold rounded-full px-6 py-2.5 hover:bg-accent-hover transition-colors"
          >
            שליחה
          </button>
        </form>
      </Card>
    </div>
  );
}
