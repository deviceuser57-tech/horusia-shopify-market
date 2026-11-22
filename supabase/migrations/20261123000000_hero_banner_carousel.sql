-- Allow multiple active hero banners so the homepage can rotate them
-- as an animated carousel. Previously only one is_active = true row
-- was permitted by the one_active_hero_banner unique index.
drop index if exists public.one_active_hero_banner;
