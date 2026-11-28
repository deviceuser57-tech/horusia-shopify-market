# Test Report — Final Minimal Fix Pass

## Baseline and scope

- Branch: `migration/shopify-liquid-theme`
- Baseline HEAD: `ab31cc41f837a57d0b4b7656806de4715b2d9425`
- Baseline working tree: clean; no pre-existing modifications.
- No other background agent or command process was active at the start of this pass.
- No commit, push, upload, publish, deployment, ZIP rebuild, or live-store action occurred.

## Files changed

| File | Reason |
|---|---|
| `shopify-theme-migration/assets/theme.js` | Reject invalid money formats/values, avoid raw-price fallbacks, preserve last valid price output, handle explicit negative signs, guard checkout while cart state is pending/unknown, and reconcile failed cart updates. |
| `shopify-theme-migration/migration-docs/TEST-REPORT.md` | Replace prior-round claims with this pass's baseline, current behavior, test results, and remaining limitations. |

That statement applies to the original pass only. The separately approved translation follow-up is recorded below.

## Money formatting and error-path tests

The actual `moneyHtml`, `safeMoneyHtml`, and cart drawer rendering functions from `assets/theme.js` were exercised in an isolated Node VM. All output below is the function's actual HTML string, including escaped apostrophes where appropriate.

| Input minor units | Format | Expected output | Actual output | Result |
|---:|---|---|---|---|
| `0` | `${{amount}}` | `$0.00` | `$0.00` | PASS |
| `1` | `${{amount}}` | `$0.01` | `$0.01` | PASS |
| `99` | `${{amount}}` | `$0.99` | `$0.99` | PASS |
| `100` | `${{amount}}` | `$1.00` | `$1.00` | PASS |
| `123456` | `${{amount}}` | `$1,234.56` | `$1,234.56` | PASS |
| `123499` | `{{amount_no_decimals}}` | `1,235` | `1,235` | PASS |
| `123450` | `{{amount_no_decimals}}` | `1,235` | `1,235` | PASS |
| `123456789` | `{{amount}}` | `1,234,567.89` | `1,234,567.89` | PASS |
| `123456789` | `{{amount_no_decimals}}` | `1,234,568` | `1,234,568` | PASS |
| `123456789` | `{{amount_with_comma_separator}}` | `1.234.567,89` | `1.234.567,89` | PASS |
| `123456789` | `{{amount_no_decimals_with_comma_separator}}` | `1.234.568` | `1.234.568` | PASS |
| `123456789` | `{{amount_with_apostrophe_separator}}` | `1&#39;234&#39;567.89` | `1&#39;234&#39;567.89` | PASS |
| `123456789` | `{{amount_no_decimals_with_space_separator}}` | `1 234 568` | `1 234 568` | PASS |
| `123456789` | `{{amount_with_space_separator}}` | `1 234 567,89` | `1 234 567,89` | PASS |
| `123456789` | `{{amount_with_period_and_space_separator}}` | `1 234 567.89` | `1 234 567.89` | PASS |
| `123456789` | `{{amount_no_decimals_with_apostrophe_separator}}` | `1&#39;234&#39;568` | `1&#39;234&#39;568` | PASS |
| `-123456` | `{{amount}}` | `-1,234.56` | `-1,234.56` | PASS |
| `-123456` | `<span class="money-price">{{amount}}</span>` | `<span class="money-price">-1,234.56</span>` | `<span class="money-price">-1,234.56</span>` | PASS |
| `123456` | `<span class="money-price">{{amount}}</span>` | `<span class="money-price">1,234.56</span>` | `<span class="money-price">1,234.56</span>` | PASS |
| `-123456` | `-{{amount}}` | `-1,234.56` | `-1,234.56` | PASS |

Additional error-path results:

| Input | Expected | Actual | Result |
|---|---|---|---|
| `NaN`, `Infinity`, empty string, `1.5`, and `nope` as amounts | Reject; do not output minor units or zero | All rejected; drawer used existing cart-page link when no previously confirmed price existed | PASS |
| Missing Shopify money format | Reject formatting; no raw minor-unit fallback | Rejected; drawer used `/ar/cart` link | PASS |
| `{{unknown}}` format | Reject malformed/unrecognized placeholder | Rejected; drawer used `/ar/cart` link | PASS |
| Previously confirmed `$1.00`, then invalid amount/format for same cart key | Preserve prior formatted price | `$1.00` remained; raw value was not rendered | PASS |
| Invalid amount passed to `setMoney()` after `$1.23` was confirmed | Keep previous output | `$1.23` remained | PASS |
| `window.Shopify.formatMoney` sentinel | Leave Shopify global unchanged | Sentinel remained unchanged | PASS |

