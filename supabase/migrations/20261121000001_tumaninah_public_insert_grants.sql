-- Allow public storefront forms to insert, while preserving RLS and denying public reads.

grant usage on schema public to anon, authenticated;

grant insert on table public.newsletter_subscriptions to anon, authenticated;
grant insert on table public.contact_messages to anon, authenticated;
grant insert on table public.service_requests to anon, authenticated;
grant insert on table public.affiliate_click_events to anon, authenticated;
