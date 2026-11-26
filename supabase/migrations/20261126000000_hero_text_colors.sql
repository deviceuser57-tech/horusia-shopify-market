-- Configurable hero text colors per slide.
alter table public.hero_banner_configs
  add column if not exists headline_color text not null default '#ffffff',
  add column if not exists body_color text not null default '#e5e7eb';
