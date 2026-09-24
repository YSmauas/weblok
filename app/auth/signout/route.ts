import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** התנתקות. POST בלבד, כדי שלא ניתן יהיה לנתק משתמש דרך קישור/תמונה בדף זר. */
export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
