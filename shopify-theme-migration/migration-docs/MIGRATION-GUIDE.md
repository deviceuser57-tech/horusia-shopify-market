# HORUSIA Shopify Theme Migration Guide

## Scope

This is a new Shopify Online Store 2.0 theme source. It does not contain React, Vite, Supabase, Lovable SDK, custom checkout, payment services, supplier connectors, or an admin dashboard.

The original project remains unchanged in `D:\Hurusia - Shopify\horusia-shopify-market`. The uploadable theme is in the sibling `shopify-theme-migration` directory.

## Upload

Zip the theme folders and files directly inside `shopify-theme-migration`; do not zip the enclosing migration directory. Upload the resulting ZIP to Shopify as an unpublished theme. Theme folders must remain at the ZIP root:

- `layout/`
- `templates/`
- `sections/`
- `snippets/`
- `assets/`
- `config/`
- `locales/`

## Required Shopify setup

1. Create or review the default `main-menu` and `footer` navigation menus.
2. Add the About, Contact, and Services Shopify pages. Assign their templates with suffixes `about`, `contact`, and `services`.
3. Create collections and import products using Shopify Admin or a Shopify-approved CSV workflow.
4. Set policy pages in Shopify Settings.
5. Add the logo and initial banner images through Theme Settings and the Hero Carousel section.
6. Configure English and Arabic languages in Shopify Markets and Shopify Publishing.
7. Configure product options, variants, inventory, and availability in Shopify Admin.

Do not claim products or inventory exist until Shopify Admin import and storefront testing confirm them.

## Data

No live Shopify data export or database authorization was available in this session. Product fields and variants must be exported or entered in Shopify Admin using Shopify's current import specification. See `DATA-INVENTORY.md`.

## Media

The owned source assets found in `src/assets/` and `public/share-preview.jpg` are available in `media-package/`. Upload and attach only to the relevant Shopify resources. The theme's banner and logo sections allow image pickers, so no Lovable or Supabase asset URL is required.

## Languages

The theme uses `request.locale.iso_code` to set RTL for `ar` and LTR for other locales. Interface strings are in `locales/en.default.json` and `locales/ar.json`. Page, collection, product, and policy content must be translated separately in Shopify.

## Apps

Optional apps may supply reviews, loyalty, chat, subscriptions, affiliate operations, marketing automation, or AI tools. Their app blocks require separate owner selection and installation. No app IDs or app instances are fabricated. The main-product section and an app section contain Shopify app block areas.

## Forms

Contact and service inquiries use Shopify's native `{% form 'contact' %}` behavior. This is not a booking or CRM system. Newsletter signup uses Shopify customer/newsletter form handling. Advanced CRM, scheduling, or marketing automation should be evaluated separately in Shopify apps.

## Policies

Footer and page links must be created from Shopify policy settings. Shipping, returns, privacy, and terms content must be supplied and approved by the owner. The migration does not invent rates, guarantees, delivery times, or refunds.

## URL mapping

Proposed mapping only; redirects are not applied:

| Old SPA route | Shopify route |
|---|---|
| `/` | `/` |
| `/shop` | `/collections/all` |
| `/collections` | `/collections` |
| `/collections/:handle` | `/collections/:handle` |
| `/product/:handle` | `/products/:handle` |
| `/about` | `/pages/about` |
| `/contact` | `/pages/contact` |
| `/services` | `/pages/services` |
| `/shipping` | `/policies/shipping-policy` if configured |
| `/refund` | `/policies/refund-policy` if configured |
| `/privacy` | `/policies/privacy-policy` if configured |
| `/terms` | `/policies/terms-of-service` if configured |
| `/auth` | Shopify account login/register URLs |
| `/404` or unknown route | Shopify 404 |

`/admin`, `/order-success`, Lovable OAuth routes, custom payment routes, and custom operational routes are intentionally removed rather than redirected.

## Manual verification

Before publishing a theme, verify in an unpublished Shopify theme:

- Product, variant, inventory, and price behavior
- Cart updates and checkout handoff
- RTL/LTR rendering
- Policy links
- Contact and newsletter forms
- Navigation menus
- Product and collection imports
- App blocks
