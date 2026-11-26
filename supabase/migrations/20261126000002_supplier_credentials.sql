-- Supplier connector credentials and sync status (admin-only via existing RLS).
alter table public.suppliers
  add column if not exists api_endpoint text,
  add column if not exists account_identifier text,
  add column if not exists api_key text,
  add column if not exists api_secret text,
  add column if not exists sync_status text not null default 'IDLE',
  add column if not exists last_ping_at timestamptz,
  add column if not exists settings jsonb not null default '{}'::jsonb;
