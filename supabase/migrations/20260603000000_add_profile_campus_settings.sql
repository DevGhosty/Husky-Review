alter table public.profiles
  add column if not exists campus text,
  add column if not exists include_other_campuses boolean not null default false,
  add column if not exists profile_completed_at timestamptz;

do $$
begin
  if not exists (
    select 1
      from pg_constraint
     where conname = 'profiles_campus_check'
       and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_campus_check
      check (campus is null or campus in ('seattle', 'bothell', 'tacoma'));
  end if;
end $$;

alter table public.activities
  add column if not exists campus text not null default 'bothell';

do $$
begin
  if not exists (
    select 1
      from pg_constraint
     where conname = 'activities_campus_check'
       and conrelid = 'public.activities'::regclass
  ) then
    alter table public.activities
      add constraint activities_campus_check
      check (campus in ('seattle', 'bothell', 'tacoma'));
  end if;
end $$;

alter table public.activities
  drop constraint if exists activities_name_key;

create unique index if not exists activities_campus_name_key
  on public.activities (campus, name);

create index if not exists activities_campus_active_idx
  on public.activities (campus, active);

alter table public.review_recommendations
  add column if not exists campus text;

do $$
begin
  if not exists (
    select 1
      from pg_constraint
     where conname = 'review_recommendations_campus_check'
       and conrelid = 'public.review_recommendations'::regclass
  ) then
    alter table public.review_recommendations
      add constraint review_recommendations_campus_check
      check (campus is null or campus in ('seattle', 'bothell', 'tacoma'));
  end if;
end $$;
