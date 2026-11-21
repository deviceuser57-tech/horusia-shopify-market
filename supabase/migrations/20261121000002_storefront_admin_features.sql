create table if not exists public.store_products (
  id uuid primary key default gen_random_uuid(),
  business_model public.business_model_type not null,
  title text not null,
  title_ar text,
  title_en text,
  description text,
  category text,
  image_url text,
  price numeric(12,2) check (price >= 0),
  supplier_cost numeric(12,2) check (supplier_cost >= 0),
  currency text not null default 'USD',
  affiliate_url text,
  supplier_sku text,
  status text not null default 'DRAFT',
  tags jsonb not null default '[]'::jsonb,
  ad_copy jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (business_model = 'AFFILIATE' and affiliate_url is not null)
    or
    (business_model = 'DROPSHIPPING')
  )
);

create table if not exists public.hero_banner_configs (
  id uuid primary key default gen_random_uuid(),
  headline_ar text not null,
  headline_en text,
  subheadline_ar text,
  subheadline_en text,
  image_url text not null,
  overlay_opacity integer not null check (overlay_opacity between 0 and 90),
  cta_text_ar text not null,
  cta_text_en text,
  cta_link text not null,
  badge_text text,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists one_active_hero_banner
  on public.hero_banner_configs (is_active)
  where is_active = true;

alter table public.store_products enable row level security;
alter table public.hero_banner_configs enable row level security;

alter table public.agent_action_proposals
  add column if not exists proposed_value jsonb,
  add column if not exists decided_at timestamptz,
  add column if not exists rejection_reason text,
  add column if not exists reviewed_by uuid references auth.users(id);