For negative values, the sign is applied to the numeric replacement. A single explicit leading `-` or `−` immediately before the amount placeholder (at the format start or after an HTML tag boundary) is retained instead of adding another sign. Other unrelated markup/text does not suppress the numeric sign.

At the original pass, no translated “price unavailable” message existed. That limitation was resolved in the approved follow-up below. For an unformattable cart price with no prior formatted value, the current cart rendering omits the amount, shows a localized unavailable-price message, and links to the localized cart page. Product prices retain their previously rendered valid value where available.

## Approved translation follow-up

- Baseline branch: `migration/shopify-liquid-theme`
- Baseline HEAD: `fca34eb6e883f2a0106423c4f4b02e5612fdf57e`
- Baseline working tree: clean.
- Files changed in this follow-up:
  - `shopify-theme-migration/assets/theme.js`: display the localized unavailable-price text with the existing cart link when a cart price cannot be formatted and no confirmed formatted value is available.
  - `shopify-theme-migration/layout/theme.liquid`: expose the translated message to JavaScript through the existing `data-i18n` JSON.
  - `shopify-theme-migration/locales/en.default.json`: add `general.cart.price_unavailable` as “Price unavailable”.
  - `shopify-theme-migration/locales/ar.json`: add `general.cart.price_unavailable` as “السعر غير متاح”.
  - `shopify-theme-migration/migration-docs/TEST-REPORT.md`: record this follow-up and its validation.
- Isolated Node VM rendering test: invalid money amount + English translation + `/en/cart` link produced `Price unavailable <a href="/en/cart">View cart</a>` — PASS.
- Isolated Node VM rendering test: invalid money amount + Arabic translation + `/ar/cart` link produced `السعر غير متاح <a href="/ar/cart">عرض السلة</a>` — PASS.
- `node --check shopify-theme-migration/assets/theme.js`: PASS.
- JSON parsing for both locale files: PASS.
- `git diff --check`: PASS.
- Browser rendering and Shopify storefront behavior: NOT TESTED.

## Cart-page tests

These scenarios exercised the actual cart-page handlers in a Node VM with mocked DOM events and mocked locale-aware Ajax responses. They are implementation tests, not browser tests.

| Scenario | Expected | Actual | Result |
|---|---|---|---|
| A. Successful quantity update | Reconcile server quantity; allow checkout after confirmation | Quantity and confirmed value became `3`; checkout was enabled after response | PASS |
| B. Update fails, reconciliation succeeds | Restore server quantity; show translated error; allow checkout once confirmed | Quantity restored to `2`; error shown; checkout enabled | PASS |
| C. Update and reconciliation both fail | Restore last confirmed visible quantity; keep checkout blocked; offer recovery | Quantity restored to `2`; checkout remained blocked; `/ar/cart` recovery link shown; submit prevented | PASS |
| D. Rapid consecutive changes (`2`, then `3`) | Serialize requests and apply later queued value | Only first request started initially; second started after first completed; final quantity `3` | PASS |
| E. Checkout during pending update | Prevent submit while pending; allow after confirmed response | Pending submit prevented; after success checkout enabled and submit not prevented | PASS |
| F. Invalid fractional quantity (`1.5`) | Reject before request and restore confirmed quantity | No request sent; quantity restored to `2`; translated validation message shown | PASS |

The native cart form has one idempotent `submit` listener. Mouse submission, Enter-key submission, and `requestSubmit()` are expected to dispatch that event, but those input methods were **NOT TESTED in a browser**. Synthetic submit events and the pending/success states were tested.

## Validation and remaining issues

| Check | Status | Notes |
|---|---|---|
| JavaScript syntax | PASS | `node --check shopify-theme-migration/assets/theme.js` |
| Theme Check | NOT RUN | Shopify CLI/Theme Check is unavailable; no tooling was installed |
| Cart mutation scenarios A–F | PASS | Isolated Node VM with mocked DOM/fetch; not a Shopify storefront |
| Shopify unpublished-theme upload | NOT TESTED | No store access used |
| Browser interaction and accessibility | NOT TESTED | No browser test performed |
| EGP storefront rendering | NOT TESTED | Formatting tests exercise patterns, not a configured EGP storefront |
| Checkout handoff or payment | NOT TESTED | No checkout/payment operation attempted |

The translated unavailable-price fallback is now implemented and passed isolated rendering checks. Browser rendering, Theme Check, and Shopify upload remain untested as noted above.
