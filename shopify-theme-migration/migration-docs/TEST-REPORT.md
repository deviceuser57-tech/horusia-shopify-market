# Test Report

## Environment checks

- Capability: REAL LIQUID THEME OUTPUT GENERATED
- React/Vite build: NOT USED AS theme compatibility evidence
- Original project: unchanged
- Shopify CLI/Theme Check: NOT RUN — `shopify`/`theme-check` not installed on PATH
- Fix round: review findings addressed in source; see "Fix-round changes" below

## Checks

| Check | Status | Notes |
|---|---|---|
| Theme folder structure | TESTED SUCCESSFULLY | Conventional Shopify directories generated |
| JSON syntax | TESTED SUCCESSFULLY | All theme `.json` files and embedded `{% schema %}` blocks parse with Node `JSON.parse` |
| theme.js syntax | TESTED SUCCESSFULLY | `node --check assets/theme.js` passes |
| Theme Check | NOT RUN | Neither `shopify` nor `theme-check` is installed or available on `PATH` |
| Shopify theme upload | NOT TESTED | Requires Shopify store access and unpublished theme |
| Product import | NOT TESTED | No authorized live export/access |
| Variant behavior (existing/unavailable/sold-out combos, `?variant=` URL) | NOT TESTED | Requires Shopify development/unpublished environment; logic reviewed statically |
| Variant price and compare-at price updates (EGP) | NOT TESTED | Requires storefront render; money placeholders no longer conflict with Liquid |
| Add to cart and cart drawer refresh | NOT TESTED | Requires storefront render |
| Quantity update errors | NOT TESTED | Requires storefront render |
| Checkout handoff | NOT TESTED | Requires storefront render |
| Contact form delivery | NOT TESTED | Requires Shopify store environment |
| Newsletter handling | NOT TESTED | Requires native Shopify customer setup |
| App blocks | NOT TESTED | No app IDs or app instances configured |
| Arabic RTL and English | NOT TESTED in browser | `dir` is set by locale; JS strings now come from locale files; manual visual verification required |
| Desktop/mobile and keyboard operation | NOT TESTED in browser | Focus management and nested menus implemented; manual verification required |
| Visual comparison | NOT PERFORMED | Pixel parity is not claimed |

## Fix-round changes (review findings)

1. **Product variants** — option matching is now positional (`variant.options[i]` vs selected value per option index), not `options.includes()`. Checked radios initialize from `selected_or_first_available_variant` (respects `?variant=` URLs). Nonexistent combinations clear the hidden variant id and disable purchase with a translated "combination unavailable" message. Sold-out variants stay disabled. Product JSON, price nodes, and controls are scoped to `[data-product-section]`. The native `{% form 'product' %}` path still posts the hidden `id` without JavaScript.
2. **Prices** — the `{{amount}}` placeholders in `layout/theme.liquid` are now inside `{% raw %}` so Liquid no longer eats them; `formatMoney` uses safe `split/join` replacement and never falls back to raw minor units (worst case shows `amount + currency code`). Compare-at price updates with the variant and hides when absent.
3. **Cart** — the drawer now renders real line items (image, title, variant, quantity input, remove, line price) and subtotal from `/cart.js` on load and after every mutation; checkout button hides when empty; quantity/remove updates go through `/cart/update.js` with explicit error reporting; cart-page quantity updates show an inline error instead of silently reloading on failure.
4. **Product media** — thumbnails switch the main image with `aria-pressed` selected state; variant selection switches media when the variant has a distinct image; `enable_zoom` is now functional (click toggles a scrollable 2x zoom on the main image).
5. **Localization/a11y** — all JS-facing strings come from a `data-i18n` JSON block rendered through `| t` in both locales; the drawer manages focus (focuses close button on open, traps Tab while open, restores focus to the trigger on close, Escape closes); desktop nav renders child links as hover/focus-within submenus and mobile nav renders toggleable submenus; carousel autoplay respects `prefers-reduced-motion`; components reinitialize on `shopify:section:load` without duplicate listeners.
6. **Validation** — `enabled_on.templates` for contact-form corrected to `["page"]` (`page.contact`/`page.services` are not valid enum values; suffixed page templates are covered by `page`). `font_picker` heading default changed from invalid `"serif"` to `"playfairdisplay_n7"`. Heading font is wired to `h1–h6` via `--font-heading`. Theme Check remains NOT RUN.
7. **Design/config** — featured-collection falls back to `collections.all` when no collection is selected; hero slides fall back to the packaged `hero-banner.jpg` when no image is picked. Unselected logo/menu/policy settings still require Theme Editor configuration (see MIGRATION-GUIDE).
8. **Packaging** — `HORUSIA-shopify-theme.zip` contains only uploadable theme folders at the ZIP root; `migration-docs/`, `media-package/`, and nested ZIPs are excluded. `HORUSIA-media-package.zip` and `HORUSIA-migration-docs.zip` are delivered separately.

## Remaining issues

- Replace generic source-copy content with approved Shopify page content.
- Configure navigation and logos from Theme Editor.
- Import products and collections.
- Verify policy pages.
- Select optional apps later.
- Validate app blocks and accessibility in a real Shopify theme preview.
