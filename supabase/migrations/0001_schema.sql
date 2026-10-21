-- Core schema for the volunteer matching platform.

create type public.user_role as enum ('volunteer', 'seeker', 'admin');
create type public.load_level as enum ('ringan', 'promosi', 'sedang', 'berat', 'darurat');
create type public.work_mode as enum ('onsite', 'online', 'hybrid');
create type public.vol_mode as enum ('onsite', 'online', 'keduanya');
create type public.call_status as enum ('draf', 'aktif', 'penuh', 'ditutup', 'selesai', 'dibatalkan');
create type public.app_status as enum ('applied', 'invited', 'reviewing', 'accepted', 'rejected', 'declined', 'expired', 'cancelled', 'completed', 'no_show');
create type public.seeker_type as enum ('perusahaan', 'lembaga', 'komunitas', 'campaign', 'individu');
create type public.verif_status as enum ('pending', 'approved', 'rejected');
create type public.day_slot as enum ('pagi', 'siang', 'malam');
create type public.gender as enum ('L', 'P');

-- Master data -------------------------------------------------------------

create table public.cities (
  id serial primary key,
  name text not null,
  province text not null,
  lat double precision not null,
  lng double precision not null,
  unique (name, province)
);

create table public.categories (
  id serial primary key,
  slug text not null unique,
  name text not null,
  sort smallint not null default 0
);

create table public.skills (
  id serial primary key,
  slug text not null unique,
  name text not null,
  category_id int references public.categories (id) on delete set null
);

create table public.limitations (
  id serial primary key,
  slug text not null unique,
  name text not null,
  task_label text not null
);

create table public.app_settings (
  key text primary key,
  value jsonb not null
);

