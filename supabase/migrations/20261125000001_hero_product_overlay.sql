-- ZOOS2-style multi-layer hero: floating product overlay image and
-- animation effect toggle per slide.
alter table public.hero_banner_configs
  add column if not exists product_overlay_url text,
  add column if not exists has_animation boolean not null default true;
