insert into storage.buckets (id, name, public)
values ('media-assets', 'media-assets', true)
on conflict (id) do update set public = true;

create policy "Admins upload media assets"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'media-assets'
  and public.is_admin()
);

create policy "Public reads media assets"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'media-assets');

create policy "Admins manage media assets"
on storage.objects
for update, delete
to authenticated
using (
  bucket_id = 'media-assets'
  and public.is_admin()
)
with check (
  bucket_id = 'media-assets'
  and public.is_admin()
);
