-- Index every foreign key the linter flagged.
create index if not exists admin_audit_log_admin_id_idx on public.admin_audit_log (admin_id);
create index if not exists call_involves_limitation_id_idx on public.call_involves (limitation_id);
create index if not exists call_skills_skill_id_idx on public.call_skills (skill_id);
create index if not exists calls_category_id_idx on public.calls (category_id);
create index if not exists calls_city_id_idx on public.calls (city_id);
create index if not exists messages_sender_id_idx on public.messages (sender_id);
create index if not exists reports_reporter_id_idx on public.reports (reporter_id);
create index if not exists reviews_reviewer_id_idx on public.reviews (reviewer_id);
create index if not exists saved_calls_call_id_idx on public.saved_calls (call_id);
create index if not exists seekers_city_id_idx on public.seekers (city_id);
create index if not exists skills_category_id_idx on public.skills (category_id);
create index if not exists user_blocks_blocked_id_idx on public.user_blocks (blocked_id);
create index if not exists verification_requests_reviewed_by_idx on public.verification_requests (reviewed_by);
create index if not exists volunteer_documents_volunteer_id_idx on public.volunteer_documents (volunteer_id);
create index if not exists volunteer_experiences_volunteer_id_idx on public.volunteer_experiences (volunteer_id);
create index if not exists volunteer_interests_category_id_idx on public.volunteer_interests (category_id);
create index if not exists volunteer_limitations_limitation_id_idx on public.volunteer_limitations (limitation_id);
create index if not exists volunteer_skills_skill_id_idx on public.volunteer_skills (skill_id);
create index if not exists volunteers_city_id_idx on public.volunteers (city_id);

-- Wrap auth.uid() in (select ...) so Postgres evaluates it once per query instead of once per row.
do $$
declare
  p record;
  q text;
  w text;
  stmt text;
begin
  for p in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and (coalesce(qual, '') || coalesce(with_check, '')) ~ 'auth\.uid\(\)'
      and (coalesce(qual, '') || coalesce(with_check, '')) !~ '(?i)select auth\.uid\(\)'
  loop
    q := replace(p.qual, 'auth.uid()', '(select auth.uid())');
    w := replace(p.with_check, 'auth.uid()', '(select auth.uid())');
    stmt := format('alter policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
    if q is not null then stmt := stmt || ' using (' || q || ')'; end if;
    if w is not null then stmt := stmt || ' with check (' || w || ')'; end if;
    execute stmt;
  end loop;
end $$;
