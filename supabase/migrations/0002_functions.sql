-- Helpers, matching engine and workflow RPCs.

-- Generic helpers ---------------------------------------------------------

create or replace function public.make_slug(p text)
returns text language sql volatile set search_path = '' as $$
  select coalesce(nullif(trim(both '-' from regexp_replace(lower(coalesce(p, '')), '[^a-z0-9]+', '-', 'g')), ''), 'x')
    || '-' || substr(md5(random()::text), 1, 5);
$$;

create or replace function public.haversine_km(lat1 float8, lng1 float8, lat2 float8, lng2 float8)
returns float8 language sql immutable set search_path = '' as $$
  select 2 * 6371 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2)
    + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
  ));
$$;

create or replace function public.slot_of(t time)
returns public.day_slot language sql immutable set search_path = '' as $$
  select case
    when t is null then null
    when t < '11:00' then 'pagi'::public.day_slot
    when t < '17:00' then 'siang'::public.day_slot
    else 'malam'::public.day_slot
  end;
$$;

create or replace function public.default_min_level(l public.load_level)
returns smallint language sql immutable set search_path = '' as $$
  select case when l in ('berat', 'darurat') then 2 else 1 end::smallint;
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.my_role()
returns public.user_role language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = auth.uid() and banned_at is null;
$$;

-- Seeker may see a volunteer's private data once the volunteer applied to / was invited to one of their calls.
create or replace function public.seeker_has_applicant(p_volunteer uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.applications a join public.calls c on c.id = a.call_id
    where a.volunteer_id = p_volunteer and c.seeker_id = auth.uid()
  );
$$;

-- Emergency/health data: only for accepted volunteers of heavy or emergency calls.
create or replace function public.seeker_has_accepted_heavy(p_volunteer uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.applications a join public.calls c on c.id = a.call_id
    where a.volunteer_id = p_volunteer and c.seeker_id = auth.uid()
      and a.status in ('accepted', 'completed') and c.load in ('berat', 'darurat')
  );
$$;

create or replace function public.is_app_participant(p_app uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.applications a join public.calls c on c.id = a.call_id
    where a.id = p_app and (a.volunteer_id = auth.uid() or c.seeker_id = auth.uid())
  );
$$;

create or replace function public.notify(p_user uuid, p_type text, p_title text, p_body text, p_link text)
returns void language sql security definer set search_path = '' as $$
  insert into public.notifications (user_id, type, title, body, link) values (p_user, p_type, p_title, p_body, p_link);
$$;

create or replace function public.system_message(p_app uuid, p_body text)
returns void language sql security definer set search_path = '' as $$
  insert into public.messages (application_id, kind, body) values (p_app, 'system', p_body);
$$;

create or replace function public.require_role(p public.user_role)
returns void language plpgsql stable security definer set search_path = '' as $$
begin
  if public.my_role() is distinct from p then
    raise exception 'Akses ditolak' using errcode = '42501';
  end if;
end $$;

create or replace function public.user_stats(p_user uuid)
returns table (rating_avg numeric, rating_count int, completed int, no_show int)
language sql stable security definer set search_path = '' as $$
  select
    (select round(avg(rating)::numeric, 2) from public.reviews where reviewee_id = p_user and visible_at <= now()),
    (select count(*)::int from public.reviews where reviewee_id = p_user and visible_at <= now()),
    (select count(*)::int from public.applications where volunteer_id = p_user and status = 'completed')
      + (select count(*)::int from public.calls where seeker_id = p_user and status = 'selesai'),
    (select count(*)::int from public.applications where volunteer_id = p_user and status = 'no_show');
$$;

-- New users -----------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  r public.user_role;
  confirmed boolean := (new.raw_user_meta_data ->> 'role') in ('volunteer', 'seeker');
  n text := coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
                     nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
                     split_part(new.email, '@', 1));
  st text := new.raw_user_meta_data ->> 'seeker_type';
begin
  r := case when new.raw_user_meta_data ->> 'role' = 'seeker' then 'seeker' else 'volunteer' end;
  insert into public.profiles (id, role, role_confirmed) values (new.id, r, confirmed);
  if r = 'volunteer' then
    insert into public.volunteers (id, slug, nickname) values (new.id, public.make_slug(n), split_part(n, ' ', 1));
    insert into public.volunteer_private (id, full_name) values (new.id, n);
  else
    insert into public.seekers (id, slug, org_name, type)
    values (new.id, public.make_slug(n), n,
            case when st in ('perusahaan', 'lembaga', 'komunitas', 'campaign', 'individu') then st::public.seeker_type else 'individu' end);
  end if;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- OAuth users land without a role; they pick one once.
create or replace function public.choose_role(p_role public.user_role, p_seeker_type public.seeker_type default 'individu')
returns void language plpgsql security definer set search_path = '' as $$
declare
  p public.profiles;
  n text;
begin
  select * into p from public.profiles where id = auth.uid();
  if p.id is null or p.role_confirmed then raise exception 'Peran sudah dipilih'; end if;
  if p_role not in ('volunteer', 'seeker') then raise exception 'Peran tidak valid'; end if;
  update public.profiles set role = p_role, role_confirmed = true where id = p.id;
  if p_role = 'seeker' and p.role = 'volunteer' then
    select coalesce(full_name, 'Penyelenggara') into n from public.volunteer_private where id = p.id;
    delete from public.volunteers where id = p.id;
    insert into public.seekers (id, slug, org_name, type) values (p.id, public.make_slug(n), n, p_seeker_type);
  end if;
end $$;

-- Phone verification ----------------------------------------------------------

create or replace function public.request_phone_otp(p_phone text)
returns text language plpgsql security definer set search_path = '' as $$
declare
  ph text := regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g');
  code text := lpad((floor(random() * 1000000))::int::text, 6, '0');
  last timestamptz;
