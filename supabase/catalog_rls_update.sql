-- Run this ONLY if course_sections and campus_orgs already exist in your project.
-- It replaces the old anon-accessible "public read" policy with authenticated-only access.
-- Safe to run more than once (drop policy if exists).

-- ── course_sections ───────────────────────────────────────────────────────────

drop policy if exists "public read"                         on public.course_sections;
drop policy if exists "service write"                       on public.course_sections;
drop policy if exists "course_sections_select_authenticated" on public.course_sections;
drop policy if exists "course_sections_write_service_role"  on public.course_sections;

create policy "course_sections_select_authenticated"
  on public.course_sections for select
  to authenticated
  using (true);

create policy "course_sections_write_service_role"
  on public.course_sections for all
  using (auth.role() = 'service_role');

grant select on public.course_sections to authenticated;

-- ── campus_orgs ───────────────────────────────────────────────────────────────

drop policy if exists "public read"                      on public.campus_orgs;
drop policy if exists "service write"                    on public.campus_orgs;
drop policy if exists "campus_orgs_select_authenticated" on public.campus_orgs;
drop policy if exists "campus_orgs_write_service_role"   on public.campus_orgs;

create policy "campus_orgs_select_authenticated"
  on public.campus_orgs for select
  to authenticated
  using (true);

create policy "campus_orgs_write_service_role"
  on public.campus_orgs for all
  using (auth.role() = 'service_role');

grant select on public.campus_orgs to authenticated;
