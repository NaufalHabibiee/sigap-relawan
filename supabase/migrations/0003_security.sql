-- Row level security, column grants, storage, realtime, scheduled jobs.

do $$
declare t text;
begin
  foreach t in array array[
    'cities','categories','skills','limitations','app_settings','profiles','volunteers','volunteer_private',
    'volunteer_skills','volunteer_limitations','volunteer_interests','volunteer_loads','volunteer_availability',
    'volunteer_socials','volunteer_experiences','volunteer_documents','volunteer_emergency','seekers',
    'verification_requests','phone_otps','calls','call_skills','call_involves','matches','applications',
    'messages','user_blocks','notifications','reviews','reports','saved_calls','announcements','admin_audit_log'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke insert, update, delete on public.%I from anon', t);
  end loop;
end $$;

-- Internal functions are never callable from the API.
revoke execute on function
  public.notify(uuid, text, text, text, text),
  public.system_message(uuid, text),
  public.store_match(public.calls, public.volunteers, int, text[]),
  public.match_eval(public.calls, public.volunteers),
  public.compute_matches_for_call(uuid),
  public.compute_matches_for_volunteer(uuid),
  public.recompute_volunteer_level(uuid),
  public.sync_call_capacity(uuid),
  public.expire_invites(),
  public.send_event_reminders(),
  public.handle_new_user(),
  public.calls_guard(),
  public.on_message_insert()
from public, anon, authenticated;

-- Master data: readable by everyone, writable by admins.
create policy "read cities" on public.cities for select using (true);
create policy "admin cities" on public.cities for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "read categories" on public.categories for select using (true);
create policy "admin categories" on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "read skills" on public.skills for select using (true);
create policy "admin skills" on public.skills for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "read limitations" on public.limitations for select using (true);
create policy "admin limitations" on public.limitations for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin settings" on public.app_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Profiles: own row or admin. All writes go through RPCs.
revoke insert, update, delete on public.profiles from authenticated;
create policy "own profile" on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());

-- Volunteers: public card data.
revoke insert, delete, update on public.volunteers from authenticated;
grant update (nickname, avatar_url, city_id, bio, strengths, mode, willing_travel, max_radius_km,
              emergency_standby, paused_until, muted_categories) on public.volunteers to authenticated;
create or replace function public.is_banned(p_user uuid)
returns boolean language sql stable security definer set search_path = '' as $fn$
  select exists (select 1 from public.profiles where id = p_user and banned_at is not null);
$fn$;

create policy "read volunteers" on public.volunteers for select using (not public.is_banned(id) or public.is_admin());
create policy "update own volunteer" on public.volunteers for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

revoke insert, delete, update on public.volunteer_private from authenticated;
grant update (full_name, birth_date, gender, limitation_note, cv_path) on public.volunteer_private to authenticated;
create policy "read private" on public.volunteer_private for select to authenticated
  using (id = auth.uid() or public.is_admin() or public.seeker_has_applicant(id));
create policy "update own private" on public.volunteer_private for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Child tables owned by a volunteer.
create policy "read skills of volunteers" on public.volunteer_skills for select using (true);
create policy "own skills" on public.volunteer_skills for all to authenticated using (volunteer_id = auth.uid()) with check (volunteer_id = auth.uid());
create policy "read interests" on public.volunteer_interests for select using (true);
create policy "own interests" on public.volunteer_interests for all to authenticated using (volunteer_id = auth.uid()) with check (volunteer_id = auth.uid());
create policy "read loads" on public.volunteer_loads for select using (true);
create policy "own loads" on public.volunteer_loads for all to authenticated using (volunteer_id = auth.uid()) with check (volunteer_id = auth.uid());
create policy "read availability" on public.volunteer_availability for select using (true);
create policy "own availability" on public.volunteer_availability for all to authenticated using (volunteer_id = auth.uid()) with check (volunteer_id = auth.uid());
create policy "read experiences" on public.volunteer_experiences for select using (true);
create policy "own experiences" on public.volunteer_experiences for all to authenticated using (volunteer_id = auth.uid()) with check (volunteer_id = auth.uid());

create policy "read limitations of applicants" on public.volunteer_limitations for select to authenticated
  using (volunteer_id = auth.uid() or public.is_admin() or public.seeker_has_applicant(volunteer_id));
