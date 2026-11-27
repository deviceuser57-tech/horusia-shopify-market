# Test Report

## Baseline and scope

- Branch: `migration/shopify-liquid-theme`
- Baseline commit: `18290ccca9c84c57004999f6f179ca8868b97436`
- Worktree at baseline: clean
- This corrective pass did not commit, merge, push, publish, upload, or deploy.
- The original project and live services were not modified.
- No ZIP files or packages were created or overwritten.

## Files changed in this corrective pass

| File | Reason |
|---|---|
| `shopify-theme-migration/assets/theme.js` | Scoped integer, money, quantity, cart mutation, and checkout-pending fixes |
| `shopify-theme-migration/assets/base.css` | Hide JavaScript-only variant controls when JavaScript is unavailable |
| `shopify-theme-migration/sections/main-product.liquid` | Native no-JavaScript variant selector, all-sold-out handling, unique quantity ID, and integer quantity step |
| `shopify-theme-migration/snippets/cart-drawer.liquid` | Replace unverified `routes.checkout_url` link with native cart checkout form |
| `shopify-theme-migration/migration-docs/TEST-REPORT.md` | Record current behavior and actual test evidence |

The `layout/theme.liquid` file was not changed in this pass.

## Currency formatter test

Official Shopify references reviewed:

- Shopify Liquid `money` filter: https://shopify.dev/docs/api/liquid/filters/money
- Shopify currency-formatting options: https://help.shopify.com/en/manual/international/pricing/currency-formatting
- Shopify routes: https://shopify.dev/docs/api/liquid/objects/routes

The scoped `moneyHtml()` function in `assets/theme.js` was executed in an isolated Node VM against the actual file. It does not override `window.Shopify.formatMoney`.

Tested values are Shopify minor units. Invalid values are rejected with `RangeError`; they do not become zero.

| Minor units | Format | Expected | Actual | Status |
|---|---|---|---|---|
| `0` | `${{amount}}` | `$0.00` | `$0.00` | PASS |
| `1` | `${{amount}}` | `$0.01` | `$0.01` | PASS |
| `99` | `${{amount}}` | `$0.99` | `$0.99` | PASS |
| `100` | `${{amount}}` | `$1.00` | `$1.00` | PASS |
| `123456` | `${{amount}}` | `$1,234.56` | `$1,234.56` | PASS |
| `123499` | `{{amount_no_decimals}}` | `1,235` | `1,235` | PASS |
| `123450` | `{{amount_no_decimals}}` | `1,235` | `1,235` | PASS |
| `123456789` | `{{amount_no_decimals_with_comma_separator}}` | `1.234.568` | `1.234.568` | PASS |
| `-123456` | `€{{amount_with_comma_separator}}` | `-€1.234,56` | `-€1.234,56` | PASS |
| `123456789` | `{{amount_with_period_and_space_separator}}` | `1 234 567.89` | `1 234 567.89` | PASS |
| `123456789` | `{{amount_with_space_separator}}` | `1 234 567,89` | `1 234 567,89` | PASS |
| `123456789` | `{{amount_with_apostrophe_separator}}` | `1'234'567.89` | `1'234'567.89` | PASS |
| `123499` | `{{amount_no_decimals_with_comma_separator}}` | `1.235` | `1.235` | PASS |
| `123456789` | `{{amount_no_decimals_with_apostrophe_separator}}` | `1'234'568` | `1'234'568` | PASS |
| `123456789` | `{{amount_no_decimals_with_space_separator}}` | `1 234 568` | `1 234 568` | PASS |

The following invalid inputs were rejected: `NaN`, `Infinity`, empty string, and `1.5`. **Status: PASS**.

Confirmed Shopify placeholders:

- `{{amount}}`
- `{{amount_no_decimals}}`
- `{{amount_with_comma_separator}}`
- `{{amount_no_decimals_with_comma_separator}}`
- `{{amount_with_apostrophe_separator}}`
- `{{amount_no_decimals_with_space_separator}}`
- `{{amount_with_space_separator}}`
- `{{amount_with_period_and_space_separator}}`

Additional compatibility placeholder tested:

- `{{amount_no_decimals_with_apostrophe_separator}}`

Extended matrix also executed in this pass (all PASS): minor units `0, 1, 99, 100, 123456, 123499, 123450, 123456789, -123456, -50` across all eight confirmed placeholders, plus `${{amount}} USD` and `<span class="money">${{amount}}</span>` HTML formats (markup preserved, numeric part escaped), and whitespace-free canonical forms only — `{{ amount }}` with inner spaces is not a Shopify-generated format and is left literal.

Drawer line prices and subtotal render through `safeMoneyHtml()`, which falls back to the escaped raw value if the formatter ever throws, so malformed API prices cannot break drawer rendering.

The cart page's native checkout submit is marked with `data-cart-checkout` at init, so the shared pending-mutation guard disables it while a quantity change is unconfirmed, matching the drawer checkout behavior.

EGP-specific storefront formatting, rounding, and rendering were **NOT TESTED** because this pass had no Shopify store or theme preview. No EGP currency logic was added.

## Implementation checks

| Check | Status | Evidence |
|---|---|---|
| JavaScript syntax | PASS | `node --check shopify-theme-migration/assets/theme.js` passed |
| Theme Check | NOT RUN | No Shopify CLI or Theme Check was available; tooling was not installed |
| Shopify unpublished-theme upload | NOT TESTED | No Shopify store or upload credentials were used |
| Money formatter | PASS | 15 format cases and 4 invalid-input cases passed in Node VM |
| Negative money sign | PASS | Scoped formatter prepends the sign when the format does not contain one |
| JSON parsing | NOT RUN in this pass | JSON files were not changed |
| Existing/URL-selected variant combinations | NOT TESTED | Static implementation only; requires Shopify render |
| Nonexistent variant combinations | NOT TESTED | Static implementation only; requires Shopify render |
| Sold-out/all-sold-out variants | NOT TESTED | Native fallback and button state implemented statically |
| Variant price and compare-at updates | NOT TESTED | No Shopify storefront render |
| Add to cart | NOT TESTED | No Shopify store environment |
| Cart drawer refresh | NOT TESTED | Mutation and confirmed-cart rendering implemented statically |
| Cart quantity validation | PASS | Static code rejects fractional, negative, and nonnumeric values before requests |
| Cart update errors | NOT TESTED | Explicit status handling implemented statically |
| Checkout handoff | NOT TESTED | Native `routes.cart_url` checkout form added; no checkout executed |
| Payment | NOT TESTED | No payment test was attempted |
| Contact form | NOT TESTED | No Shopify store environment |
| Newsletter form | NOT TESTED | No Shopify store environment |
| App blocks | NOT TESTED | No app IDs or store apps configured |
| Arabic and English | NOT TESTED in browser | Locale strings remain unchanged; no visual browser test |
| Desktop/mobile | NOT TESTED | No visual renderer or browser store preview |
| Keyboard operation | NOT TESTED | Existing focus management was retained; no browser test |
| Visual comparison | NOT PERFORMED | No visual comparison was authorized or rendered |

## Remaining issues

- Theme Check remains unavailable in this environment.
- EGP storefront formatting and JavaScript-updated prices remain unverified.
- Variant, sold-out, add-to-cart, cart refresh, checkout, forms, app blocks, and RTL behavior require an unpublished Shopify theme preview.
- Checkout and payment testing are not possible without owner-authorized Shopify store access.
- The native no-JavaScript variant selector submits only an available choice because sold-out options are disabled.
- The all-sold-out state disables the native product submit control.
