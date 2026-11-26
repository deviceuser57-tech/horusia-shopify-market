-- Sourcing provenance for store products: where each item is sourced from
-- before it can reach the storefront.
alter table public.store_products
  add column if not exists supplier_source text
    check (supplier_source in ('CJ_DROPSHIPPING', 'AFFILIATE_NETWORK', 'NEEDS_SOURCING')),
  add column if not exists affiliate_network text;
