create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and r.name in ('OWNER', 'STORE_MANAGER', 'MARKETING_SPECIALIST')
  );
$$;

create policy "Public can read active hero banner"
on public.hero_banner_configs
for select
to anon, authenticated
using (is_active = true);

create policy "Public can read active store products"
on public.store_products
for select
to anon, authenticated
using (status = 'ACTIVE');

create policy "Admins manage hero banners"
on public.hero_banner_configs
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins manage store products"
on public.store_products
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins manage agent proposals"
on public.agent_action_proposals
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins manage audit logs"
on public.audit_logs
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

do $$
declare
  admin_table text;
begin
  foreach admin_table in array array[
    'affiliate_programs',
    'affiliate_merchants',
    'affiliate_products',
    'affiliate_links',
    'affiliate_conversions',
    'affiliate_commissions',
    'suppliers',
    'supplier_products',
    'supplier_orders',
    'supplier_order_events',
    'shipment_tracking',
    'external_product_snapshots',
    'orders',
    'order_items',
    'payment_transactions',
    'payment_webhook_events',
    'transactional_outbox',
    'sync_jobs',
    'integration_events'
  ]
  loop
    execute format(
      'drop policy if exists "Admins manage %I" on public.%I;',
      admin_table,
      admin_table
    );
    execute format(
      'create policy "Admins manage %I" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin());',
      admin_table,
      admin_table
    );
  end loop;
end;
$$;
