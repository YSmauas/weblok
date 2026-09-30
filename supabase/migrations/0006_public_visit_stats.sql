-- ============================================================
-- 0006: מונה ביקורים ציבורי לדף הבית - כל ביקור, לא רק משתמשים רשומים.
-- להריץ פעם אחת: Supabase Dashboard → SQL Editor → New query → Run. בטוח להריץ שוב.
-- האתר עובד גם לפני ההרצה (המספרים החדשים יוצגו כ"—").
--
-- "ביקור" = סשן אנונימי אחד (מזהה אקראי ב-sessionStorage, לשונית אחת; נמחק
-- בסגירתה). בלי IP, בלי משתמש, בלי עוגיות. משתמשים עם Do Not Track / GPC לא
-- נספרים בכלל (החלטה מתועדת ב-components/AnalyticsTracker.tsx).
-- ============================================================

-- אינדקס לספירות לפי סוג וזמן (הטבלה גדלה עם כל צפייה)
create index if not exists analytics_events_kind_created_idx
  on public.analytics_events (kind, created_at);

-- מחליף את הגרסה מ-0005: מוסיף ביקורים ב-30 הימים האחרונים ומספר צפיות בדפים.
create or replace function public.public_stats_totals()
returns json
language plpgsql stable security definer set search_path = public
as $$
declare
  logins bigint;
  visits bigint;
  visits_30d bigint;
  page_views bigint;
begin
  -- ציבורית בכוונה: מחזירה רק מספרים מצטברים, בלי שום מידע אישי או מזהה.
  select count(*) into logins from public.login_events;
  begin
    select count(distinct session_id),
           count(distinct session_id) filter (where created_at >= now() - interval '30 days'),
           count(*)
      into visits, visits_30d, page_views
      from public.analytics_events
     where kind = 'view';
  exception when others then
    visits := null;
    visits_30d := null;
    page_views := null;
  end;
  return json_build_object(
    'total_logins', logins,
    'total_visits', visits,
    'visits_30d', visits_30d,
    'page_views', page_views
  );
end;
$$;
revoke execute on function public.public_stats_totals() from public;
grant execute on function public.public_stats_totals() to anon, authenticated;
