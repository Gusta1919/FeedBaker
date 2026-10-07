-- Crowd similarity: how often the user picked the same option as the majority

create or replace function public.get_user_vote_insights(p_user_id uuid)
returns json
language sql
stable
security definer
set search_path = public
as $$
  with user_votes as (
    select v.poll_id, v.option_id, p.category
    from public.votes v
    join public.polls p on p.id = v.poll_id
    where v.user_id = p_user_id
  ),
  option_counts as (
    select po.poll_id, po.id as option_id, count(v.id) as vote_count
    from public.poll_options po
    left join public.votes v on v.option_id = po.id
    where po.poll_id in (select poll_id from user_votes)
    group by po.poll_id, po.id
  ),
  majority as (
    select distinct on (poll_id)
      poll_id,
      option_id as majority_option_id
    from option_counts
    order by poll_id, vote_count desc, option_id
  ),
  scored as (
    select
      uv.category,
      (uv.option_id = m.majority_option_id) as matched
    from user_votes uv
    join majority m on m.poll_id = uv.poll_id
  ),
  overall as (
    select
      coalesce(
        round(100.0 * avg(case when matched then 1.0 else 0.0 end))::integer,
        0
      ) as similarity,
      count(*)::bigint as total
    from scored
  ),
  by_category as (
    select
      category,
      count(*)::bigint as votes,
      coalesce(
        round(100.0 * avg(case when matched then 1.0 else 0.0 end))::integer,
        0
      ) as similarity
    from scored
    group by category
    order by count(*) desc, category
  )
  select json_build_object(
    'overallSimilarity', (select similarity from overall),
    'totalScoredVotes', (select total from overall),
    'categories', coalesce(
      (
        select json_agg(
          json_build_object(
            'category', category,
            'votes', votes,
            'similarity', similarity
          )
          order by votes desc, category
        )
        from by_category
      ),
      '[]'::json
    )
  );
$$;

grant execute on function public.get_user_vote_insights(uuid) to anon, authenticated, service_role;
