import { Card } from "@/components/ui/Card";

// TODO: יוחלף בשליפה אמיתית מה-DB לפי משתמש
const MOCK_PROJECTS = [{ id: "1", name: "אתר תדמית קטן", blocksCount: 2 }];

export default function ProjectsPage() {
  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">פרויקטים קטנים</h1>
          <p className="text-ink-secondary mt-1">
            אוסף בלוקים שמצטרפים לפרויקט אחד - ייצוא כקובץ או דחיפה ישירה לגיטהאב.
          </p>
        </div>
        <button className="text-sm bg-accent text-base-bg font-semibold rounded-full px-5 py-2 hover:bg-accent-hover transition-colors">
          פרויקט חדש
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {MOCK_PROJECTS.map((p) => (
          <Card key={p.id}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="font-semibold">{p.name}</h3>
                <p className="text-xs text-ink-muted mt-1">
                  {p.blocksCount} בלוקים בפרויקט
                </p>
              </div>
              <div className="flex gap-2">
                <button className="text-xs border border-base-border rounded-full px-4 py-1.5 hover:border-accent transition-colors">
                  ייצוא ZIP
                </button>
                <button
                  disabled
                  title="חבר קודם GitHub בעמוד הפרופיל"
                  className="text-xs border border-base-border rounded-full px-4 py-1.5 text-ink-muted cursor-not-allowed"
                >
                  דחיפה ל-GitHub
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
