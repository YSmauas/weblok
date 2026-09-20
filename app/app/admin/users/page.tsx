import { UsersTable } from "@/components/admin/UsersTable";

export default function AdminUsersPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">משתמשים</h1>
      <p className="text-ink-secondary mt-1">
        ניהול חשבונות, הזהרות והשעיות למשתמשים שחורגים מהכללים.
      </p>
      <div className="mt-6">
        <UsersTable />
      </div>
    </div>
  );
}
