create or replace function public.call_accepted_counts(p_calls uuid[])
returns table (call_id uuid, accepted int)
language sql stable security definer set search_path = '' as $$
  select a.call_id, count(*)::int from public.applications a
  where a.call_id = any (p_calls) and a.status in ('accepted', 'completed')
  group by a.call_id;
$$;

create or replace function public.platform_stats()
returns json language sql stable security definer set search_path = '' as $$
  select json_build_object(
    'volunteers', (select count(*) from public.volunteers where verification_level >= 1),
    'active_calls', (select count(*) from public.calls where status = 'aktif'),
    'completed', (select count(*) from public.applications where status = 'completed'),
    'cities', (select count(distinct city_id) from public.volunteers where verification_level >= 1)
  );
$$;

grant execute on function public.call_accepted_counts(uuid[]), public.platform_stats() to anon, authenticated;