-- Accounts ----------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null,
  role_confirmed boolean not null default false,
  phone text,
  phone_verified boolean not null default false,
  banned_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.volunteers (
  id uuid primary key references public.profiles (id) on delete cascade,
  slug text not null unique,
  nickname text,
  avatar_url text,
  city_id int references public.cities (id),
  bio text check (char_length(bio) <= 300),
  strengths text[] not null default '{}' check (cardinality(strengths) <= 5),
  mode public.vol_mode not null default 'keduanya',
  willing_travel boolean not null default false,
  max_radius_km int check (max_radius_km between 1 and 5000),
  emergency_standby boolean not null default false,
  paused_until date,
  muted_categories int[] not null default '{}',
  verification_level smallint not null default 0,
  profile_complete boolean not null default false,
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.volunteer_private (
  id uuid primary key references public.volunteers (id) on delete cascade,
  full_name text,
  birth_date date check (birth_date <= current_date - interval '17 years'),
  gender public.gender,
  limitation_note text check (char_length(limitation_note) <= 500),
  cv_path text
);

create table public.volunteer_skills (
  volunteer_id uuid not null references public.volunteers (id) on delete cascade,
  skill_id int not null references public.skills (id) on delete cascade,
  level smallint not null default 1 check (level in (1, 2)),
  primary key (volunteer_id, skill_id)
);

create table public.volunteer_limitations (
  volunteer_id uuid not null references public.volunteers (id) on delete cascade,
  limitation_id int not null references public.limitations (id) on delete cascade,
  primary key (volunteer_id, limitation_id)
);

create table public.volunteer_interests (
  volunteer_id uuid not null references public.volunteers (id) on delete cascade,
  category_id int not null references public.categories (id) on delete cascade,
  primary key (volunteer_id, category_id)
);

create table public.volunteer_loads (
  volunteer_id uuid not null references public.volunteers (id) on delete cascade,
  load public.load_level not null,
  primary key (volunteer_id, load)
);

create table public.volunteer_availability (
  volunteer_id uuid not null references public.volunteers (id) on delete cascade,
  weekday smallint not null check (weekday between 1 and 7),
  slot public.day_slot not null,
  primary key (volunteer_id, weekday, slot)
);

create table public.volunteer_socials (
  volunteer_id uuid not null references public.volunteers (id) on delete cascade,
  platform text not null check (platform in ('tiktok', 'instagram', 'youtube')),
  handle text not null,
  followers int not null default 0 check (followers >= 0),
  primary key (volunteer_id, platform)
);

create table public.volunteer_experiences (
  id uuid primary key default gen_random_uuid(),
  volunteer_id uuid not null references public.volunteers (id) on delete cascade,
  title text not null,
  organizer text,
  year smallint check (year between 1970 and 2100),
  role text
);

create table public.volunteer_documents (
  id uuid primary key default gen_random_uuid(),
  volunteer_id uuid not null references public.volunteers (id) on delete cascade,
  label text not null,
  path text not null,
  created_at timestamptz not null default now()
);

create table public.volunteer_emergency (
  volunteer_id uuid primary key references public.volunteers (id) on delete cascade,
  contact_name text not null,
  relation text not null,
  contact_phone text not null,
  blood_type text check (blood_type in ('A', 'B', 'AB', 'O', 'tidak tahu')),
  health_notes text check (char_length(health_notes) <= 500)
);

create table public.seekers (
  id uuid primary key references public.profiles (id) on delete cascade,
  slug text not null unique,
  type public.seeker_type not null default 'individu',
  org_name text not null,
  logo_url text,
  description text check (char_length(description) <= 2000),
  city_id int references public.cities (id),
  website text,
  instagram text,
  pic_name text,
  pic_title text,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('volunteer', 'seeker')),
  files text[] not null default '{}',
  nik_last4 text check (nik_last4 ~ '^[0-9]{4}$'),
  note text,
  status public.verif_status not null default 'pending',
  reason text,
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index verification_one_pending on public.verification_requests (user_id) where status = 'pending';

create table public.phone_otps (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  phone text not null,
  code_hash text not null,
  attempts smallint not null default 0,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Calls (volunteer requests) ----------------------------------------------

create table public.calls (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  seeker_id uuid not null references public.seekers (id) on delete cascade,
  title text not null check (char_length(title) between 5 and 120),
  category_id int not null references public.categories (id),
  load public.load_level not null,
  description text not null check (char_length(description) <= 5000),
  cover_url text,
  mode public.work_mode not null default 'onsite',
  city_id int references public.cities (id),
  address text,
  start_date date not null,
  end_date date not null,
  start_time time,
  end_time time,
  quota int not null check (quota between 1 and 1000),
  deadline date not null,
  min_level smallint not null default 1,
  age_min smallint check (age_min between 17 and 99),
  age_max smallint check (age_max between 17 and 99),
  gender public.gender,
  gender_reason text,
  min_followers int check (min_followers >= 0),
  benefits text[] not null default '{}',
  allowance int check (allowance >= 0),
  commission_pct numeric(5, 2) check (commission_pct between 0 and 100),
  need_cv boolean not null default false,
  questions text[] not null default '{}' check (cardinality(questions) <= 3),
  is_emergency boolean not null default false,
  status public.call_status not null default 'draf',
  cancel_reason text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date),
  check (mode = 'online' or city_id is not null)
);
create index calls_status_idx on public.calls (status, deadline);
create index calls_seeker_idx on public.calls (seeker_id);

create table public.call_skills (
  call_id uuid not null references public.calls (id) on delete cascade,
  skill_id int not null references public.skills (id) on delete cascade,
  required boolean not null default false,
  primary key (call_id, skill_id)
);

create table public.call_involves (
  call_id uuid not null references public.calls (id) on delete cascade,
  limitation_id int not null references public.limitations (id) on delete cascade,
  primary key (call_id, limitation_id)
);

create table public.matches (
  call_id uuid not null references public.calls (id) on delete cascade,
  volunteer_id uuid not null references public.volunteers (id) on delete cascade,
  score smallint not null,
  reasons text[] not null default '{}',
  notified_at timestamptz,
  dismissed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (call_id, volunteer_id)
);
create index matches_volunteer_idx on public.matches (volunteer_id, score desc);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references public.calls (id) on delete cascade,
  volunteer_id uuid not null references public.volunteers (id) on delete cascade,
  source text not null check (source in ('apply', 'invite')),
  status public.app_status not null,
  message text check (char_length(message) <= 500),
  answers text[] not null default '{}',
  cv_path text,
  expires_at timestamptz,
  cancel_reason text,
  decided_at timestamptz,
  attended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (call_id, volunteer_id)
);
create index applications_volunteer_idx on public.applications (volunteer_id, status);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  sender_id uuid references public.profiles (id) on delete set null,
  kind text not null default 'user' check (kind in ('user', 'system', 'announcement')),
  body text check (char_length(body) <= 2000),
  attachment_path text,
  attachment_name text,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  check (body is not null or attachment_path is not null)
);
create index messages_app_idx on public.messages (application_id, created_at);

create table public.user_blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  reviewer_id uuid not null references public.profiles (id) on delete cascade,
  reviewee_id uuid not null references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  aspects jsonb not null default '{}',
  body text check (char_length(body) <= 1000),
  reply text check (char_length(reply) <= 1000),
  visible_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (application_id, reviewer_id)
);
create index reviews_reviewee_idx on public.reviews (reviewee_id, visible_at);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type text not null check (target_type in ('user', 'call', 'review', 'message')),
  target_id uuid not null,
  reason text not null check (char_length(reason) between 5 and 1000),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  admin_note text,
  created_at timestamptz not null default now()
);

create table public.saved_calls (
  volunteer_id uuid not null references public.volunteers (id) on delete cascade,
  call_id uuid not null references public.calls (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (volunteer_id, call_id)
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  link text,
  is_disaster boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.admin_audit_log (
  id bigserial primary key,
  admin_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target text,
  detail jsonb,
  created_at timestamptz not null default now()
);
