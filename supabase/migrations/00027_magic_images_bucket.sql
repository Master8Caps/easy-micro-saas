-- Public bucket for AI-generated magic post images (anonymous leads).
insert into storage.buckets (id, name, public)
values ('magic-images', 'magic-images', true)
on conflict (id) do nothing;

-- Public read; writes only via the service role (used server-side).
create policy "magic-images public read"
  on storage.objects for select
  using (bucket_id = 'magic-images');
