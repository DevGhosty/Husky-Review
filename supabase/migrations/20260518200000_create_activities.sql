-- Stores manually curated and verified UW activities (clubs, courses, research,
-- fellowships, programs, events). Populated by seed.sql and maintained by the team.
-- Unique on campus + name so upserts are idempotent.

create table if not exists public.activities (
  id                uuid        primary key default gen_random_uuid(),
  campus            text        not null default 'bothell'
    check (campus in ('seattle', 'bothell', 'tacoma')),
  name              text        not null,
  category          text        not null
    check (category in ('club', 'course', 'research', 'fellowship', 'program', 'event')),
  description       text,
  skills            text[]      not null default '{}',
  source_url        text        not null,
  active            boolean     not null default true,
  last_verified     date,
  verified_by       text,
  time_commitment   text,
  duration          text,
  cost              text,
  registration_info text,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists activities_category_idx on public.activities (category);
create index if not exists activities_active_idx   on public.activities (active);
create index if not exists activities_campus_active_idx on public.activities (campus, active);
create unique index if not exists activities_campus_name_key on public.activities (campus, name);

alter table public.activities enable row level security;

-- Authenticated @uw.edu users may read all active catalog entries.
drop policy if exists "activities_select_authenticated" on public.activities;
create policy "activities_select_authenticated"
  on public.activities for select
  to authenticated
  using (true);

-- Only the service role (Vercel API / scrapers) may write.
drop policy if exists "activities_write_service_role" on public.activities;
create policy "activities_write_service_role"
  on public.activities for all
  using (auth.role() = 'service_role');

grant select on public.activities to authenticated;
