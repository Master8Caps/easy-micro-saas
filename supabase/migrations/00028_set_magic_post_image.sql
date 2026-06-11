-- Atomic patch of a single sample post's imageUrl, to avoid lost updates when
-- multiple post images generate in parallel (read-modify-write would clobber).
create or replace function set_magic_post_image(p_id uuid, p_index int, p_url text)
returns void
language sql
as $$
  update magic_leads
  set result = jsonb_set(
    result,
    array['samplePosts', p_index::text, 'imageUrl'],
    to_jsonb(p_url),
    true
  )
  where id = p_id;
$$;
