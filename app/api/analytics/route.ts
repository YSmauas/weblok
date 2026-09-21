import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientKey, rateLimit } from "@/lib/rate-limit";

const SID = /^[A-Za-z0-9_-]{8,64}$/;

/** אנליטיקה אנונימית: מזהה סשן אקראי, נתיב, וזמן שהייה. בלי IP, בלי משתמש, בלי עוגיות. */
export async function POST(request: Request) {
  if (!(await rateLimit(`analytics:${clientKey(request)}`, 120, 60))) {
    return new NextResponse(null, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const kind = body?.kind;
  const sid = body?.sid;
  const path = body?.path;
  if (
    (kind !== "view" && kind !== "duration") ||
    typeof sid !== "string" || !SID.test(sid) ||
    typeof path !== "string" || !path.startsWith("/") || path.length > 300
  ) {
    return new NextResponse(null, { status: 400 });
  }

  const row: Record<string, unknown> = { session_id: sid, kind, path };
  if (kind === "duration") {
    const ms = Math.round(Number(body?.ms));
    if (!Number.isFinite(ms) || ms < 0) return new NextResponse(null, { status: 400 });
    row.duration_ms = Math.min(ms, 30 * 60 * 1000);
  }

  const { error } = await createAdminClient().from("analytics_events").insert(row);
  return new NextResponse(null, { status: error ? 500 : 204 });
}
