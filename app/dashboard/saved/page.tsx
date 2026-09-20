import { Card } from "@/components/ui/Card";

// TODO: יוחלף בשליפה אמיתית מה-DB לפי משתמש
const MOCK_SAVED = [
  { id: "1", blockName: "העוזר החכם", updatedAt: "לפני יומיים" },
  { id: "2", blockName: "העוזר החכם - גרסת מובייל", updatedAt: "לפני שבוע" },
];

export default function SavedDesignsPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">עיצובים שמורים</h1>
          <p className="text-ink-secondary mt-1">
            כל הבלוקים שערכת ושמרת לשימוש חוזר.
          </p>
        </div>
        <span className="text-xs text-ink-muted">0.4MB מתוך 10MB בשימוש</span>
      </div>

      <div className="mt-6 grid sm:grid-cols-2 gap-4">
        {MOCK_SAVED.map((item) => (
          <Card key={item.id}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{item.blockName}</h3>
                <p className="text-xs text-ink-muted mt-1">
                  עודכן {item.updatedAt}
                </p>
              </div>
              <div className="flex gap-2">
                <button className="text-xs text-accent hover:underline">
                  עריכה
                </button>
                <button className="text-xs text-danger hover:underline">
                  מחיקה
                </button>
              </div>
            </div>
          </Card>
        ))}

        {MOCK_SAVED.length === 0 && (
          <p className="text-sm text-ink-muted">עדיין אין עיצובים שמורים.</p>
        )}
      </div>
    </div>
  );
}
