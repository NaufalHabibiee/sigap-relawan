-- Per-user rate limits enforced by BEFORE INSERT triggers, so no application code path can skip them.
create table if not exists private.rate_events (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  action text not null,
  at timestamptz not null default now()
);
create index if not exists rate_events_lookup on private.rate_events (user_id, action, at desc);

create or replace function private.hit_rate(p_action text, p_max int, p_window interval)
returns void language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  n int;
begin
  if uid is null then return; end if; -- cron and service jobs are not rate limited
  select count(*) into n from private.rate_events where user_id = uid and action = p_action and at > now() - p_window;
  if n >= p_max then
    raise exception 'Terlalu banyak percobaan. Coba lagi beberapa saat lagi.';
  end if;
  insert into private.rate_events (user_id, action) values (uid, p_action);
end $$;

create or replace function private.rate_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_table_name = 'applications' then
    if new.source = 'invite' then perform private.hit_rate('invite', 60, interval '1 hour');
    else perform private.hit_rate('apply', 20, interval '1 hour');
    end if;
  elsif tg_table_name = 'messages' then
    if new.kind <> 'system' then perform private.hit_rate('message', 30, interval '1 minute'); end if;
  elsif tg_table_name = 'reports' then
    perform private.hit_rate('report', 10, interval '1 day');
  elsif tg_table_name = 'phone_otps' then
    perform private.hit_rate('otp', 5, interval '1 hour');
  end if;
  return new;
end $$;

drop trigger if exists rate_guard on public.applications;
create trigger rate_guard before insert on public.applications for each row execute function private.rate_guard();
drop trigger if exists rate_guard on public.messages;
create trigger rate_guard before insert on public.messages for each row execute function private.rate_guard();
drop trigger if exists rate_guard on public.reports;
create trigger rate_guard before insert on public.reports for each row execute function private.rate_guard();
drop trigger if exists rate_guard on public.phone_otps;
create trigger rate_guard before insert on public.phone_otps for each row execute function private.rate_guard();

select cron.schedule('rate-events-cleanup', '15 3 * * *', $$delete from private.rate_events where at < now() - interval '2 days'$$);
