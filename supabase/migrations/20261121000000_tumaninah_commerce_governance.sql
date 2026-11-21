-- Tumāninah zero-inventory commerce domain

create type public.business_model_type as enum ('DROPSHIPPING', 'AFFILIATE');
create type public.sync_status_type as enum ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'STALE');
create type public.availability_status_type as enum ('AVAILABLE', 'UNAVAILABLE', 'OUT_OF_STOCK', 'UNKNOWN', 'STALE');
create type public.governance_role_type as enum (
  'OWNER',
  'STORE_MANAGER',
  'MARKETING_SPECIALIST',
  'ANALYST',
  'AI_AGENT'
);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name public.governance_role_type not null unique,
  description text,
  created_at timestamptz not null default now()
);

insert into public.roles (name, description)
values
  ('OWNER', 'Full system access and final approvals'),
  ('STORE_MANAGER', 'Products, suppliers and dropshipping operations'),
  ('MARKETING_SPECIALIST', 'Content, campaigns and affiliate operations'),
  ('ANALYST', 'Read-only reporting and analytics'),
  ('AI_AGENT', 'Draft proposals only; no direct sensitive execution')
on conflict (name) do nothing;

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table if not exists public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  granted_by uuid references auth.users(id),
  granted_at timestamptz not null default now(),
  primary key (user_id, role_id)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id),
  action text not null,
  target_type text,
  target_id text,
  previous_value jsonb,
  new_value jsonb,
  reason text,
  correlation_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.approval_requests (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid not null references auth.users(id),
  approved_by uuid references auth.users(id),
  action_type text not null,
  target_type text not null,
  target_id text,
  previous_value jsonb,
  proposed_value jsonb not null,
  status text not null default 'PENDING',
  reason text,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.agent_action_proposals (
  id uuid primary key default gen_random_uuid(),
  agent_name text not null,
  action_type text not null,
  target_type text,
  target_id text,
  proposed_value jsonb not null,
  evidence jsonb not null default '[]'::jsonb,
  confidence text,
  status text not null default 'PENDING_APPROVAL',
  approval_id uuid references public.approval_requests(id),
  created_at timestamptz not null default now()
);

alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.audit_logs enable row level security;
alter table public.approval_requests enable row level security;
alter table public.agent_action_proposals enable row level security;

create table if not exists public.newsletter_subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'website',
  consented_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (email)
);

alter table public.newsletter_subscriptions enable row level security;

create policy "Anonymous can subscribe"
on public.newsletter_subscriptions
for insert
to anon, authenticated
with check (length(trim(email)) between 3 and 255);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  status text not null default 'NEW',
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

create policy "Anonymous can submit contact message"
on public.contact_messages
for insert
to anon, authenticated
with check (
  length(trim(name)) between 1 and 100
  and length(trim(email)) between 3 and 255
  and length(trim(subject)) between 1 and 200
  and length(trim(message)) between 1 and 2000
);

create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  service_type text not null,
  message text not null,
  status text not null default 'NEW',
  created_at timestamptz not null default now()
);

alter table public.service_requests enable row level security;

create policy "Anonymous can submit service request"
on public.service_requests
for insert
to anon, authenticated
with check (
  length(trim(name)) between 1 and 100
  and length(trim(email)) between 3 and 255
  and length(trim(service_type)) between 1 and 100
  and length(trim(message)) between 1 and 2000
);

create table if not exists public.external_product_snapshots (
  id uuid primary key default gen_random_uuid(),
  product_id text not null,
  source_type public.business_model_type not null,
  provider_name text not null,
  provider_product_id text,
  external_price numeric(12,2),
  currency text,
  availability_status public.availability_status_type not null default 'UNKNOWN',
  source_url text,
  last_synced_at timestamptz,
  freshness_status public.sync_status_type not null default 'STALE',
  sync_result text,
  error_details text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_external_snapshot_product
  on public.external_product_snapshots (product_id, updated_at desc);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  connector_type text not null,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now()
);

create table if not exists public.supplier_products (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  internal_product_id text,
  external_product_id text not null,
  external_variant_id text,
  external_price numeric(12,2),
  currency text,
  availability_status public.availability_status_type not null default 'UNKNOWN',
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (supplier_id, external_product_id, external_variant_id)
);

create table if not exists public.supplier_orders (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  internal_order_id text not null,
  external_order_id text,
  status text not null default 'PENDING_SUBMISSION',
  idempotency_key text not null,
  payload jsonb not null default '{}'::jsonb,
  submitted_at timestamptz,
  accepted_at timestamptz,
  error_details text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (idempotency_key)
);

create table if not exists public.supplier_order_events (
  id uuid primary key default gen_random_uuid(),
  supplier_order_id uuid not null references public.supplier_orders(id) on delete cascade,
  status text not null,
  external_status text,
  payload jsonb not null default '{}'::jsonb,
  recorded_at timestamptz not null default now()
);

