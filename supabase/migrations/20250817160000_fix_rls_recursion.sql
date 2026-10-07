-- Fix infinite recursion in RLS policies (polls <-> poll_options/votes/poll_access)

create or replace function public.is_poll_visible(p_poll_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.polls p
    where p.id = p_poll_id
      and (
        p.visibility in ('public', 'unlisted')
        or p.creator_id = auth.uid()
        or (
          p.visibility = 'private'
          and exists (
            select 1
            from public.poll_access pa
            where pa.poll_id = p.id
              and pa.user_id = auth.uid()
          )
        )
      )
  );
$$;

create or replace function public.is_poll_owner(p_poll_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.polls p
    where p.id = p_poll_id
      and p.creator_id = auth.uid()
  );
$$;

grant execute on function public.is_poll_visible(uuid) to anon, authenticated, service_role;
grant execute on function public.is_poll_owner(uuid) to anon, authenticated, service_role;

-- Poll options
drop policy if exists "Poll options viewable if poll viewable" on public.poll_options;
create policy "Poll options viewable if poll viewable"
  on public.poll_options for select
  using (public.is_poll_visible(poll_id));

drop policy if exists "Creators can insert options" on public.poll_options;
create policy "Creators can insert options"
  on public.poll_options for insert
  with check (public.is_poll_owner(poll_id));

drop policy if exists "Creators can delete options" on public.poll_options;
create policy "Creators can delete options"
  on public.poll_options for delete
  using (public.is_poll_owner(poll_id));

-- Votes
drop policy if exists "Users can view votes on polls they can see" on public.votes;
create policy "Users can view votes on polls they can see"
  on public.votes for select
  using (public.is_poll_visible(poll_id));

-- Poll access
drop policy if exists "Creators manage poll access" on public.poll_access;
create policy "Creators manage poll access"
  on public.poll_access for all
  using (public.is_poll_owner(poll_id))
  with check (public.is_poll_owner(poll_id));

-- Polls: use security definer for private access check too
drop policy if exists "Public polls are viewable" on public.polls;
create policy "Public polls are viewable"
  on public.polls for select
  using (
    visibility in ('public', 'unlisted')
    or creator_id = auth.uid()
    or (
      visibility = 'private'
      and exists (
        select 1
        from public.poll_access pa
        where pa.poll_id = polls.id
          and pa.user_id = auth.uid()
      )
    )
  );
