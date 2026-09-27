-- ============================================================
-- 0005: ספירת כניסות (סה"כ) + אנליטיקה מורחבת לפאנל הניהול
-- להריץ פעם אחת: Supabase Dashboard → SQL Editor → New query → Run.
-- בטוח להריץ שוב. האתר עובד גם לפני ההרצה (המספרים החדשים פשוט יוצגו כ"—").
-- ============================================================

-- 1) login_events: שורה לכל כניסה (התחברות) - נוצרת אוטומטית מטריגר על
--    auth.sessions, כך שכל דרך התחברות נספרת (סיסמה, GitHub, Google, קישור במייל).
create table if not exists public.login_events (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists login_events_created_idx on public.login_events (created_at);

alter table public.login_events enable row level security;
-- אין מדיניות גישה: לא קוראים ולא כותבים את הטבלה ישירות - רק דרך הפונקציות למטה.
revoke all on public.login_events from anon, authenticated;

create or replace function public.log_login_event()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.login_events (user_id) values (new.user_id);
  return new;
exception when others then
  -- ספירה סטטיסטית לעולם לא אמורה לחסום התחברות
  return new;
end;
$$;
revoke execute on function public.log_login_event() from public, anon, authenticated;

drop trigger if exists on_auth_session_created on auth.sessions;
create trigger on_auth_session_created
  after insert on auth.sessions
  for each row execute function public.log_login_event();

-- השלמת היסטוריה (פעם אחת): כניסות קודמות מיומן האימות של Supabase, אם הוא זמין.
do $$
begin
  if not exists (select 1 from public.login_events) then
    insert into public.login_events (user_id, created_at)
    select nullif(payload->>'actor_id', '')::uuid, created_at
    from auth.audit_log_entries
    where payload->>'action' = 'login';
  end if;
exception when others then
  null; -- אין יומן / אין הרשאה - מתחילים לספור מעכשיו
end $$;

-- 2) public_stats_totals(): מספרים מצטברים לדף הבית, בלי שום מידע אישי. פתוח לכולם.
create or replace function public.public_stats_totals()
returns json
language plpgsql stable security definer set search_path = public
as $$
declare
  logins bigint;
  visits bigint;
begin
  select count(*) into logins from public.login_events;
  begin
    select count(distinct session_id) into visits from public.analytics_events where kind = 'view';
  exception when others then
    visits := null;
  end;
  return json_build_object('total_logins', logins, 'total_visits', visits);
end;
$$;
grant execute on function public.public_stats_totals() to anon, authenticated;

-- 3) admin_analytics_v2(): אנליטיקה מורחבת - admin/owner בלבד.
create or replace function public.admin_analytics_v2()
returns json
language plpgsql stable security definer set search_path = public
as $$
declare
  result json;
begin
  if coalesce(public.current_role()::text, '') not in ('admin', 'owner') then
    raise exception 'אין הרשאה';
  end if;

  select json_build_object(
    'total_logins', (select count(*) from public.login_events),
    'logins_30d', (select count(*) from public.login_events where created_at >= now() - interval '30 days'),
    'active_users_30d', (select count(distinct user_id) from public.login_events where created_at >= now() - interval '30 days'),
    'new_users_30d', (select count(*) from auth.users where created_at >= now() - interval '30 days'),
    'total_visits', (select count(distinct session_id) from public.analytics_events where kind = 'view'),
    'visits_7d', (select count(distinct session_id) from public.analytics_events where kind = 'view' and created_at >= now() - interval '7 days'),
    'page_views_7d', (select count(*) from public.analytics_events where kind = 'view' and created_at >= now() - interval '7 days'),
    'daily', (
      select coalesce(json_agg(d order by d.day), '[]'::json) from (
        select g.day::date as day,
          (select count(distinct session_id) from public.analytics_events e
             where e.kind = 'view' and e.created_at >= g.day and e.created_at < g.day + interval '1 day') as visits,
          (select count(*) from public.login_events l
             where l.created_at >= g.day and l.created_at < g.day + interval '1 day') as logins
        from generate_series(date_trunc('day', now()) - interval '13 days', date_trunc('day', now()), interval '1 day') as g(day)
      ) d
    ),
    'top_pages', (
      select coalesce(json_agg(p), '[]'::json) from (
        select path, count(*) as views, count(distinct session_id) as visitors
        from public.analytics_events
        where kind = 'view' and created_at >= now() - interval '30 days'
        group by path order by views desc limit 8
      ) p
    ),
    'avg_page_seconds', (
      select coalesce(round(avg(duration_ms) / 1000.0), 0)
      from public.analytics_events where kind = 'duration' and created_at >= now() - interval '30 days'
    ),
    'saved_designs', (select count(*) from public.saved_designs),
    'projects', (select count(*) from public.projects)
  ) into result;
  return result;
end;
$$;
revoke execute on function public.admin_analytics_v2() from public, anon;
grant execute on function public.admin_analytics_v2() to authenticated;
