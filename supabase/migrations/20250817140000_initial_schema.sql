-- Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Poll visibility
create type public.poll_visibility as enum ('public', 'unlisted', 'private');

-- Results policy
create type public.results_policy as enum (
  'public_live',
  'voters_only',
  'creator_only',
  'after_threshold',
  'never_public'
);

create table public.polls (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  question text not null check (char_length(question) <= 200),
  category text not null default 'General',
  visibility public.poll_visibility not null default 'public',
  results_policy public.results_policy not null default 'public_live',
  results_threshold integer check (results_threshold is null or results_threshold > 0),
  invite_code text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  label text not null default '',
  image_url text not null,
  sort_order smallint not null check (sort_order >= 0 and sort_order <= 3),
  created_at timestamptz not null default now()
);

create table public.votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (poll_id, user_id)
);

create table public.poll_skips (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (poll_id, user_id)
);

create table public.poll_access (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (poll_id, user_id)
);

-- Indexes
create index polls_creator_id_idx on public.polls(creator_id);
create index polls_visibility_created_idx on public.polls(visibility, created_at desc);
create index poll_options_poll_id_idx on public.poll_options(poll_id);
create index votes_poll_id_idx on public.votes(poll_id);
create index votes_user_id_idx on public.votes(user_id);
create index poll_skips_user_id_idx on public.poll_skips(user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'username',
      split_part(new.email, '@', 1),
      'user_' || substr(new.id::text, 1, 8)
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger polls_updated_at
  before update on public.polls
  for each row execute procedure public.set_updated_at();

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- Vote count view helper (used in app)
create or replace function public.get_poll_vote_counts(p_poll_id uuid)
returns table (option_id uuid, vote_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select po.id as option_id, count(v.id) as vote_count
  from public.poll_options po
  left join public.votes v on v.option_id = po.id
  where po.poll_id = p_poll_id
  group by po.id
  order by po.sort_order;
$$;

-- RLS
alter table public.profiles enable row level security;
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.votes enable row level security;
alter table public.poll_skips enable row level security;
alter table public.poll_access enable row level security;

-- Profiles policies
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Polls: public/unlisted readable; private needs access
create policy "Public polls are viewable"
  on public.polls for select using (
    visibility = 'public'
    or visibility = 'unlisted'
    or creator_id = auth.uid()
    or (
      visibility = 'private' and exists (
        select 1 from public.poll_access pa
        where pa.poll_id = polls.id and pa.user_id = auth.uid()
      )
    )
  );

create policy "Authenticated users can create polls"
  on public.polls for insert with check (auth.uid() = creator_id);

create policy "Creators can update own polls"
  on public.polls for update using (auth.uid() = creator_id);

create policy "Creators can delete own polls"
  on public.polls for delete using (auth.uid() = creator_id);

-- Poll options follow poll visibility
create policy "Poll options viewable if poll viewable"
  on public.poll_options for select using (
    exists (
      select 1 from public.polls p where p.id = poll_options.poll_id
    )
  );

create policy "Creators can insert options"
  on public.poll_options for insert with check (
    exists (
      select 1 from public.polls p
      where p.id = poll_options.poll_id and p.creator_id = auth.uid()
    )
  );

create policy "Creators can delete options"
  on public.poll_options for delete using (
    exists (
      select 1 from public.polls p
      where p.id = poll_options.poll_id and p.creator_id = auth.uid()
    )
  );

-- Votes
create policy "Users can view votes on polls they can see"
  on public.votes for select using (
    exists (select 1 from public.polls p where p.id = votes.poll_id)
  );

create policy "Authenticated users can vote once"
  on public.votes for insert with check (auth.uid() = user_id);

-- Skips
create policy "Users manage own skips"
  on public.poll_skips for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Poll access (private whitelist)
create policy "Creators manage poll access"
  on public.poll_access for all using (
    exists (
      select 1 from public.polls p
      where p.id = poll_access.poll_id and p.creator_id = auth.uid()
    )
  );

create policy "Users can see own access grants"
  on public.poll_access for select using (user_id = auth.uid());

-- Storage bucket for poll images
insert into storage.buckets (id, name, public)
values ('poll-images', 'poll-images', true)
on conflict (id) do nothing;

create policy "Anyone can view poll images"
  on storage.objects for select using (bucket_id = 'poll-images');

create policy "Authenticated users can upload poll images"
  on storage.objects for insert with check (
    bucket_id = 'poll-images' and auth.role() = 'authenticated'
  );

create policy "Users can update own uploads"
  on storage.objects for update using (
    bucket_id = 'poll-images' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own uploads"
  on storage.objects for delete using (
    bucket_id = 'poll-images' and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Grants for API roles
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
