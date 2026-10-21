create or replace function public.public_reviews(p_user uuid)
returns table (id uuid, rating smallint, body text, reply text, created_at timestamptz, reviewer_name text, call_title text)
language sql stable security definer set search_path = '' as $$
  select r.id, r.rating, r.body, r.reply, r.created_at, coalesce(v.nickname, s.org_name, 'Pengguna'), c.title
  from public.reviews r
  join public.applications a on a.id = r.application_id
  join public.calls c on c.id = a.call_id
  left join public.volunteers v on v.id = r.reviewer_id
  left join public.seekers s on s.id = r.reviewer_id
  where r.reviewee_id = p_user and r.visible_at <= now()
  order by r.created_at desc
  limit 20;
$$;
grant execute on function public.public_reviews(uuid) to anon, authenticated;
