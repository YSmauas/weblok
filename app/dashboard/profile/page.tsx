import { Card } from "@/components/ui/Card";
import { ApiKeysManager } from "@/components/dashboard/ApiKeysManager";
import { AvatarPicker } from "@/components/dashboard/AvatarPicker";

// TODO: יוחלף בנתוני session אמיתיים מ-Auth.js
const mockUser = { name: "אורח", email: "guest@example.com", githubConnected: false };

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">פרופיל</h1>
        <p className="text-ink-secondary mt-1">
          פרטים אישיים, מפתחות API וחיבורים חיצוניים.
        </p>
      </div>

      <Card title="תמונת פרופיל" description="בוחרים אחד מהאווטארים המוכנים - בלי צורך בהעלאת קובץ.">
        <AvatarPicker />
      </Card>

      <Card title="פרטים אישיים">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-ink-muted mb-1 block">שם מלא</label>
            <input
              defaultValue={mockUser.name}
              className="w-full bg-base-bg border border-base-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="text-xs text-ink-muted mb-1 block">אימייל</label>
            <input
              defaultValue={mockUser.email}
              disabled
              dir="ltr"
              className="w-full bg-base-bg border border-base-border rounded-lg px-3 py-2 text-sm text-ink-muted"
            />
          </div>
        </div>
      </Card>

      <Card
        title="מפתחות API"
        description="דרושים כדי להשתמש בעריכה מבוססת AI על הבלוקים שלך. לא חובה עבור בלוקים שלא נעזרים ב-AI."
      >
        <ApiKeysManager />
      </Card>

      <Card
        title="חיבור לגיטהאב"
        description="מאפשר ייצוא ודחיפה ישירה של פרויקטים קטנים לריפו שלך."
      >
        {mockUser.githubConnected ? (
          <span className="text-sm text-success">מחובר ✓</span>
        ) : (
          <button className="text-sm bg-base-panel2 border border-base-border rounded-full px-5 py-2 hover:border-accent transition-colors">
            התחברות עם GitHub
          </button>
        )}
      </Card>
    </div>
  );
}
