-- Demo data. All demo accounts: password "Relawan#2026" (admin: "SigapAdmin#2026").
-- Every demo calls/profile is marked with "(Contoh)" in its description.
do $$
declare
  first_names text[] := array['Andi','Budi','Citra','Dewi','Eko','Fajar','Gita','Hana','Indra','Joko','Kartika','Lukman','Maya','Nanda','Oki','Putri','Rizky','Sari','Teguh','Umi','Vina','Wahyu','Yoga','Zahra','Arif','Bella','Cahya','Dimas','Elsa','Farhan','Gilang','Hesti','Ilham','Jihan','Kevin','Laras','Miftah','Nisa','Rendra','Salsa','Taufik','Ulfa','Vicky','Wulan','Yusuf','Zaki','Ayu','Bagas','Dinda','Rafi'];
  last_names text[] := array['Pratama','Saputra','Lestari','Wijaya','Nugroho','Hidayat','Rahmawati','Santoso','Kurniawan','Permata','Siregar','Nasution','Wibowo','Utami','Setiawan','Maharani','Gunawan','Puspita','Syahputra','Anggraini'];
  city_names text[] := array['Jakarta Selatan','Jakarta Timur','Jakarta Utara','Bekasi','Depok','Bogor','Tangerang Selatan','Bandung','Cianjur','Sukabumi','Semarang','Demak','Yogyakarta','Sleman','Surabaya','Malang','Lumajang','Denpasar','Makassar','Medan'];
  bios text[] := array[
    'Mahasiswa yang suka kegiatan sosial akhir pekan.',
    'Karyawan swasta, ingin bermanfaat di waktu luang.',
    'Pernah jadi relawan bencana dan ingin terus membantu.',
    'Suka mengajar anak-anak dan berbagi ilmu.',
    'Content creator kecil-kecilan, senang bantu UMKM.',
    'Anggota komunitas lingkungan, rajin bersih pantai.',
    'Lulusan keperawatan, siap bantu layanan kesehatan.',
    'Fotografer lepas, senang mendokumentasikan kegiatan sosial.'];
  strengths_pool text[] := array['Tepat waktu','Cepat belajar','Komunikatif','Tahan kerja lapangan','Rapi dan teliti','Sabar dengan anak','Bisa memimpin tim kecil','Kuat fisik'];
  uid uuid;
  i int;
  email text;
  full_name text;
  cid int;
  pw text := extensions.crypt('Relawan#2026', extensions.gen_salt('bf'));
  sk int[];
  cats int[];
  r float8;
begin
  perform setseed(0.42);

  -- Admin
  uid := gen_random_uuid();
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', 'admin@sigap.id',
    extensions.crypt('SigapAdmin#2026', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"full_name":"Admin Sigap","role":"seeker"}', now(), now(), '', '', '', '');
  insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), uid, jsonb_build_object('sub', uid::text, 'email', 'admin@sigap.id', 'email_verified', true), 'email', uid::text, now(), now(), now());
  delete from public.seekers where id = uid;
  update public.profiles set role = 'admin', role_confirmed = true, phone = '081100000000', phone_verified = true where id = uid;

  -- Volunteers
  for i in 1..50 loop
    uid := gen_random_uuid();
    email := 'relawan' || lpad(i::text, 2, '0') || '@contoh.id';
    full_name := first_names[i] || ' ' || last_names[1 + (i * 7) % array_length(last_names, 1)];
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
    values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', email, pw, now(),
      '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name', full_name, 'role', 'volunteer'),
      now() - (random() * 90 || ' days')::interval, now(), '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), uid, jsonb_build_object('sub', uid::text, 'email', email, 'email_verified', true), 'email', uid::text, now(), now(), now());

    select id into cid from public.cities where name = city_names[1 + (i * 3) % array_length(city_names, 1)];
    update public.profiles set phone = '0812' || lpad((10000000 + i * 7919)::text, 8, '0'), phone_verified = true where id = uid;
    update public.volunteers set
      city_id = cid,
      bio = bios[1 + i % array_length(bios, 1)] || ' (Contoh)',
      strengths = array[strengths_pool[1 + i % 8], strengths_pool[1 + (i * 3) % 8]],
      mode = (array['keduanya','onsite','keduanya','online'])[1 + i % 4]::public.vol_mode,
      willing_travel = i % 3 <> 0,
      max_radius_km = case when i % 3 = 1 then 150 when i % 3 = 2 then null else 50 end,
      emergency_standby = i % 4 = 0,
      avatar_url = 'https://api.dicebear.com/9.x/notionists/svg?seed=' || first_names[i]
    where id = uid;
    update public.volunteer_private set
      birth_date = (current_date - ((18 + (i * 13) % 22) * 365 + i) * interval '1 day')::date,
      gender = case when i % 2 = 0 then 'P'::public.gender else 'L'::public.gender end
    where id = uid;

    select array_agg(id) into sk from (select id from public.skills order by md5(id::text || i::text) limit 3 + i % 4) s;
    insert into public.volunteer_skills (volunteer_id, skill_id, level)
      select uid, s, case when random() < 0.35 then 2 else 1 end from unnest(sk) s;
    select array_agg(id) into cats from (select id from public.categories order by md5(id::text || (i * 5)::text) limit 2 + i % 3) c;
    insert into public.volunteer_interests (volunteer_id, category_id) select uid, c from unnest(cats) c;
    -- Skill categories count as interests too, so matches feel coherent.
    insert into public.volunteer_interests (volunteer_id, category_id)
      select distinct uid, category_id from public.skills where id = any (sk) and category_id is not null
      on conflict do nothing;
    insert into public.volunteer_loads (volunteer_id, load) values (uid, 'ringan'), (uid, 'sedang');
    if i % 2 = 0 then insert into public.volunteer_loads values (uid, 'promosi'); end if;
    if i % 3 <> 2 then insert into public.volunteer_loads values (uid, 'berat'); end if;
    if i % 4 = 0 or i % 5 = 0 then insert into public.volunteer_loads values (uid, 'darurat'); end if;
    insert into public.volunteer_availability (volunteer_id, weekday, slot)
      select uid, d, s from generate_series(1, 7) d, unnest(array['pagi','siang','malam']::public.day_slot[]) s
      where (d >= 6) or ((d + i) % 3 = 0) or (s = 'malam' and i % 2 = 0);
    if i % 2 = 0 then
      insert into public.volunteer_socials values (uid, 'tiktok', lower(first_names[i]) || '.berbagi', 300 + (i * 977) % 25000);
    end if;
    if i % 6 = 0 then
      insert into public.volunteer_limitations values (uid, (select id from public.limitations where slug = 'ketinggian'));
    end if;
    if i % 7 = 0 then
      insert into public.volunteer_limitations values (uid, (select id from public.limitations where slug = 'angkat-berat'));
    end if;
    if i % 3 = 0 then
      insert into public.volunteer_experiences (volunteer_id, title, organizer, year, role)
      values (uid, 'Relawan posko banjir', 'Komunitas setempat', 2025, 'Logistik');
    end if;
    if i % 4 = 0 or i % 5 = 0 then
      insert into public.volunteer_emergency values (uid, 'Keluarga ' || last_names[1 + i % 20], 'Orang tua', '0813' || lpad((20000000 + i * 31)::text, 8, '0'),
        (array['A','B','AB','O'])[1 + i % 4], null);
      insert into public.verification_requests (user_id, kind, nik_last4, status, reviewed_at)
      values (uid, 'volunteer', lpad((i * 37 % 10000)::text, 4, '0'), 'approved', now());
    end if;
    perform public.recompute_volunteer_level(uid);
  end loop;
