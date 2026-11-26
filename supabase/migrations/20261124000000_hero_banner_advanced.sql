-- Advanced hero banner options: page placement, height preset, text alignment,
-- overlay style, background video, secondary CTA, and carousel ordering.
alter table public.hero_banner_configs
  add column if not exists placement text not null default 'home'
    check (placement in ('home', 'shop', 'both')),
  add column if not exists height_preset text not null default 'standard'
    check (height_preset in ('compact', 'standard', 'full')),
  add column if not exists text_align text not null default 'center'
    check (text_align in ('right', 'center', 'left')),
  add column if not exists overlay_color text not null default 'black'
    check (overlay_color in ('black', 'navy', 'gradient')),
  add column if not exists video_url text,
  add column if not exists secondary_cta_text_ar text,
  add column if not exists secondary_cta_link text,
  add column if not exists sort_order int not null default 0;

-- Public read access for the storefront carousel queries.
grant select on public.hero_banner_configs to anon, authenticated;
