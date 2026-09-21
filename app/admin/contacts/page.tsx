import { Card } from "@/components/ui/Card";
import { T } from "@/components/ui/T";
import { createClient } from "@/lib/supabase/server";

export default async function AdminContactsPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("contact_messages")
    .select("id, name, email, subject, message, status, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  const contacts = data ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold"><T k="admin.contactsTitle" /></h1>
      <p className="text-ink-secondary mt-1"><T k="admin.contactsSubtitle" /></p>

      <div className="mt-6 space-y-3">
        {contacts.length === 0 && (
          <Card>
            <p className="text-sm text-ink-muted"><T k="admin.contactsEmpty" /></p>
          </Card>
        )}
        {contacts.map((c) => (
          <Card key={c.id}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium">{c.subject || c.name}</p>
                <p className="text-xs text-ink-muted mt-1" dir="ltr">{c.name} · {c.email}</p>
                {/* React מבצע escape לטקסט - אין הזרקת HTML מתוכן שהמשתמש שלח */}
                <p className="text-sm text-ink-secondary mt-3 whitespace-pre-wrap break-words">{c.message}</p>
              </div>
              <span className="text-xs text-ink-muted shrink-0">
                {new Date(c.created_at).toLocaleDateString()}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
