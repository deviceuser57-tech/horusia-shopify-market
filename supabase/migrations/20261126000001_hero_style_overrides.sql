-- Flexible per-slide style overrides for the hero carousel
-- (fonts, text panel, CTA colors, badge styling).
alter table public.hero_banner_configs
  add column if not exists style jsonb not null default '{}'::jsonb;