end $$;

-- Seekers
do $$
declare
  rec record;
  uid uuid;
  email text;
  pw text := extensions.crypt('Relawan#2026', extensions.gen_salt('bf'));
  n int := 0;
begin
  for rec in select * from (values
    ('Posko Peduli Demak', 'komunitas', 'Demak', true, 'Komunitas tanggap bencana di pesisir utara Jawa Tengah.'),
    ('Yayasan Cahaya Pesisir', 'lembaga', 'Jakarta Utara', true, 'Yayasan pendidikan untuk anak-anak nelayan.'),
    ('Rumah Relawan Cianjur', 'komunitas', 'Cianjur', true, 'Jaringan relawan lokal sejak gempa 2022.'),
    ('Glowlokal Skincare', 'perusahaan', 'Bandung', false, 'Brand skincare lokal yang mendukung UMKM.'),
    ('Lari Untuk Sesama', 'campaign', 'Bandung', true, 'Kampanye lari amal tahunan untuk beasiswa.'),
    ('Bank Sampah Hijau Sleman', 'komunitas', 'Sleman', false, 'Pengelolaan sampah berbasis warga.'),
    ('PT Nusantara Logistik', 'perusahaan', 'Surabaya', true, 'Program CSR distribusi bantuan.'),
    ('Panti Wreda Kasih Ibu', 'lembaga', 'Semarang', true, 'Panti lansia dengan 60 penghuni.'),
    ('Gerakan Mangrove Makassar', 'komunitas', 'Makassar', true, 'Restorasi pesisir Sulawesi Selatan.'),
    ('Kopi Kampung Kita', 'perusahaan', 'Malang', false, 'UMKM kopi lokal Malang.'),
    ('Rina Kusuma', 'individu', 'Depok', false, 'Mengadakan kelas membaca gratis di rumah.'),
    ('Masjid Al-Ikhlas Bekasi', 'lembaga', 'Bekasi', true, 'Kegiatan sosial dan pendidikan jamaah.'),
    ('Shelter Satwa Bali', 'lembaga', 'Denpasar', true, 'Penyelamatan anjing dan kucing terlantar.'),
    ('Data Untuk Desa', 'komunitas', 'Yogyakarta', false, 'Relawan data untuk desa.'),
    ('Tanggap Semeru', 'komunitas', 'Lumajang', true, 'Relawan siaga erupsi Semeru.')
  ) as t(name, type, city, verified, descr)
  loop
    n := n + 1;
    uid := gen_random_uuid();
    email := 'penyelenggara' || lpad(n::text, 2, '0') || '@contoh.id';
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
    values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', email, pw, now(),
      '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name', rec.name, 'role', 'seeker', 'seeker_type', rec.type),
      now() - interval '60 days', now(), '', '', '', '');
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), uid, jsonb_build_object('sub', uid::text, 'email', email, 'email_verified', true), 'email', uid::text, now(), now(), now());
    update public.profiles set phone = '0821' || lpad((30000000 + n * 4567)::text, 8, '0'), phone_verified = true where id = uid;
    update public.seekers set
      description = rec.descr || ' (Contoh)',
      city_id = (select id from public.cities where name = rec.city),
      verified = rec.verified,
      pic_name = 'Koordinator ' || split_part(rec.name, ' ', 1),
      pic_title = 'Koordinator relawan',
      logo_url = 'https://api.dicebear.com/9.x/shapes/svg?seed=' || replace(rec.name, ' ', '')
    where id = uid;
  end loop;
end $$;
