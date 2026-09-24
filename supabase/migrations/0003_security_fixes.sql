-- ============================================================
-- 0003: תיקוני אבטחה שנמצאו בבדיקה (ספטמבר 2026)
-- להריץ פעם אחת: Supabase Dashboard → SQL Editor → New query → Run.
-- בטוח להריץ שוב. להריץ *אחרי* שהגרסה החדשה של האתר עלתה ל-production,
-- כי אחרי ההרצה /api/contact ו-/api/auth/check-email עובדים רק עם SUPABASE_SECRET_KEY.
-- ============================================================

-- 1) email_registered: עד עכשיו anon יכל לקרוא לה ישירות דרך REST ולעקוף את
--    הגבלת הקצב של /api/auth/check-email, וכך לגלות אילו אימיילים רשומים.
--    מעכשיו רק השרת (service_role) קורא לה.
revoke execute on function public.email_registered(text) from public, anon, authenticated;
grant execute on function public.email_registered(text) to service_role;

-- 2) contact_messages: אי אפשר יותר לכתוב ישירות (עקיפת הגבלת הקצב והוולידציה).
--    הכתיבה נעשית רק מ-/api/contact עם service key.
drop policy if exists "contact_messages: anyone can insert" on public.contact_messages;
revoke insert on public.contact_messages from anon, authenticated;

-- 3) משתמש מושעה: עד עכשיו החסימה הייתה רק במעבר בין דפים, ודרך ה-API או
--    Supabase ישירות הוא עדיין יכול היה לקרוא ולמחוק את הנתונים שלו.
create or replace function public.is_active()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select status <> 'suspended' from public.profiles where id = auth.uid()), false);
$$;
revoke execute on function public.is_active() from public, anon;
grant execute on function public.is_active() to authenticated;

drop policy if exists "saved_designs: owner full access" on public.saved_designs;
create policy "saved_designs: owner full access"
  on public.saved_designs for all
  using (auth.uid() = user_id and public.is_active())
  with check (auth.uid() = user_id and public.is_active());

drop policy if exists "projects: owner full access" on public.projects;
create policy "projects: owner full access"
  on public.projects for all
  using (auth.uid() = user_id and public.is_active())
  with check (auth.uid() = user_id and public.is_active());

drop policy if exists "api_keys: owner full access" on public.api_keys;
create policy "api_keys: owner full access"
  on public.api_keys for all
  using (auth.uid() = user_id and public.is_active())
  with check (auth.uid() = user_id and public.is_active());

-- בדיקה אחרי ההרצה (אמור להחזיר false בשתי העמודות):
-- select has_function_privilege('anon', 'public.email_registered(text)', 'execute') as anon_email,
--        has_table_privilege('anon', 'public.contact_messages', 'insert') as anon_contact;