begin
  if auth.uid() is null or public.my_role() is null then raise exception 'Akses ditolak'; end if;
  ph := regexp_replace(ph, '^(\+62|62)', '0');
  if ph !~ '^08[0-9]{8,12}$' then raise exception 'Nomor HP tidak valid. Contoh: 081234567890'; end if;
  select created_at into last from public.phone_otps where user_id = auth.uid();
  if last is not null and last > now() - interval '60 seconds' then
    raise exception 'Tunggu 1 menit sebelum meminta kode baru';
  end if;
  insert into public.phone_otps (user_id, phone, code_hash, expires_at)
  values (auth.uid(), ph, extensions.crypt(code, extensions.gen_salt('bf')), now() + interval '10 minutes')
  on conflict (user_id) do update set phone = excluded.phone, code_hash = excluded.code_hash,
    attempts = 0, expires_at = excluded.expires_at, created_at = now();
  -- Demo mode returns the code so it can be shown on screen until an SMS provider is connected.
  if coalesce((select (value)::boolean from public.app_settings where key = 'demo_otp'), false) then
    return code;
  end if;
  return null;
end $$;

create or replace function public.verify_phone_otp(p_code text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  o public.phone_otps;
begin
  select * into o from public.phone_otps where user_id = auth.uid();
  if o.user_id is null or o.expires_at < now() then raise exception 'Kode kedaluwarsa. Minta kode baru.'; end if;
  if o.attempts >= 5 then raise exception 'Terlalu banyak percobaan. Minta kode baru.'; end if;
  if extensions.crypt(coalesce(p_code, ''), o.code_hash) <> o.code_hash then
    update public.phone_otps set attempts = attempts + 1 where user_id = o.user_id;
    return false;
  end if;
  update public.profiles set phone = o.phone, phone_verified = true where id = o.user_id;
  delete from public.phone_otps where user_id = o.user_id;
  if public.my_role() = 'volunteer' then perform public.refresh_volunteer(); end if;
  return true;
end $$;

-- Calls guard -----------------------------------------------------------------

create or replace function public.calls_guard()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.slug := public.make_slug(new.title);
    new.status := 'draf';
    new.published_at := null;
  end if;
  new.min_level := greatest(coalesce(new.min_level, 0), public.default_min_level(new.load));
  if new.load <> 'darurat' then new.is_emergency := false; end if;
  if new.mode = 'online' then new.city_id := null; new.address := null; end if;
  if new.gender is not null and coalesce(trim(new.gender_reason), '') = '' then
    raise exception 'Kriteria jenis kelamin wajib disertai alasan';
  end if;
  if new.age_min is not null and new.age_max is not null and new.age_min > new.age_max then
    raise exception 'Usia minimal tidak boleh lebih besar dari usia maksimal';
  end if;
  if new.deadline > new.end_date then
    raise exception 'Batas pendaftaran harus sebelum atau sama dengan tanggal selesai';
  end if;
  new.updated_at := now();
  return new;
end $$;

create trigger calls_guard before insert or update on public.calls
  for each row execute function public.calls_guard();

-- Matching engine -------------------------------------------------------------

create or replace function public.match_eval(c public.calls, v public.volunteers)
returns table (score int, reasons text[])
language plpgsql stable security definer set search_path = '' as $$
declare
  vp public.volunteer_private;
  vc public.cities;
  cc public.cities;
  dist float8;
  yrs int;
  t int; m int; mh int;
  s_sk numeric; s_loc int; s_int int; s_exp int; s_rat numeric; s_act int;
  rs text[] := '{}';
  days int[];
  sl public.day_slot;
  st record;
  n_exp int;
begin
  -- Hard filters: any failure means no match.
  if v.verification_level < c.min_level then return; end if;
  if v.paused_until is not null and v.paused_until >= current_date then return; end if;
  if exists (select 1 from public.profiles p where p.id = v.id and p.banned_at is not null) then return; end if;
  if not exists (select 1 from public.volunteer_loads l where l.volunteer_id = v.id and l.load = c.load) then return; end if;
  select * into vp from public.volunteer_private where id = v.id;

  if c.mode = 'online' then
    if v.mode = 'onsite' then return; end if;
  else
    if v.mode = 'online' then return; end if;
    select * into vc from public.cities where id = v.city_id;
    select * into cc from public.cities where id = c.city_id;
    if vc.id is null or cc.id is null then return; end if;
    dist := public.haversine_km(vc.lat, vc.lng, cc.lat, cc.lng);
    if vc.id <> cc.id and dist > 30 then
      if not v.willing_travel then return; end if;
      if v.max_radius_km is not null and dist > v.max_radius_km then return; end if;
    end if;
  end if;

  if c.age_min is not null or c.age_max is not null then
    if vp.birth_date is null then return; end if;
    yrs := extract(year from age(c.start_date, vp.birth_date));
    if (c.age_min is not null and yrs < c.age_min) or (c.age_max is not null and yrs > c.age_max) then return; end if;
  end if;
  if c.gender is not null and vp.gender is distinct from c.gender then return; end if;

  if exists (
    select 1 from public.call_skills cs
    where cs.call_id = c.id and cs.required
      and not exists (select 1 from public.volunteer_skills vs where vs.volunteer_id = v.id and vs.skill_id = cs.skill_id)
  ) then return; end if;

  if exists (
    select 1 from public.call_involves ci
    join public.volunteer_limitations vl on vl.limitation_id = ci.limitation_id and vl.volunteer_id = v.id
    where ci.call_id = c.id
  ) then return; end if;

  if c.min_followers is not null and not exists (
    select 1 from public.volunteer_socials so where so.volunteer_id = v.id and so.followers >= c.min_followers
  ) then return; end if;

  if not (c.is_emergency and v.emergency_standby) then
    select array_agg(distinct extract(isodow from d)::int) into days
    from generate_series(c.start_date::timestamp, least(c.end_date, c.start_date + 6)::timestamp, interval '1 day') d;
    sl := public.slot_of(c.start_time);
    if not exists (
      select 1 from public.volunteer_availability a
      where a.volunteer_id = v.id and a.weekday = any (days) and (sl is null or a.slot = sl)
    ) then return; end if;
  end if;

  if exists (
    select 1 from public.applications a join public.calls o on o.id = a.call_id
    where a.volunteer_id = v.id and a.status = 'accepted' and o.id <> c.id
      and o.start_date <= c.end_date and o.end_date >= c.start_date
  ) then return; end if;

  -- Score, 0..100.
  select count(*), count(vs.skill_id), count(*) filter (where vs.level = 2)
    into t, m, mh
  from public.call_skills cs
  left join public.volunteer_skills vs on vs.skill_id = cs.skill_id and vs.volunteer_id = v.id
  where cs.call_id = c.id;
  if t = 0 then
    s_sk := 25;
  else
    s_sk := 30.0 * m / t + 5.0 * mh / t;
    if m > 0 then rs := rs || format('%s dari %s skill cocok', m, t); end if;
  end if;

  if c.mode = 'online' then
    s_loc := 20; rs := rs || 'Bisa dikerjakan online'::text;
  elsif vc.id = cc.id then
    s_loc := 20; rs := rs || format('Sama-sama di %s', cc.name);
  elsif dist <= 30 then
    s_loc := 17; rs := rs || format('%s km dari lokasi', round(dist::numeric));
  elsif dist <= 100 then
    s_loc := 12; rs := rs || format('%s km dari lokasi', round(dist::numeric));
  else
    s_loc := 6; rs := rs || format('Bersedia ke %s (%s km)', cc.name, round(dist::numeric));
  end if;

  if exists (select 1 from public.volunteer_interests i where i.volunteer_id = v.id and i.category_id = c.category_id) then
    s_int := 15; rs := rs || 'Sesuai minat kategori'::text;
  else
    s_int := 0;
  end if;

  select count(*) into n_exp from public.applications a join public.calls o on o.id = a.call_id
  where a.volunteer_id = v.id and a.status = 'completed' and o.category_id = c.category_id;
  s_exp := least(10, n_exp * 4);
  if n_exp > 0 then rs := rs || format('Pernah ikut %s kegiatan serupa', n_exp); end if;

  select * into st from public.user_stats(v.id);
  if st.rating_count = 0 and st.completed = 0 and st.no_show = 0 then
    s_rat := 6;
  else
    s_rat := coalesce(st.rating_avg, 3.5) / 5 * 7
      + case when st.completed + st.no_show = 0 then 3 else 3.0 * st.completed / (st.completed + st.no_show) end;
    if st.rating_count > 0 then rs := rs || format('Rating %s', to_char(st.rating_avg, 'FM0.0')); end if;
  end if;

  s_act := (case when v.profile_complete then 5 else 0 end)
         + (case when v.last_active_at > now() - interval '14 days' then 5 else 0 end);

  if c.is_emergency and v.emergency_standby then rs := rs || 'Siaga darurat'::text; end if;

  score := least(100, round(s_sk + s_loc + s_int + s_exp + s_rat + s_act))::int;
  reasons := rs;
  return next;
end $$;

-- Upserts a match and sends at most one notification per (call, volunteer).
create or replace function public.store_match(c public.calls, v public.volunteers, p_score int, p_reasons text[])
returns void language plpgsql security definer set search_path = '' as $$
declare
  mt public.matches;
  today_count int;
  city text;
begin
  insert into public.matches (call_id, volunteer_id, score, reasons)
  values (c.id, v.id, p_score, p_reasons)
  on conflict (call_id, volunteer_id) do update
    set score = excluded.score, reasons = excluded.reasons, updated_at = now()
  returning * into mt;

  if mt.dismissed or mt.notified_at is not null or p_score < 70 then return; end if;
  if c.category_id = any (v.muted_categories) and not c.is_emergency then return; end if;
  if exists (select 1 from public.applications a where a.call_id = c.id and a.volunteer_id = v.id) then return; end if;

  select count(*) into today_count from public.notifications
  where user_id = v.id and type = 'match' and created_at > date_trunc('day', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta';
  if today_count >= 5 and not c.is_emergency then return; end if;

  select name into city from public.cities where id = c.city_id;
  perform public.notify(
    v.id,
    'match',
    case when c.is_emergency then 'Panggilan darurat cocok untukmu' else 'Ada panggilan yang cocok' end,
    format('%s — %s · cocok %s%%', c.title, coalesce(city, 'Online'), p_score),
    '/panggilan/' || c.slug
  );
  update public.matches set notified_at = now() where call_id = c.id and volunteer_id = v.id;
end $$;

create or replace function public.compute_matches_for_call(p_call uuid)
returns int language plpgsql security definer set search_path = '' as $$
declare
  c public.calls;
  r record;
  kept uuid[] := '{}';
begin
  select * into c from public.calls where id = p_call;
  if c.id is null then return 0; end if;
  if c.status <> 'aktif' or c.deadline < current_date then
    delete from public.matches where call_id = p_call and not dismissed;
    return 0;
  end if;
  for r in
    select v as vol, e.score, e.reasons
    from public.volunteers v
    cross join lateral public.match_eval(c, v) e
    where v.verification_level >= 1 and e.score >= 50
  loop
    perform public.store_match(c, r.vol, r.score, r.reasons);
    kept := kept || (r.vol).id;
  end loop;
  delete from public.matches where call_id = p_call and not dismissed and volunteer_id <> all (kept);
  return cardinality(kept);
end $$;

create or replace function public.compute_matches_for_volunteer(p_vol uuid)
returns int language plpgsql security definer set search_path = '' as $$
declare
  v public.volunteers;
  r record;
  kept uuid[] := '{}';
begin
  select * into v from public.volunteers where id = p_vol;
  if v.id is null then return 0; end if;
  if v.verification_level >= 1 then
    for r in
      select c as cl, e.score, e.reasons
      from public.calls c
      cross join lateral public.match_eval(c, v) e
      where c.status = 'aktif' and c.deadline >= current_date and e.score >= 50
      order by c.is_emergency desc, e.score desc
    loop
      perform public.store_match(r.cl, v, r.score, r.reasons);
      kept := kept || (r.cl).id;
    end loop;
  end if;
  delete from public.matches where volunteer_id = p_vol and not dismissed and call_id <> all (kept);
  return cardinality(kept);
end $$;

-- Recomputes completeness + level, then matches. Called by the app after every profile save.
create or replace function public.recompute_volunteer_level(p_vol uuid)
returns smallint language plpgsql security definer set search_path = '' as $$
declare
  v public.volunteers;
  vp public.volunteer_private;
  complete boolean;
  lvl smallint;
begin
  select * into v from public.volunteers where id = p_vol;
  select * into vp from public.volunteer_private where id = p_vol;
  complete := v.nickname is not null and vp.full_name is not null and vp.birth_date is not null
    and vp.gender is not null and v.city_id is not null
    and (select phone_verified from public.profiles where id = p_vol)
    and (select count(*) from public.volunteer_skills where volunteer_id = p_vol) >= 3
    and exists (select 1 from public.volunteer_interests where volunteer_id = p_vol)
    and exists (select 1 from public.volunteer_loads where volunteer_id = p_vol)
    and exists (select 1 from public.volunteer_availability where volunteer_id = p_vol)
    and (not exists (select 1 from public.volunteer_loads where volunteer_id = p_vol and load = 'promosi')
         or exists (select 1 from public.volunteer_socials where volunteer_id = p_vol));
  lvl := case
    when not coalesce(complete, false) then 0
    when exists (select 1 from public.verification_requests where user_id = p_vol and kind = 'volunteer' and status = 'approved')
         and exists (select 1 from public.volunteer_emergency where volunteer_id = p_vol) then 2
    else 1
  end;
  update public.volunteers
    set verification_level = lvl, profile_complete = coalesce(complete, false), last_active_at = now()
  where id = p_vol;
  return lvl;
end $$;

create or replace function public.refresh_volunteer()
returns json language plpgsql security definer set search_path = '' as $$
declare
  lvl smallint;
  n int;
begin
  perform public.require_role('volunteer');
  lvl := public.recompute_volunteer_level(auth.uid());
  n := public.compute_matches_for_volunteer(auth.uid());
  return json_build_object('level', lvl, 'matches', n);
end $$;

create or replace function public.touch_activity()
returns void language sql security definer set search_path = '' as $$
  update public.volunteers set last_active_at = now()
  where id = auth.uid() and last_active_at < now() - interval '1 hour';
$$;

-- Calls lifecycle -----------------------------------------------------------

create or replace function public.own_call(p_call uuid)
returns public.calls language plpgsql stable security definer set search_path = '' as $$
declare c public.calls;
begin
  perform public.require_role('seeker');
  select * into c from public.calls where id = p_call and seeker_id = auth.uid();
  if c.id is null then raise exception 'Panggilan tidak ditemukan'; end if;
  return c;
end $$;

create or replace function public.publish_call(p_call uuid)
returns int language plpgsql security definer set search_path = '' as $$
declare
  c public.calls := public.own_call(p_call);
  verified boolean;
begin
  if c.status <> 'draf' then raise exception 'Hanya draf yang bisa dipublikasikan'; end if;
  if c.deadline < current_date then raise exception 'Batas pendaftaran sudah lewat'; end if;
  select s.verified into verified from public.seekers s where s.id = c.seeker_id;
  if c.load in ('berat', 'darurat') and not verified then
    raise exception 'Panggilan tingkat berat dan darurat hanya untuk penyelenggara terverifikasi';
  end if;
  if not exists (select 1 from public.profiles where id = auth.uid() and phone_verified) then
    raise exception 'Verifikasi nomor HP dulu sebelum mempublikasikan';
  end if;
  update public.calls set status = 'aktif', published_at = now() where id = p_call;
  return public.compute_matches_for_call(p_call);
end $$;

create or replace function public.refresh_call_matches(p_call uuid)
returns int language plpgsql security definer set search_path = '' as $$
begin
  perform public.own_call(p_call);
  return public.compute_matches_for_call(p_call);
end $$;

create or replace function public.sync_call_capacity(p_call uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  c public.calls;
  accepted int;
begin
  select * into c from public.calls where id = p_call;
  select count(*) into accepted from public.applications where call_id = p_call and status = 'accepted';
  if c.status = 'aktif' and accepted >= c.quota then
    update public.calls set status = 'penuh' where id = p_call;
    delete from public.matches where call_id = p_call and not dismissed;
    perform public.notify(c.seeker_id, 'call_full', 'Kuota terpenuhi', c.title || ' sudah mendapat ' || accepted || ' relawan.', '/p/panggilan/' || c.id);
  elsif c.status = 'penuh' and accepted < c.quota then
    update public.calls set status = 'aktif' where id = p_call;
    perform public.compute_matches_for_call(p_call);
  end if;
end $$;

create or replace function public.close_call(p_call uuid, p_cancel boolean, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  c public.calls := public.own_call(p_call);
  a record;
begin
  if c.status in ('selesai', 'dibatalkan') then raise exception 'Panggilan sudah berakhir'; end if;
  if p_cancel and coalesce(trim(p_reason), '') = '' then raise exception 'Alasan pembatalan wajib diisi'; end if;
  update public.calls
    set status = case when p_cancel then 'dibatalkan'::public.call_status else 'ditutup'::public.call_status end,
        cancel_reason = case when p_cancel then p_reason end
  where id = p_call;
  delete from public.matches where call_id = p_call and not dismissed;
  for a in select * from public.applications where call_id = p_call and status in ('applied', 'invited', 'reviewing', 'accepted') loop
    if p_cancel or a.status <> 'accepted' then
      update public.applications set status = 'cancelled', cancel_reason = coalesce(p_reason, 'Panggilan ditutup'), updated_at = now() where id = a.id;
      perform public.system_message(a.id, case when p_cancel then 'Panggilan dibatalkan: ' || p_reason else 'Panggilan ditutup oleh penyelenggara.' end);
      perform public.notify(a.volunteer_id, 'call_closed',
        case when p_cancel then 'Panggilan dibatalkan' else 'Panggilan ditutup' end, c.title, '/pesan/' || a.id);
    end if;
  end loop;
end $$;

-- Applications ----------------------------------------------------------------

create or replace function public.apply_to_call(p_call uuid, p_message text, p_answers text[], p_cv_path text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  c public.calls;
  v public.volunteers;
  app uuid;
begin
  perform public.require_role('volunteer');
  select * into c from public.calls where id = p_call;
  select * into v from public.volunteers where id = auth.uid();
  if c.id is null or c.status <> 'aktif' then raise exception 'Panggilan tidak menerima pendaftaran'; end if;
  if c.deadline < current_date then raise exception 'Batas pendaftaran sudah lewat'; end if;
  if v.verification_level < c.min_level then
    raise exception 'Panggilan ini butuh verifikasi Level %', c.min_level;
  end if;
  if c.need_cv and coalesce(p_cv_path, '') = '' then raise exception 'Panggilan ini mewajibkan CV'; end if;
  if p_cv_path is not null and split_part(p_cv_path, '/', 1) <> auth.uid()::text then raise exception 'Berkas CV tidak valid'; end if;
  if cardinality(c.questions) > 0 and coalesce(cardinality(p_answers), 0) < cardinality(c.questions) then
    raise exception 'Jawab semua pertanyaan penyelenggara';
  end if;
  if exists (select 1 from public.applications where call_id = p_call and volunteer_id = v.id) then
    raise exception 'Kamu sudah terdaftar di panggilan ini';
  end if;
  insert into public.applications (call_id, volunteer_id, source, status, message, answers, cv_path)
  values (p_call, v.id, 'apply', 'applied', nullif(trim(p_message), ''), coalesce(p_answers, '{}'), p_cv_path)
  returning id into app;
  perform public.system_message(app, 'Lamaran dikirim.');
  perform public.notify(c.seeker_id, 'applicant', 'Pelamar baru', coalesce(v.nickname, 'Relawan') || ' melamar ' || c.title, '/p/panggilan/' || c.id || '?tab=pelamar');
  update public.volunteers set last_active_at = now() where id = v.id;
  return app;
end $$;

create or replace function public.invite_volunteer(p_call uuid, p_volunteer uuid, p_message text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  c public.calls := public.own_call(p_call);
  v public.volunteers;
  app uuid;
  org text;
begin
  if c.status <> 'aktif' then raise exception 'Panggilan tidak aktif'; end if;
  select * into v from public.volunteers where id = p_volunteer;
  if v.id is null or v.verification_level < c.min_level then raise exception 'Relawan belum memenuhi level verifikasi'; end if;
  if exists (select 1 from public.applications where call_id = p_call and volunteer_id = p_volunteer) then
    raise exception 'Relawan ini sudah terhubung dengan panggilan ini';
  end if;
  insert into public.applications (call_id, volunteer_id, source, status, message, expires_at)
  values (p_call, p_volunteer, 'invite', 'invited', nullif(trim(p_message), ''),
          now() + case when c.is_emergency then interval '6 hours' else interval '48 hours' end)
  returning id into app;
  select org_name into org from public.seekers where id = c.seeker_id;
  perform public.system_message(app, 'Undangan dikirim. Berlaku ' || case when c.is_emergency then '6 jam' else '48 jam' end || '.');
  if nullif(trim(p_message), '') is not null then
    insert into public.messages (application_id, sender_id, body) values (app, auth.uid(), trim(p_message));
  end if;
  perform public.notify(p_volunteer, 'invite',
    case when c.is_emergency then 'Undangan darurat' else 'Kamu diundang' end,
    org || ' mengundangmu ke ' || c.title, '/pesan/' || app);
  return app;
end $$;

create or replace function public.expire_invites()
returns int language plpgsql security definer set search_path = '' as $$
declare
  a record;
  n int := 0;
begin
  for a in
    update public.applications set status = 'expired', updated_at = now()
    where status = 'invited' and expires_at < now()
    returning id, call_id, volunteer_id
  loop
    perform public.system_message(a.id, 'Undangan kedaluwarsa.');
    perform public.notify((select seeker_id from public.calls where id = a.call_id), 'invite_expired',
      'Undangan kedaluwarsa', (select title from public.calls where id = a.call_id), '/p/panggilan/' || a.call_id);
    n := n + 1;
  end loop;
  return n;
end $$;

create or replace function public.respond_invite(p_app uuid, p_accept boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare
  a public.applications;
  c public.calls;
  v public.volunteers;
begin
  perform public.require_role('volunteer');
  perform public.expire_invites();
  select * into a from public.applications where id = p_app and volunteer_id = auth.uid();
  if a.id is null then raise exception 'Undangan tidak ditemukan'; end if;
  if a.status = 'expired' then raise exception 'Undangan sudah kedaluwarsa'; end if;
  if a.status <> 'invited' then raise exception 'Undangan sudah dijawab'; end if;
  select * into c from public.calls where id = a.call_id;
  select * into v from public.volunteers where id = a.volunteer_id;
  if p_accept then
    if c.status <> 'aktif' then raise exception 'Kuota panggilan sudah penuh atau ditutup'; end if;
    update public.applications set status = 'accepted', decided_at = now(), updated_at = now() where id = p_app;
    perform public.system_message(p_app, 'Undangan diterima. Kamu resmi menjadi relawan di kegiatan ini.');
    perform public.notify(c.seeker_id, 'invite_accepted', 'Undangan diterima', coalesce(v.nickname, 'Relawan') || ' bergabung di ' || c.title, '/pesan/' || p_app);
    perform public.sync_call_capacity(c.id);
  else
    update public.applications set status = 'declined', decided_at = now(), updated_at = now() where id = p_app;
    perform public.system_message(p_app, 'Undangan ditolak.');
    perform public.notify(c.seeker_id, 'invite_declined', 'Undangan ditolak', coalesce(v.nickname, 'Relawan') || ' tidak bisa ikut ' || c.title, '/p/panggilan/' || c.id);
  end if;
end $$;

create or replace function public.decide_application(p_app uuid, p_status public.app_status)
returns void language plpgsql security definer set search_path = '' as $$
declare
  a public.applications;
  c public.calls;
begin
  select * into a from public.applications where id = p_app;
  if a.id is null then raise exception 'Lamaran tidak ditemukan'; end if;
  c := public.own_call(a.call_id);
  if p_status not in ('reviewing', 'accepted', 'rejected') then raise exception 'Status tidak valid'; end if;
  if a.status not in ('applied', 'reviewing') then raise exception 'Lamaran ini sudah diputuskan'; end if;
  if p_status = 'accepted' and c.status <> 'aktif' then raise exception 'Kuota sudah penuh atau panggilan ditutup'; end if;
  update public.applications set status = p_status, updated_at = now(),
    decided_at = case when p_status = 'reviewing' then null else now() end
  where id = p_app;
  if p_status = 'reviewing' then
    perform public.system_message(p_app, 'Lamaran sedang ditinjau.');
    perform public.notify(a.volunteer_id, 'app_reviewing', 'Lamaran ditinjau', c.title, '/pesan/' || p_app);
  elsif p_status = 'accepted' then
    perform public.system_message(p_app, 'Lamaran diterima. Selamat bergabung!');
    perform public.notify(a.volunteer_id, 'app_accepted', 'Lamaran diterima', c.title, '/pesan/' || p_app);
    perform public.sync_call_capacity(c.id);
  else
    perform public.system_message(p_app, 'Lamaran belum bisa diterima kali ini.');
    perform public.notify(a.volunteer_id, 'app_rejected', 'Lamaran tidak diterima', c.title, '/pesan/' || p_app);
  end if;
end $$;

create or replace function public.cancel_application(p_app uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  a public.applications;
  c public.calls;
  is_vol boolean;
begin
  select * into a from public.applications where id = p_app;
  select * into c from public.calls where id = a.call_id;
  if a.id is null or not public.is_app_participant(p_app) then raise exception 'Lamaran tidak ditemukan'; end if;
  if a.status not in ('applied', 'invited', 'reviewing', 'accepted') then raise exception 'Lamaran sudah tidak aktif'; end if;
  if coalesce(trim(p_reason), '') = '' then raise exception 'Alasan pembatalan wajib diisi'; end if;
  is_vol := a.volunteer_id = auth.uid();
  update public.applications set status = 'cancelled', cancel_reason = p_reason, updated_at = now() where id = p_app;
  perform public.system_message(p_app, (case when is_vol then 'Relawan' else 'Penyelenggara' end) || ' membatalkan: ' || p_reason);
  perform public.notify(case when is_vol then c.seeker_id else a.volunteer_id end, 'app_cancelled',
    'Keikutsertaan dibatalkan', c.title || ' — ' || p_reason, '/pesan/' || p_app);
  if a.status = 'accepted' then perform public.sync_call_capacity(c.id); end if;
end $$;

create or replace function public.mark_attendance(p_app uuid, p_attended boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare
  a public.applications;
  c public.calls;
begin
  select * into a from public.applications where id = p_app;
  if a.id is null then raise exception 'Lamaran tidak ditemukan'; end if;
  c := public.own_call(a.call_id);
  if a.status <> 'accepted' then raise exception 'Hanya relawan yang diterima yang bisa ditandai'; end if;
  if current_date < c.start_date then raise exception 'Kehadiran bisa ditandai mulai tanggal kegiatan'; end if;
  update public.applications
    set status = case when p_attended then 'completed'::public.app_status else 'no_show'::public.app_status end,
        attended_at = now(), updated_at = now()
  where id = p_app;
  if p_attended then
    perform public.system_message(p_app, 'Kegiatan selesai. Terima kasih! Beri ulasan dalam 14 hari.');
    perform public.notify(a.volunteer_id, 'review_request', 'Beri ulasan untuk penyelenggara', c.title, '/pesan/' || p_app);
  else
    perform public.system_message(p_app, 'Relawan ditandai tidak hadir.');
    perform public.notify(a.volunteer_id, 'no_show', 'Kamu ditandai tidak hadir', c.title, '/pesan/' || p_app);
  end if;
  if not exists (select 1 from public.applications where call_id = c.id and status = 'accepted') then
    update public.calls set status = 'selesai' where id = c.id and status in ('aktif', 'penuh', 'ditutup');
    delete from public.matches where call_id = c.id;
  end if;
end $$;

-- Messaging -----------------------------------------------------------------

create or replace function public.chat_locked(p_app uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select c.end_date + 30 < current_date
  from public.applications a join public.calls c on c.id = a.call_id where a.id = p_app;
$$;

create or replace function public.chat_blocked(p_app uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.applications a join public.calls c on c.id = a.call_id
    join public.user_blocks b on (b.blocker_id = a.volunteer_id and b.blocked_id = c.seeker_id)
                              or (b.blocker_id = c.seeker_id and b.blocked_id = a.volunteer_id)
    where a.id = p_app
  );
$$;

create or replace function public.on_message_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  a public.applications;
  c public.calls;
  recipient uuid;
  sender_name text;
  v_link text := '/pesan/' || new.application_id;
begin
  if new.kind <> 'user' then return new; end if;
  select * into a from public.applications where id = new.application_id;
  select * into c from public.calls where id = a.call_id;
  recipient := case when new.sender_id = a.volunteer_id then c.seeker_id else a.volunteer_id end;
  sender_name := case when new.sender_id = a.volunteer_id
    then (select coalesce(nickname, 'Relawan') from public.volunteers where id = a.volunteer_id)
    else (select org_name from public.seekers where id = c.seeker_id) end;
  -- Collapse unread chat notifications per thread into one.
  update public.notifications set body = sender_name || ': ' || left(coalesce(new.body, 'Lampiran'), 120), created_at = now()
  where user_id = recipient and type = 'message' and link = v_link and read_at is null;
  if not found then
    perform public.notify(recipient, 'message', 'Pesan baru · ' || c.title, sender_name || ': ' || left(coalesce(new.body, 'Lampiran'), 120), v_link);
  end if;
  return new;
end $$;

create trigger on_message_insert after insert on public.messages
  for each row execute function public.on_message_insert();

create or replace function public.mark_thread_read(p_app uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_app_participant(p_app) then return; end if;
  update public.messages set read_at = now()
  where application_id = p_app and read_at is null and (sender_id is distinct from auth.uid());
  update public.notifications set read_at = now()
  where user_id = auth.uid() and link = '/pesan/' || p_app and read_at is null;
end $$;

create or replace function public.announce(p_call uuid, p_body text)
returns int language plpgsql security definer set search_path = '' as $$
declare
  c public.calls := public.own_call(p_call);
  a record;
  n int := 0;
begin
  if coalesce(trim(p_body), '') = '' then raise exception 'Pengumuman kosong'; end if;
  for a in select id, volunteer_id from public.applications where call_id = p_call and status = 'accepted' loop
    insert into public.messages (application_id, sender_id, kind, body) values (a.id, auth.uid(), 'announcement', trim(p_body));
    perform public.notify(a.volunteer_id, 'announcement', 'Pengumuman · ' || c.title, left(trim(p_body), 140), '/pesan/' || a.id);
    n := n + 1;
  end loop;
  return n;
end $$;

-- Contact details revealed only after acceptance.
create or replace function public.get_contacts(p_app uuid)
returns json language plpgsql stable security definer set search_path = '' as $$
declare
  a public.applications;
  c public.calls;
  is_vol boolean;
  result json;
begin
  select * into a from public.applications where id = p_app;
  if a.id is null or not public.is_app_participant(p_app) then return null; end if;
  if a.status not in ('accepted', 'completed') then return null; end if;
  select * into c from public.calls where id = a.call_id;
  is_vol := a.volunteer_id = auth.uid();
  if is_vol then
    select json_build_object('phone', p.phone, 'name', s.pic_name) into result
    from public.profiles p join public.seekers s on s.id = p.id where p.id = c.seeker_id;
  else
    select json_build_object(
      'phone', p.phone,
      'name', vp.full_name,
      'emergency', case when c.load in ('berat', 'darurat') then (
        select json_build_object('contact_name', e.contact_name, 'relation', e.relation, 'contact_phone', e.contact_phone,
                                 'blood_type', e.blood_type, 'health_notes', e.health_notes)
        from public.volunteer_emergency e where e.volunteer_id = a.volunteer_id) end
    ) into result
    from public.profiles p join public.volunteer_private vp on vp.id = p.id where p.id = a.volunteer_id;
  end if;
  return result;
end $$;

-- Reviews -------------------------------------------------------------------

create or replace function public.submit_review(p_app uuid, p_rating int, p_aspects jsonb, p_body text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  a public.applications;
  c public.calls;
  reviewee uuid;
  other public.reviews;
  vis timestamptz;
begin
  select * into a from public.applications where id = p_app;
  if a.id is null or not public.is_app_participant(p_app) then raise exception 'Kegiatan tidak ditemukan'; end if;
  if a.status <> 'completed' then raise exception 'Ulasan hanya untuk kegiatan yang selesai'; end if;
  if a.attended_at + interval '14 days' < now() then raise exception 'Masa ulasan (14 hari) sudah lewat'; end if;
  select * into c from public.calls where id = a.call_id;
  reviewee := case when a.volunteer_id = auth.uid() then c.seeker_id else a.volunteer_id end;
  select * into other from public.reviews where application_id = p_app and reviewer_id = reviewee;
  vis := case when other.id is not null then now() else a.attended_at + interval '14 days' end;
  insert into public.reviews (application_id, reviewer_id, reviewee_id, rating, aspects, body, visible_at)
  values (p_app, auth.uid(), reviewee, p_rating, coalesce(p_aspects, '{}'), nullif(trim(p_body), ''), vis);
  if other.id is not null then
    update public.reviews set visible_at = now() where id = other.id;
  end if;
  perform public.notify(reviewee, 'review', 'Kamu mendapat ulasan',
    case when other.id is not null then 'Ulasan kedua pihak sekarang terlihat.' else 'Ulasan terlihat setelah kamu juga memberi ulasan, atau setelah 14 hari.' end,
    '/pesan/' || p_app);
end $$;

create or replace function public.reply_review(p_review uuid, p_reply text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.reviews set reply = nullif(trim(p_reply), '')
  where id = p_review and reviewee_id = auth.uid() and reply is null and visible_at <= now();
  if not found then raise exception 'Ulasan tidak bisa dibalas'; end if;
end $$;

-- Verification ----------------------------------------------------------------

create or replace function public.submit_verification(p_files text[], p_nik_last4 text, p_note text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  r public.user_role := public.my_role();
  f text;
  new_id uuid;
begin
  if r not in ('volunteer', 'seeker') then raise exception 'Akses ditolak'; end if;
  if coalesce(cardinality(p_files), 0) = 0 then raise exception 'Unggah dokumen terlebih dahulu'; end if;
  foreach f in array p_files loop
    if split_part(f, '/', 1) <> auth.uid()::text then raise exception 'Berkas tidak valid'; end if;
  end loop;
  if r = 'volunteer' and not exists (select 1 from public.volunteer_emergency where volunteer_id = auth.uid()) then
    raise exception 'Isi kontak darurat terlebih dahulu';
  end if;
  if exists (select 1 from public.verification_requests where user_id = auth.uid() and status = 'pending') then
    raise exception 'Pengajuanmu masih ditinjau';
  end if;
  insert into public.verification_requests (user_id, kind, files, nik_last4, note)
  values (auth.uid(), r::text, p_files, nullif(p_nik_last4, ''), nullif(trim(p_note), ''))
  returning verification_requests.id into new_id;
  return new_id;
end $$;

create or replace function public.admin_review_verification(p_id uuid, p_approve boolean, p_reason text)
returns text[] language plpgsql security definer set search_path = '' as $$
declare
  vr public.verification_requests;
begin
  if not public.is_admin() then raise exception 'Akses ditolak'; end if;
  select * into vr from public.verification_requests where id = p_id;
  if vr.id is null or vr.status <> 'pending' then raise exception 'Pengajuan tidak ditemukan atau sudah diproses'; end if;
  if not p_approve and coalesce(trim(p_reason), '') = '' then raise exception 'Alasan penolakan wajib diisi'; end if;
  update public.verification_requests
    set status = case when p_approve then 'approved'::public.verif_status else 'rejected'::public.verif_status end,
        reason = nullif(trim(p_reason), ''), reviewed_by = auth.uid(), reviewed_at = now(), files = '{}'
  where id = p_id;
  if vr.kind = 'seeker' then
    update public.seekers set verified = true where id = vr.user_id and p_approve;
  else
    perform public.recompute_volunteer_level(vr.user_id);
    perform public.compute_matches_for_volunteer(vr.user_id);
  end if;
  perform public.notify(vr.user_id, 'verification',
    case when p_approve then 'Verifikasi disetujui' else 'Verifikasi ditolak' end,
    case when p_approve then 'Akunmu kini terverifikasi.' else p_reason end,
    case when vr.kind = 'seeker' then '/p/verifikasi' else '/r/verifikasi' end);
  insert into public.admin_audit_log (admin_id, action, target, detail)
  values (auth.uid(), case when p_approve then 'verification.approve' else 'verification.reject' end, vr.user_id::text,
          jsonb_build_object('request', p_id, 'reason', p_reason));
  -- Caller deletes these identity files from storage right away.
  return vr.files;
end $$;

-- Admin moderation --------------------------------------------------------------

create or replace function public.admin_moderate_call(p_call uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare c public.calls;
begin
  if not public.is_admin() then raise exception 'Akses ditolak'; end if;
  select * into c from public.calls where id = p_call;
  update public.calls set status = 'dibatalkan', cancel_reason = 'Diturunkan admin: ' || p_reason where id = p_call;
  update public.applications set status = 'cancelled', cancel_reason = 'Diturunkan admin'
  where call_id = p_call and status in ('applied', 'invited', 'reviewing', 'accepted');
  delete from public.matches where call_id = p_call;
  perform public.notify(c.seeker_id, 'moderation', 'Panggilan diturunkan admin', c.title || ' — ' || p_reason, '/p/panggilan/' || p_call);
  insert into public.admin_audit_log (admin_id, action, target, detail)
  values (auth.uid(), 'call.takedown', p_call::text, jsonb_build_object('reason', p_reason));
end $$;

create or replace function public.admin_set_banned(p_user uuid, p_banned boolean, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Akses ditolak'; end if;
  if p_user = auth.uid() then raise exception 'Tidak bisa memblokir diri sendiri'; end if;
  update public.profiles set banned_at = case when p_banned then now() end where id = p_user and role <> 'admin';
  if p_banned then
    delete from public.matches where volunteer_id = p_user;
    update public.calls set status = 'ditutup' where seeker_id = p_user and status in ('aktif', 'penuh');
  end if;
  insert into public.admin_audit_log (admin_id, action, target, detail)
  values (auth.uid(), case when p_banned then 'user.ban' else 'user.unban' end, p_user::text, jsonb_build_object('reason', p_reason));
end $$;

create or replace function public.admin_resolve_report(p_report uuid, p_status text, p_note text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Akses ditolak'; end if;
  update public.reports set status = p_status, admin_note = p_note where id = p_report;
  insert into public.admin_audit_log (admin_id, action, target, detail)
  values (auth.uid(), 'report.' || p_status, p_report::text, jsonb_build_object('note', p_note));
end $$;

-- Scheduled housekeeping ------------------------------------------------------

create or replace function public.send_event_reminders()
returns int language plpgsql security definer set search_path = '' as $$
declare
  a record;
  n int := 0;
begin
  for a in
    select ap.id, ap.volunteer_id, c.title, c.start_time
    from public.applications ap join public.calls c on c.id = ap.call_id
    where ap.status = 'accepted' and c.start_date = (now() at time zone 'Asia/Jakarta')::date + 1
  loop
    perform public.notify(a.volunteer_id, 'reminder', 'Besok kamu bertugas',
      a.title || coalesce(' · mulai ' || to_char(a.start_time, 'HH24:MI'), ''), '/pesan/' || a.id);
    n := n + 1;
  end loop;
  return n;
end $$;
