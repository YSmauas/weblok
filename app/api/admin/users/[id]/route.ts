import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { roleAtLeast, canManageAdmins } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUSES = ["active", "warned", "suspended"];
const ROLES = ["user", "admin"]; // owner לא ניתן להענקה דרך ה-API

/**
 * שינוי סטטוס (admin+) או תפקיד (owner בלבד) של משתמש.
 * הבדיקה כאן היא שכבה ראשונה; שכבת האמת היא הפונקציות ב-DB (set_user_status /
 * set_user_role) שבודקות את ההרשאה בעצמן ולא סומכות על השרת שקורא להן.
 */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.status === "suspended" || !roleAtLeast(session.role, "admin")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (!UUID.test(params.id)) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const body = await request.json().catch(() => null);
  const supabase = createClient();

  if (typeof body?.status === "string") {
    if (!STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }
    const { error } = await supabase.rpc("set_user_status", {
      target_id: params.id,
      new_status: body.status,
    });
    if (error) return NextResponse.json({ error: "failed" }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (typeof body?.role === "string") {
    if (!canManageAdmins(session.role)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    if (!ROLES.includes(body.role)) {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }
    const { error } = await supabase.rpc("set_user_role", {
      target_id: params.id,
      new_role: body.role,
    });
    if (error) return NextResponse.json({ error: "failed" }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "invalid" }, { status: 400 });
}
