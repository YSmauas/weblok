-- ============================================================
-- 0004: פרויקטים קטנים - קבצים, חיבור לגיטהאב, ו-ai_edited לעיצובים שמורים
-- להריץ פעם אחת: Supabase Dashboard → SQL Editor → New query → Run.
-- בטוח להריץ שוב (if not exists / or replace בכל מקום).
-- ============================================================

-- 1) saved_designs.ai_edited - העורך כבר כותב לעמודה הזו (סימון שהעיצוב נערך עם AI).
--    בלי העמודה, שמירת עיצוב נכשלת עם "column ai_edited does not exist".
alter table public.saved_designs add column if not exists ai_edited boolean not null default false;

-- 2) projects: ענף בגיטהאב (github_repo כבר קיים, בפורמט owner/repo)
alter table public.projects add column if not exists github_branch text;
alter table public.projects drop constraint if exists projects_github_repo_format;
alter table public.projects add constraint projects_github_repo_format
  check (github_repo is null or github_repo ~ '^[A-Za-z0-9-]{1,39}/[A-Za-z0-9._-]{1,100}$');
alter table public.projects drop constraint if exists projects_name_length;
alter table public.projects add constraint projects_name_length
  check (char_length(name) between 1 and 120);

-- 3) project_files: קבצי הטקסט של כל פרויקט (HTML/CSS/JS וכו').
--    נשמרים כטקסט ב-Postgres (ולא ב-Storage) - כך ההרשאות הן אותו RLS פשוט,
--    והמכסה נאכפת בטריגר אחד.
create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  path text not null check (char_length(path) between 1 and 300 and path !~ '(^|/)\.\.(/|$)'),
  content text not null default '',
  size integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (project_id, path)
);

create index if not exists project_files_user_idx on public.project_files (user_id);

alter table public.project_files enable row level security;

drop policy if exists "project_files: owner full access" on public.project_files;
create policy "project_files: owner full access"
  on public.project_files for all
  using (auth.uid() = user_id and public.is_active())
  with check (
    auth.uid() = user_id
    and public.is_active()
    and exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );

-- מכסה: 5MB לכל הפרויקטים של משתמש יחד. הגודל מחושב כאן (לא סומכים על הלקוח),
-- ונעילה לכל משתמש מונעת עקיפה ע"י העלאות מקבילות.
create or replace function public.project_files_enforce_quota()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  used bigint;
  quota constant bigint := 5 * 1024 * 1024;
begin
  new.size := octet_length(new.content);
  new.updated_at := now();
  perform pg_advisory_xact_lock(hashtext('project_files_quota:' || new.user_id::text));
  select coalesce(sum(size), 0) into used
    from public.project_files
    where user_id = new.user_id and id is distinct from new.id;
  if used + new.size > quota then
    raise exception 'quota_exceeded' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke execute on function public.project_files_enforce_quota() from public, anon, authenticated;

drop trigger if exists project_files_quota on public.project_files;
create trigger project_files_quota
  before insert or update on public.project_files
  for each row execute function public.project_files_enforce_quota();

-- מעדכן את updated_at של הפרויקט כשקובץ בו משתנה (למיון ברשימת הפרויקטים)
create or replace function public.project_files_touch_project()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  update public.projects set updated_at = now()
    where id = coalesce(new.project_id, old.project_id);
  return null;
end;
$$;

revoke execute on function public.project_files_touch_project() from public, anon, authenticated;

drop trigger if exists project_files_touch on public.project_files;
create trigger project_files_touch
  after insert or update or delete on public.project_files
  for each row execute function public.project_files_touch_project();
