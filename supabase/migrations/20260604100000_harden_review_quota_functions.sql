-- Harden weekly review quota RPCs for Supabase linter:
-- - fixed search_path (0011)
-- - SECURITY INVOKER (0028/0029: not callable as definer by anon/authenticated)
-- - EXECUTE only for service_role (server-side API)

drop function if exists public.consume_weekly_review_quota(text, integer);
drop function if exists public.check_weekly_review_quota(text, integer);

create function public.consume_weekly_review_quota(
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
security invoker
set search_path = public, pg_temp
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

create function public.check_weekly_review_quota(
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
security invoker
set search_path = public, pg_temp
stable
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

revoke all on function public.consume_weekly_review_quota(text, integer) from public;
revoke all on function public.consume_weekly_review_quota(text, integer) from anon;
revoke all on function public.consume_weekly_review_quota(text, integer) from authenticated;
revoke all on function public.check_weekly_review_quota(text, integer) from public;
revoke all on function public.check_weekly_review_quota(text, integer) from anon;
revoke all on function public.check_weekly_review_quota(text, integer) from authenticated;

grant execute on function public.consume_weekly_review_quota(text, integer) to service_role;
grant execute on function public.check_weekly_review_quota(text, integer) to service_role;
