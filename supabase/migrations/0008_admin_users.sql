create or replace function public.admin_users(p_q text, p_role text)
returns table (id uuid, email text, role public.user_role, name text, slug text, level smallint, verified boolean, banned_at timestamptz, created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Akses ditolak'; end if;
  return query
  select p.id, u.email::text, p.role, coalesce(s.org_name, vp.full_name, v.nickname, 'Admin'), coalesce(v.slug, s.slug),
         v.verification_level, s.verified, p.banned_at, p.created_at
  from public.profiles p
  join auth.users u on u.id = p.id
  left join public.volunteers v on v.id = p.id
  left join public.volunteer_private vp on vp.id = p.id
  left join public.seekers s on s.id = p.id
  where (p_role is null or p_role = '' or p.role::text = p_role)
    and (p_q is null or p_q = '' or u.email ilike '%' || p_q || '%' or coalesce(s.org_name, vp.full_name, v.nickname, '') ilike '%' || p_q || '%')
  order by p.created_at desc
  limit 200;
end $$;
revoke execute on function public.admin_users(text, text) from public, anon;
grant execute on function public.admin_users(text, text) to authenticated;