create policy "own limitations" on public.volunteer_limitations for all to authenticated using (volunteer_id = auth.uid()) with check (volunteer_id = auth.uid());
create policy "read socials of applicants" on public.volunteer_socials for select to authenticated
  using (volunteer_id = auth.uid() or public.is_admin() or public.seeker_has_applicant(volunteer_id));
create policy "own socials" on public.volunteer_socials for all to authenticated using (volunteer_id = auth.uid()) with check (volunteer_id = auth.uid());
create policy "read documents of applicants" on public.volunteer_documents for select to authenticated
  using (volunteer_id = auth.uid() or public.is_admin() or public.seeker_has_applicant(volunteer_id));
create policy "own documents" on public.volunteer_documents for all to authenticated using (volunteer_id = auth.uid()) with check (volunteer_id = auth.uid());
create policy "read emergency" on public.volunteer_emergency for select to authenticated
  using (volunteer_id = auth.uid() or public.is_admin() or public.seeker_has_accepted_heavy(volunteer_id));
create policy "own emergency" on public.volunteer_emergency for all to authenticated using (volunteer_id = auth.uid()) with check (volunteer_id = auth.uid());

-- Seekers.
revoke insert, delete, update on public.seekers from authenticated;
grant update (type, org_name, logo_url, description, city_id, website, instagram, pic_name, pic_title) on public.seekers to authenticated;
create policy "read seekers" on public.seekers for select using (not public.is_banned(id) or public.is_admin());
create policy "update own seeker" on public.seekers for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Verification requests: created via RPC, read by owner/admin.
revoke insert, update, delete on public.verification_requests from authenticated;
create policy "read own verification" on public.verification_requests for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

revoke all on public.phone_otps from authenticated;

-- Calls.
revoke insert, update, delete on public.calls from authenticated;
grant insert (seeker_id, title, category_id, load, description, cover_url, mode, city_id, address, start_date, end_date,
              start_time, end_time, quota, deadline, min_level, age_min, age_max, gender, gender_reason, min_followers,
              benefits, allowance, commission_pct, need_cv, questions, is_emergency) on public.calls to authenticated;
grant update (title, category_id, load, description, cover_url, mode, city_id, address, start_date, end_date,
              start_time, end_time, quota, deadline, min_level, age_min, age_max, gender, gender_reason, min_followers,
              benefits, allowance, commission_pct, need_cv, questions, is_emergency) on public.calls to authenticated;
grant delete on public.calls to authenticated;
create policy "read calls" on public.calls for select using (
  status <> 'draf' or seeker_id = auth.uid() or public.is_admin()
);
create policy "insert own calls" on public.calls for insert to authenticated
  with check (seeker_id = auth.uid() and public.my_role() = 'seeker');
create policy "update own calls" on public.calls for update to authenticated
  using (seeker_id = auth.uid() and status in ('draf', 'aktif', 'penuh'))
  with check (seeker_id = auth.uid());
create policy "delete own drafts" on public.calls for delete to authenticated
  using (seeker_id = auth.uid() and status = 'draf');

create policy "read call skills" on public.call_skills for select using (true);
create policy "own call skills" on public.call_skills for all to authenticated
  using (exists (select 1 from public.calls c where c.id = call_id and c.seeker_id = auth.uid() and c.status in ('draf', 'aktif', 'penuh')))
  with check (exists (select 1 from public.calls c where c.id = call_id and c.seeker_id = auth.uid() and c.status in ('draf', 'aktif', 'penuh')));
create policy "read call involves" on public.call_involves for select using (true);
create policy "own call involves" on public.call_involves for all to authenticated
  using (exists (select 1 from public.calls c where c.id = call_id and c.seeker_id = auth.uid() and c.status in ('draf', 'aktif', 'penuh')))
  with check (exists (select 1 from public.calls c where c.id = call_id and c.seeker_id = auth.uid() and c.status in ('draf', 'aktif', 'penuh')));

-- Matches: volunteer sees own; seeker sees matches of own calls.
revoke insert, delete, update on public.matches from authenticated;
grant update (dismissed) on public.matches to authenticated;
create policy "read matches" on public.matches for select to authenticated using (
  volunteer_id = auth.uid() or public.is_admin()
  or exists (select 1 from public.calls c where c.id = call_id and c.seeker_id = auth.uid())
);
create policy "dismiss own match" on public.matches for update to authenticated
  using (volunteer_id = auth.uid()) with check (volunteer_id = auth.uid());

