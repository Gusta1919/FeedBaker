-- Engagement stats: streaks, daily counts, agreement rate

create index if not exists votes_user_created_idx
  on public.votes (user_id, created_at desc);

create or replace function public.get_user_stats(p_user_id uuid)
returns table (
  polls_created bigint,
  votes_cast bigint,
  votes_today bigint,
  current_streak integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_streak integer := 0;
  v_day date;
  v_expected date := (now() at time zone 'utc')::date;
  v_has_today boolean;
begin
  select exists (
    select 1 from public.votes
    where user_id = p_user_id
      and (created_at at time zone 'utc')::date = v_expected
  ) into v_has_today;

  if not v_has_today then
    v_expected := v_expected - 1;
  end if;

  for v_day in
    select distinct (created_at at time zone 'utc')::date as d
    from public.votes
    where user_id = p_user_id
    order by d desc
  loop
    if v_day = v_expected then
      v_streak := v_streak + 1;
      v_expected := v_expected - 1;
    elsif v_day < v_expected then
      exit;
    end if;
  end loop;

  return query
  select
    (select count(*) from public.polls where creator_id = p_user_id),
    (select count(*) from public.votes where user_id = p_user_id),
    (select count(*) from public.votes
      where user_id = p_user_id
        and (created_at at time zone 'utc')::date = (now() at time zone 'utc')::date),
    v_streak;
end;
$$;

grant execute on function public.get_user_stats(uuid) to anon, authenticated, service_role;

-- Aggregated vote counts for a set of polls (avoids fetching every vote row)
create or replace function public.get_option_vote_counts(p_poll_ids uuid[])
returns table (poll_id uuid, option_id uuid, vote_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select po.poll_id, po.id as option_id, count(v.id) as vote_count
  from public.poll_options po
  left join public.votes v on v.option_id = po.id
  where po.poll_id = any(p_poll_ids)
  group by po.poll_id, po.id;
$$;

grant execute on function public.get_option_vote_counts(uuid[]) to anon, authenticated, service_role;