create table if not exists public.shipment_tracking (
  id uuid primary key default gen_random_uuid(),
  supplier_order_id uuid not null references public.supplier_orders(id) on delete cascade,
  carrier text,
  tracking_number text,
  tracking_url text,
  status text,
  last_updated_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.affiliate_programs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  network_name text,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now()
);

create table if not exists public.affiliate_merchants (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references public.affiliate_programs(id) on delete set null,
  name text not null,
  website_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.affiliate_products (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.affiliate_merchants(id) on delete cascade,
  internal_product_id text,
  external_offer_id text,
  affiliate_url text not null,
  last_synced_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.affiliate_links (
  id uuid primary key default gen_random_uuid(),
  affiliate_product_id uuid not null references public.affiliate_products(id) on delete cascade,
  click_identifier text not null unique,
  destination_url text not null,
  campaign text,
  created_at timestamptz not null default now()
);

create table if not exists public.affiliate_click_events (
  id uuid primary key default gen_random_uuid(),
  affiliate_link_id uuid references public.affiliate_links(id) on delete set null,
  internal_product_id text,
  click_identifier text not null,
  source text,
  campaign text,
  redirected_at timestamptz not null default now(),
  user_agent text
);

alter table public.affiliate_click_events enable row level security;

create policy "Anonymous can record affiliate clicks"
on public.affiliate_click_events
for insert
to anon, authenticated
with check (
  length(trim(click_identifier)) between 1 and 128
);

create index if not exists idx_affiliate_click_identifier
  on public.affiliate_click_events (click_identifier, redirected_at desc);

create table if not exists public.affiliate_conversions (
  id uuid primary key default gen_random_uuid(),
  click_identifier text,
  external_conversion_id text unique,
  status text not null default 'UNKNOWN',
  conversion_value numeric(12,2),
  currency text,
  source text not null,
  recorded_at timestamptz not null default now()
);

create table if not exists public.affiliate_commissions (
  id uuid primary key default gen_random_uuid(),
  conversion_id uuid references public.affiliate_conversions(id) on delete set null,
  status text not null check (status in ('ESTIMATED', 'PENDING', 'APPROVED', 'REJECTED', 'PAID', 'CANCELLED')),
  amount numeric(12,2),
  currency text,
  source text not null,
  recorded_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  internal_order_number text not null unique,
  payment_status text not null default 'PENDING',
  fulfillment_status text not null default 'PENDING_SUPPLIER',
  business_model public.business_model_type not null default 'DROPSHIPPING',
  total_amount numeric(12,2),
  currency text,
  supplier_id uuid references public.suppliers(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (business_model = 'DROPSHIPPING')
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  internal_product_id text not null,
  supplier_product_id uuid references public.supplier_products(id),
  variant_id text,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0)
);

create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null,
  external_transaction_id text,
  status text not null,
  amount numeric(12,2) not null,
  currency text not null,
  idempotency_key text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  external_event_id text,
  payload jsonb not null,
  signature_valid boolean,
  processed boolean not null default false,
  received_at timestamptz not null default now(),
  unique (provider, external_event_id)
);

create table if not exists public.transactional_outbox (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  aggregate_type text not null,
  aggregate_id text not null,
  payload jsonb not null default '{}'::jsonb,
  status public.sync_status_type not null default 'PENDING',
  retry_count integer not null default 0,
  available_at timestamptz not null default now(),
  processed_at timestamptz,
  error_details text,
  created_at timestamptz not null default now()
);

create index if not exists idx_outbox_pending
  on public.transactional_outbox (status, available_at);

create table if not exists public.sync_jobs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null,
  status public.sync_status_type not null default 'PENDING',
  correlation_id uuid not null default gen_random_uuid(),
  started_at timestamptz,
  completed_at timestamptz,
  error_details text,
  created_at timestamptz not null default now()
);

create table if not exists public.integration_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_type text not null,
  correlation_id uuid,
  payload jsonb not null default '{}'::jsonb,
  status text not null,
  created_at timestamptz not null default now()
);

grant usage on schema public to anon, authenticated;
grant insert on table public.newsletter_subscriptions to anon, authenticated;
grant insert on table public.contact_messages to anon, authenticated;
grant insert on table public.service_requests to anon, authenticated;
grant insert on table public.affiliate_click_events to anon, authenticated;

alter table public.external_product_snapshots enable row level security;
alter table public.suppliers enable row level security;
alter table public.supplier_products enable row level security;
alter table public.supplier_orders enable row level security;
alter table public.supplier_order_events enable row level security;
alter table public.shipment_tracking enable row level security;
alter table public.affiliate_programs enable row level security;
alter table public.affiliate_merchants enable row level security;
alter table public.affiliate_products enable row level security;
alter table public.affiliate_links enable row level security;
alter table public.affiliate_conversions enable row level security;
alter table public.affiliate_commissions enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.payment_webhook_events enable row level security;
alter table public.transactional_outbox enable row level security;
alter table public.sync_jobs enable row level security;
alter table public.integration_events enable row level security;