-- Applications: RPC only for writes.
revoke insert, update, delete on public.applications from authenticated;
create policy "read applications" on public.applications for select to authenticated using (
  volunteer_id = auth.uid() or public.is_admin()
  or exists (select 1 from public.calls c where c.id = call_id and c.seeker_id = auth.uid())
);

-- Messages.
revoke update, delete on public.messages from authenticated;
revoke insert on public.messages from authenticated;
grant insert (application_id, sender_id, body, attachment_path, attachment_name) on public.messages to authenticated;
create policy "read messages" on public.messages for select to authenticated
  using (public.is_app_participant(application_id) or public.is_admin());
create policy "send messages" on public.messages for insert to authenticated with check (
  sender_id = auth.uid() and kind = 'user'
  and public.is_app_participant(application_id)
  and not coalesce(public.chat_locked(application_id), true)
  and not public.chat_blocked(application_id)
  and public.my_role() is not null
);

create policy "own blocks" on public.user_blocks for all to authenticated
  using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

-- Notifications.
revoke insert, delete, update on public.notifications from authenticated;
grant update (read_at) on public.notifications to authenticated;
create policy "read own notifications" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "mark own notifications" on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Reviews: blind until visible_at.
revoke insert, update, delete on public.reviews from authenticated;
create policy "read reviews" on public.reviews for select using (
  visible_at <= now() or reviewer_id = auth.uid() or public.is_admin()
);

-- Reports.
revoke update, delete on public.reports from authenticated;
create policy "file report" on public.reports for insert to authenticated
  with check (reporter_id = auth.uid() and status = 'open' and admin_note is null);
create policy "read reports" on public.reports for select to authenticated
  using (reporter_id = auth.uid() or public.is_admin());

create policy "own saved" on public.saved_calls for all to authenticated
  using (volunteer_id = auth.uid()) with check (volunteer_id = auth.uid());

create policy "read announcements" on public.announcements for select using (active or public.is_admin());
create policy "admin announcements" on public.announcements for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "admin audit" on public.admin_audit_log for select to authenticated using (public.is_admin());

-- Storage ---------------------------------------------------------------------
-- public-media: avatars, logos, covers under <uid>/...
-- private-docs: <uid>/cv|cert|ktp|legal/... and chat/<application_id>/...

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('public-media', 'public-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('private-docs', 'private-docs', false, 5242880, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "media upload own" on storage.objects for insert to authenticated
  with check (bucket_id = 'public-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "media update own" on storage.objects for update to authenticated
  using (bucket_id = 'public-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "media delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'public-media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "docs upload own" on storage.objects for insert to authenticated with check (
  bucket_id = 'private-docs' and (
    ((storage.foldername(name))[1] = auth.uid()::text and (storage.foldername(name))[2] in ('cv', 'cert', 'ktp', 'legal'))
    or ((storage.foldername(name))[1] = 'chat' and public.is_app_participant(((storage.foldername(name))[2])::uuid))
  )
);
create policy "docs read" on storage.objects for select to authenticated using (
  bucket_id = 'private-docs' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin()
    or ((storage.foldername(name))[1] = 'chat' and public.is_app_participant(((storage.foldername(name))[2])::uuid))
    or ((storage.foldername(name))[2] in ('cv', 'cert')
        and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
        and public.seeker_has_applicant(((storage.foldername(name))[1])::uuid))
  )
);
create policy "docs delete own or admin" on storage.objects for delete to authenticated using (
  bucket_id = 'private-docs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);

-- Realtime ----------------------------------------------------------------------
alter publication supabase_realtime add table public.messages, public.notifications;

-- Scheduled jobs --------------------------------------------------------------
create extension if not exists pg_cron;
select cron.schedule('expire-invites', '*/10 * * * *', $$select public.expire_invites()$$);
-- 01:00 UTC = 08:00 WIB
select cron.schedule('event-reminders', '0 1 * * *', $$select public.send_event_reminders()$$);
select cron.schedule('drop-stale-matches', '30 17 * * *', $$delete from public.matches m using public.calls c where c.id = m.call_id and c.deadline < current_date$$);

insert into public.app_settings (key, value) values ('demo_otp', 'true') on conflict do nothing;
