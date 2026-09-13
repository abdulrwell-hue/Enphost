-- ── Public site: visitors can read active add-ons and visible videos ────────
-- The public /packages page now lists add-ons, and /portfolio lists videos.
-- Both queries run with the anon key, so they need an explicit read policy.
-- Writes stay restricted to signed-in dashboard users.

drop policy if exists "addons: public read active" on public.addons;
create policy "addons: public read active" on public.addons
  for select to anon using (is_active = true);

alter table public.videos enable row level security;

drop policy if exists "videos: public read visible" on public.videos;
create policy "videos: public read visible" on public.videos
  for select to anon using (is_visible = true);

drop policy if exists "videos: authenticated all" on public.videos;
create policy "videos: authenticated all" on public.videos
  for all to authenticated using (true) with check (true);

-- Diagnostic — how many videos exist and how many are visible
select count(*) as total_videos, count(*) filter (where is_visible) as visible_videos
from public.videos;
