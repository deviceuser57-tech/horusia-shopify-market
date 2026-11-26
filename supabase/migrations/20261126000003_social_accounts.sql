-- Social media accounts for ad publishing management.
create table if not exists public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('TIKTOK','INSTAGRAM','FACEBOOK','YOUTUBE','SNAPCHAT','PINTEREST','GOOGLE_ADS','OTHER')),
  account_name text not null,
  handle text,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','PAUSED','DISCONNECTED')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.social_accounts enable row level security;

-- Admins manage; public has no access.
create policy "Admins manage social accounts"
  on public.social_accounts for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
