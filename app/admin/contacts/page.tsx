import { Card } from "@/components/ui/Card";

// TODO: יוחלף בשליפה אמיתית מה-DB (מהטופס הציבורי ומהאזור האישי)
const MOCK_CONTACTS: { id: string; from: string; subject: string; date: string }[] = [];

export default function AdminContactsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">פניות מערכת</h1>
      <p className="text-ink-secondary mt-1">
        פניות מהטופס הציבורי ומהאזור האישי, מרוכזות במקום אחד.
      </p>

      <div className="mt-6 space-y-3">
        {MOCK_CONTACTS.length === 0 && (
          <Card>
            <p className="text-sm text-ink-muted">אין פניות חדשות כרגע.</p>
          </Card>
        )}
        {MOCK_CONTACTS.map((c) => (
          <Card key={c.id}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{c.subject}</p>
                <p className="text-xs text-ink-muted mt-1" dir="ltr">
                  {c.from}
                </p>
              </div>
              <span className="text-xs text-ink-muted">{c.date}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
