import { UsersTable, type UserRow } from "@/components/admin/UsersTable";
import { T } from "@/components/ui/T";
import { getSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function AdminUsersPage() {
  const session = await getSession();
  const supabase = createClient();
  // הפונקציה בודקת ב-DB שהקורא הוא admin/owner - גם אם ה-middleware היה מדולג.
  const { data } = await supabase.rpc("admin_list_users");

  return (
    <div>
      <h1 className="text-2xl font-bold"><T k="admin.usersTitle" /></h1>
      <p className="text-ink-secondary mt-1"><T k="admin.usersSubtitle" /></p>
      <div className="mt-6">
        <UsersTable
          rows={(data ?? []) as UserRow[]}
          currentUserId={session?.id ?? ""}
          currentUserRole={session?.role ?? "guest"}
        />
      </div>
    </div>
  );
}
