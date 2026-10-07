-- Fix storage upload policies for authenticated users
drop policy if exists "Authenticated users can upload poll images" on storage.objects;

create policy "Authenticated users can upload poll images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'poll-images'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can update own uploads" on storage.objects;

create policy "Users can update own uploads"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'poll-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can delete own uploads" on storage.objects;

create policy "Users can delete own uploads"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'poll-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
