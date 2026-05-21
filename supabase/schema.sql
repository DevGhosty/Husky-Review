-- Husky-Review Auth0 + Supabase persistence schema
-- Configure Supabase Authentication > Third-Party Auth > Auth0 before using these policies.
-- Auth0 must add the literal ID-token claim: role = 'authenticated'.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  auth0_user_id text primary key,
  display_name text not null default 'Sam Husky',
  major text not null default 'Business Administration',
  graduation_year text not null default '2027',
  prioritize_in_time boolean not null default true,
  show_verification_dates boolean not null default true,
  include_long_term boolean not null default true,
  deadline_reminders boolean not null default true,
  roadmap_alerts boolean not null default true,
  resource_updates boolean not null default true,
  email_digest boolean not null default false,
  target_role text not null default 'internship'
    check (target_role in ('internship', 'co-op', 'full-time')),
  activity_interests text[] not null default array['club', 'course', 'event'],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  auth0_user_id text not null,
  filename text not null,
  storage_path text not null unique,
  content_type text,
  size_bytes integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists resumes_auth0_user_id_created_at_idx
  on public.resumes (auth0_user_id, created_at desc);

grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, delete on public.resumes to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists resumes_set_updated_at on public.resumes;
create trigger resumes_set_updated_at
  before update on public.resumes
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.resumes enable row level security;

drop policy if exists "profiles_select_own_auth0_user" on public.profiles;
create policy "profiles_select_own_auth0_user"
  on public.profiles
  for select
  to authenticated
  using (auth0_user_id = (select auth.jwt() ->> 'sub'));

drop policy if exists "profiles_insert_own_auth0_user" on public.profiles;
create policy "profiles_insert_own_auth0_user"
  on public.profiles
  for insert
  to authenticated
  with check (auth0_user_id = (select auth.jwt() ->> 'sub'));

drop policy if exists "profiles_update_own_auth0_user" on public.profiles;
create policy "profiles_update_own_auth0_user"
  on public.profiles
  for update
  to authenticated
  using (auth0_user_id = (select auth.jwt() ->> 'sub'))
  with check (auth0_user_id = (select auth.jwt() ->> 'sub'));

drop policy if exists "resumes_select_own_auth0_user" on public.resumes;
create policy "resumes_select_own_auth0_user"
  on public.resumes
  for select
  to authenticated
  using (auth0_user_id = (select auth.jwt() ->> 'sub'));

drop policy if exists "resumes_insert_own_auth0_user" on public.resumes;
create policy "resumes_insert_own_auth0_user"
  on public.resumes
  for insert
  to authenticated
  with check (auth0_user_id = (select auth.jwt() ->> 'sub'));

drop policy if exists "resumes_delete_own_auth0_user" on public.resumes;
create policy "resumes_delete_own_auth0_user"
  on public.resumes
  for delete
  to authenticated
  using (auth0_user_id = (select auth.jwt() ->> 'sub'));

insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do update set public = false;

drop policy if exists "resume_objects_select_own_auth0_user" on storage.objects;
create policy "resume_objects_select_own_auth0_user"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub'));

drop policy if exists "resume_objects_insert_own_auth0_user" on storage.objects;
create policy "resume_objects_insert_own_auth0_user"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub'));

drop policy if exists "resume_objects_delete_own_auth0_user" on storage.objects;
create policy "resume_objects_delete_own_auth0_user"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub'));
