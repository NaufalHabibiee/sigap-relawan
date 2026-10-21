-- Move RLS helper predicates out of the exposed `public` schema so they are no longer callable
-- through /rest/v1/rpc. Policies reference functions by OID, so they keep working; function bodies
-- that call the helpers by qualified name are rewritten below.
create schema if not exists private;
grant usage on schema private to anon, authenticated;

do $$
declare
  fn text;
  r record;
  def text;
  names text := 'is_admin|my_role|is_banned|is_app_participant|chat_blocked|chat_locked|seeker_has_applicant|seeker_has_accepted_heavy';
begin
  foreach fn in array string_to_array(names, '|') loop
    for r in select p.oid from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname = fn loop
      execute format('alter function %s set schema private', r.oid::regprocedure);
    end loop;
  end loop;

  for r in
    select p.oid from pg_proc p
    where p.pronamespace = 'public'::regnamespace and p.prokind = 'f'
      and p.prosrc ~ ('public\.(' || names || ')\(')
  loop
    def := pg_get_functiondef(r.oid);
    def := regexp_replace(def, 'public\.(' || names || ')\(', 'private.\1(', 'g');
    execute def;
  end loop;
end $$;
