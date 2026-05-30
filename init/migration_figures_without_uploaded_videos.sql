-- Migration: add figures_without_uploaded_videos function
-- Run this against your Supabase project SQL editor

create or replace function public.figures_without_uploaded_videos()
returns setof figures_full language sql stable
set search_path = public as $$
  select * from figures_full
  where not exists (
    select 1 from json_array_elements(videos) as v
    where v->>'source_type' = 'upload'
  )
  order by name;
$$;

grant execute on function public.figures_without_uploaded_videos() to authenticated;
