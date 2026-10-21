-- Email delivery for in-app notifications: a per-user opt-out, a sent marker, and two queue functions
-- that only admins or the service role (cron) may call.
alter table public.profiles add column if not exists email_notifications boolean not null default true;
alter table public.notifications add column if not exists emailed_at timestamptz;
create index if not exists notifications_email_queue_idx on public.notifications (created_at) where emailed_at is null;

create or replace function public.email_queue(p_limit int default 50)
returns table (id uuid, email text, title text, body text, link text, type text)
language plpgsql security definer set search_path = '' as $$
begin
  if not (private.is_admin() or auth.role() = 'service_role') then
    raise exception 'Tidak diizinkan';
  end if;
  return query
  select n.id, u.email::text, n.title, n.body, n.link, n.type
  from public.notifications n
  join public.profiles p on p.id = n.user_id
  join auth.users u on u.id = n.user_id
  where n.emailed_at is null
    and n.read_at is null
    and n.created_at > now() - interval '3 days'
    and n.type <> 'message'
    and p.email_notifications
    and p.banned_at is null
    and u.email is not null
  order by n.created_at
  limit greatest(1, least(p_limit, 200));
end $$;

create or replace function public.email_mark_sent(p_ids uuid[])
returns int language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  if not (private.is_admin() or auth.role() = 'service_role') then
    raise exception 'Tidak diizinkan';
  end if;
  update public.notifications set emailed_at = now() where id = any (p_ids) and emailed_at is null;
  get diagnostics n = row_count;
  return n;
end $$;

create or replace function public.set_email_notifications(p_on boolean)
returns void language sql security definer set search_path = '' as $$
  update public.profiles set email_notifications = p_on where id = auth.uid();
$$;

revoke execute on function public.email_queue(int), public.email_mark_sent(uuid[]), public.set_email_notifications(boolean) from public, anon;
grant execute on function public.email_queue(int), public.email_mark_sent(uuid[]), public.set_email_notifications(boolean) to authenticated, service_role;
