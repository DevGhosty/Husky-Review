create table if not exists public.review_upload_limits (
  auth0_user_id text primary key,
  window_start timestamptz not null default now(),
  upload_count integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.review_ai_usage_limits (
  auth0_user_id text primary key,
  window_start timestamptz not null default now(),
  review_count integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  auth0_user_id text not null,
  resume_id uuid not null references public.resumes(id) on delete cascade,
  title text not null,
  role text not null,
  job_description text not null,
  job_posting_url text,
  deadline date,
  match_score integer not null default 0,
  ai_provider text not null default 'deterministic'
    check (ai_provider in ('app-key', 'user-key', 'deterministic')),
  analysis jsonb not null default '{}'::jsonb,
  selected_recommendation_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.review_recommendations (
  id text not null,
  review_id uuid not null references public.reviews(id) on delete cascade,
  activity_id uuid,
  name text not null,
  recommendation_group text not null check (recommendation_group in ('in-time', 'next-time')),
  activity_type text not null check (activity_type in ('club', 'course', 'event', 'fellowship', 'project', 'research')),
  why_it_helps text not null,
  tags text[] not null default '{}',
  active boolean not null default true,
  last_verified date,
  confidence integer not null default 0,
  source_label text not null,
  roadmap_week integer not null default 1,
  roadmap_action text not null,
  selected boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (review_id, id)
);

create table if not exists public.review_roadmap_actions (
  id text not null,
  review_id uuid not null references public.reviews(id) on delete cascade,
  week integer not null,
  text text not null,
  detail text not null,
  created_at timestamptz not null default now(),
  primary key (review_id, id)
);

create index if not exists reviews_auth0_user_id_created_at_idx
  on public.reviews (auth0_user_id, created_at desc);

create index if not exists review_recommendations_review_id_idx
  on public.review_recommendations (review_id);

create index if not exists review_roadmap_actions_review_id_week_idx
  on public.review_roadmap_actions (review_id, week);

drop trigger if exists reviews_set_updated_at on public.reviews;
create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

alter table public.review_upload_limits enable row level security;
alter table public.review_ai_usage_limits enable row level security;
alter table public.reviews enable row level security;
alter table public.review_recommendations enable row level security;
alter table public.review_roadmap_actions enable row level security;

grant select, insert, update on public.review_upload_limits to authenticated;
grant select, insert, update on public.review_ai_usage_limits to service_role;
grant select, insert, update, delete on public.reviews to authenticated;
grant select, insert, update, delete on public.review_recommendations to authenticated;
grant select, insert, delete on public.review_roadmap_actions to authenticated;

drop policy if exists "review_upload_limits_own_auth0_user" on public.review_upload_limits;
create policy "review_upload_limits_own_auth0_user"
  on public.review_upload_limits
  for all
  to authenticated
  using (auth0_user_id = (select auth.jwt() ->> 'sub'))
  with check (auth0_user_id = (select auth.jwt() ->> 'sub'));

drop policy if exists "review_ai_usage_limits_service_role" on public.review_ai_usage_limits;
create policy "review_ai_usage_limits_service_role"
  on public.review_ai_usage_limits
  for all
  to service_role
  using (true)
  with check (true);

create or replace function public.consume_weekly_review_quota(
  p_auth0_user_id text,
  p_limit integer default 2
)
returns table (
  allowed boolean,
  remaining integer,
  window_start timestamptz,
  reset_at timestamptz
)
language plpgsql
as $$
declare
  v_row public.review_ai_usage_limits%rowtype;
begin
  insert into public.review_ai_usage_limits (auth0_user_id, window_start, review_count)
  values (p_auth0_user_id, now(), 0)
  on conflict (auth0_user_id) do nothing;

  update public.review_ai_usage_limits
     set window_start = case
           when now() - public.review_ai_usage_limits.window_start >= interval '7 days'
             then now()
           else public.review_ai_usage_limits.window_start
         end,
         review_count = case
           when now() - public.review_ai_usage_limits.window_start >= interval '7 days'
             then 1
           else public.review_ai_usage_limits.review_count + 1
         end,
         updated_at = now()
   where auth0_user_id = p_auth0_user_id
     and (
       now() - public.review_ai_usage_limits.window_start >= interval '7 days'
       or public.review_ai_usage_limits.review_count < p_limit
     )
   returning * into v_row;

  if found then
    allowed := true;
    remaining := greatest(p_limit - v_row.review_count, 0);
    window_start := v_row.window_start;
    reset_at := v_row.window_start + interval '7 days';
    return next;
    return;
  end if;

  select * into v_row
    from public.review_ai_usage_limits
    where auth0_user_id = p_auth0_user_id;

  allowed := false;
  remaining := 0;
  window_start := v_row.window_start;
  reset_at := v_row.window_start + interval '7 days';
  return next;
end;
$$;

revoke all on function public.consume_weekly_review_quota(text, integer) from public;
revoke all on function public.consume_weekly_review_quota(text, integer) from anon;
revoke all on function public.consume_weekly_review_quota(text, integer) from authenticated;
grant execute on function public.consume_weekly_review_quota(text, integer) to service_role;

create or replace function public.check_weekly_review_quota(
  p_auth0_user_id text,
  p_limit integer default 2
)
returns table (
  allowed boolean,
  remaining integer,
  window_start timestamptz,
  reset_at timestamptz
)
language sql
as $$
  select
    case
      when row_data.auth0_user_id is null then true
      when now() - row_data.window_start >= interval '7 days' then true
      else row_data.review_count < p_limit
    end as allowed,
    case
      when row_data.auth0_user_id is null then p_limit
      when now() - row_data.window_start >= interval '7 days' then p_limit
      else greatest(p_limit - row_data.review_count, 0)
    end as remaining,
    coalesce(row_data.window_start, now()) as window_start,
    case
      when row_data.auth0_user_id is null then now() + interval '7 days'
      when now() - row_data.window_start >= interval '7 days' then now() + interval '7 days'
      else row_data.window_start + interval '7 days'
    end as reset_at
  from (select 1) seed
  left join public.review_ai_usage_limits row_data
    on row_data.auth0_user_id = p_auth0_user_id;
$$;

revoke all on function public.check_weekly_review_quota(text, integer) from public;
revoke all on function public.check_weekly_review_quota(text, integer) from anon;
revoke all on function public.check_weekly_review_quota(text, integer) from authenticated;
grant execute on function public.check_weekly_review_quota(text, integer) to service_role;

drop policy if exists "reviews_select_own_auth0_user" on public.reviews;
create policy "reviews_select_own_auth0_user"
  on public.reviews
  for select
  to authenticated
  using (auth0_user_id = (select auth.jwt() ->> 'sub'));

drop policy if exists "reviews_insert_own_auth0_user" on public.reviews;
create policy "reviews_insert_own_auth0_user"
  on public.reviews
  for insert
  to authenticated
  with check (auth0_user_id = (select auth.jwt() ->> 'sub'));

drop policy if exists "reviews_update_own_auth0_user" on public.reviews;
create policy "reviews_update_own_auth0_user"
  on public.reviews
  for update
  to authenticated
  using (auth0_user_id = (select auth.jwt() ->> 'sub'))
  with check (auth0_user_id = (select auth.jwt() ->> 'sub'));

drop policy if exists "reviews_delete_own_auth0_user" on public.reviews;
create policy "reviews_delete_own_auth0_user"
  on public.reviews
  for delete
  to authenticated
  using (auth0_user_id = (select auth.jwt() ->> 'sub'));

drop policy if exists "review_recommendations_select_own_review" on public.review_recommendations;
create policy "review_recommendations_select_own_review"
  on public.review_recommendations
  for select
  to authenticated
  using (exists (
    select 1 from public.reviews
    where reviews.id = review_recommendations.review_id
      and reviews.auth0_user_id = (select auth.jwt() ->> 'sub')
  ));

drop policy if exists "review_recommendations_write_own_review" on public.review_recommendations;
create policy "review_recommendations_write_own_review"
  on public.review_recommendations
  for all
  to authenticated
  using (exists (
    select 1 from public.reviews
    where reviews.id = review_recommendations.review_id
      and reviews.auth0_user_id = (select auth.jwt() ->> 'sub')
  ));

drop policy if exists "review_roadmap_actions_select_own_review" on public.review_roadmap_actions;
create policy "review_roadmap_actions_select_own_review"
  on public.review_roadmap_actions
  for select
  to authenticated
  using (exists (
    select 1 from public.reviews
    where reviews.id = review_roadmap_actions.review_id
      and reviews.auth0_user_id = (select auth.jwt() ->> 'sub')
  ));

drop policy if exists "review_roadmap_actions_write_own_review" on public.review_roadmap_actions;
create policy "review_roadmap_actions_write_own_review"
  on public.review_roadmap_actions
  for all
  to authenticated
  using (exists (
    select 1 from public.reviews
    where reviews.id = review_roadmap_actions.review_id
      and reviews.auth0_user_id = (select auth.jwt() ->> 'sub')
  ));
