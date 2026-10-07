-- Allow users to create their own profile row (needed for upsert on avatar/username)
create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);
