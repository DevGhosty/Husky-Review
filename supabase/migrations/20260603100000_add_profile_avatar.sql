alter table public.profiles
  add column if not exists avatar_storage_path text;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false)
on conflict (id) do update set public = false;

drop policy if exists "avatar_objects_select_own_auth0_user" on storage.objects;
create policy "avatar_objects_select_own_auth0_user"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub'));

drop policy if exists "avatar_objects_insert_own_auth0_user" on storage.objects;
create policy "avatar_objects_insert_own_auth0_user"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub'));

drop policy if exists "avatar_objects_update_own_auth0_user" on storage.objects;
create policy "avatar_objects_update_own_auth0_user"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub'))
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub'));

drop policy if exists "avatar_objects_delete_own_auth0_user" on storage.objects;
create policy "avatar_objects_delete_own_auth0_user"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub'));
