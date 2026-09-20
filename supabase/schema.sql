-- ============================================================
-- WEblok - סכמת מסד נתונים עבור Supabase
-- מריצים פעם אחת ב-Supabase Dashboard → SQL Editor → New query → Run
-- בטוח להריץ שוב (if not exists / or replace בכל מקום)
-- ============================================================

-- ---------- תפקידים וסטטוס ----------
do $$ begin
  create type app_role as enum ('user', 'admin', 'owner');
exception when duplicate_object then null; end $$;

do $$ begin
  create type account_status as enum ('active', 'warned', 'suspended');
exception when duplicate_object then null; end $$;

-- ---------- profiles: שורה אחת לכל משתמש, נוצרת אוטומטית בהרשמה ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  role app_role not null default 'user',
  status account_status not null default 'active',
  github_login text,
  created_at timestamptz not null default now()
);

-- יוצר שורת profile אוטומטית כשמשתמש חדש נרשם (Auth trigger)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.email));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- פונקציית עזר: מחזירה את ה-role של המשתמש המחובר, בלי לגרום ל-RLS-recursion
create or replace function public.current_role()
returns app_role
language sql stable security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- הגנה על עמודות רגישות: אף אחד לא יכול לעדכן role/status על עצמו ישירות,
-- רק דרך הפונקציות המאובטחות למטה. שם/github_login כן מותר לעדכן עצמאית.
revoke update on public.profiles from authenticated;
grant update (name) on public.profiles to authenticated;

alter table public.profiles enable row level security;

drop policy if exists "profiles: view own or admin/owner" on public.profiles;
create policy "profiles: view own or admin/owner"
  on public.profiles for select
  using (auth.uid() = id or public.current_role() in ('admin', 'owner'));

drop policy if exists "profiles: update own name" on public.profiles;
create policy "profiles: update own name"
  on public.profiles for update
  using (auth.uid() = id);

-- ---------- פונקציות מאובטחות לניהול (רק owner/admin יכולים להריץ) ----------

-- רק ה-owner יכול למנות/להסיר מנהלים
create or replace function public.set_user_role(target_id uuid, new_role app_role)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if public.current_role() <> 'owner' then
    raise exception 'רק הבעלים יכול לשנות תפקידים';
  end if;
  if new_role = 'owner' then
    raise exception 'לא ניתן להעניק owner דרך הפונקציה הזו';
  end if;
  update public.profiles set role = new_role where id = target_id;
end;
$$;

-- admin ומעלה יכולים להזהיר/להשעות משתמשים
create or replace function public.set_user_status(target_id uuid, new_status account_status)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if public.current_role() not in ('admin', 'owner') then
    raise exception 'אין הרשאה';
  end if;
  update public.profiles set status = new_status where id = target_id;
end;
$$;

-- ---------- saved_designs: עיצובים שמורים ----------
create table if not exists public.saved_designs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  block_slug text not null,
  name text not null default 'ללא שם',
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.saved_designs enable row level security;

drop policy if exists "saved_designs: owner full access" on public.saved_designs;
create policy "saved_designs: owner full access"
  on public.saved_designs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------- projects: פרויקטים קטנים ----------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'פרויקט חדש',
  blocks jsonb not null default '[]'::jsonb,
  github_repo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

drop policy if exists "projects: owner full access" on public.projects;
create policy "projects: owner full access"
  on public.projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------- contact_messages: פניות (גם מאורחים, גם ממשתמשים) ----------
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  subject text,
  message text not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

-- כל אחד (גם לא מחובר) יכול לשלוח פנייה
drop policy if exists "contact_messages: anyone can insert" on public.contact_messages;
create policy "contact_messages: anyone can insert"
  on public.contact_messages for insert
  with check (true);

-- רק admin/owner, או בעל הפנייה עצמו, יכולים לקרוא
drop policy if exists "contact_messages: read own or admin" on public.contact_messages;
create policy "contact_messages: read own or admin"
  on public.contact_messages for select
  using (auth.uid() = user_id or public.current_role() in ('admin', 'owner'));

-- ---------- api_keys: מפתחות AI אישיים, מוצפנים באפליקציה לפני השמירה ----------
create table if not exists public.api_keys (
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  encrypted_value text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, provider)
);

alter table public.api_keys enable row level security;

drop policy if exists "api_keys: owner full access" on public.api_keys;
create policy "api_keys: owner full access"
  on public.api_keys for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- שלב חובה אחרי ההרצה: להפוך את עצמך ל-owner (פעם אחת, ידנית)
-- 1. הירשם לאתר פעם אחת
-- 2. הרץ: select id, name from public.profiles;  ומצא את ה-id שלך
-- 3. הרץ (יש רק owner אחד באתר, שנקבע כאן ישירות ולא דרך set_user_role):
--    update public.profiles set role = 'owner' where id = 'ה-UUID-שלך';
-- ============================================================
