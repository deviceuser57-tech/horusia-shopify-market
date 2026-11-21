# Integrated Architecture Blueprint: Tumāninah Veritas & ZOOS Smart Electronics

## Executive Overview

This document defines the unified, production-grade architectural blueprint for the integrated **Tumāninah Veritas Store** (`eagles-veritas-shop`) & **ZOOS Smart Electronics** system. The integrated architecture merges luxury Egyptian heritage craftsmanship, artisan goods, and smart tech retail into a scalable, hybrid omnichannel platform.

The system natively supports **three core business models**:
1. **Direct Retail (Owned Inventory)**: Physical stock stored in main warehouses or the X-Mall retail booth (New Cairo), backed by local POS register scanning, serial/IMEI warranty tracking, and atomic inventory reservation.
2. **Multi-Supplier Dropshipping**: Automated order placement, supplier sync, margin calculations, and tracking fulfillment via CJdropshipping and WooCommerce webhooks.
3. **Affiliate Marketing**: External outbound referral flows with click analytics and commission tracking without managing logistics.

---

## 1. High-Level System Architecture (C4 System Context)

```
+--------------------------------------------------------------------------------------------------+
|                                  CLIENT LAYER (React 18 + Vite SPA)                               |
|                                                                                                  |
|  +---------------------------+  +--------------------------+  +-------------------------------+  |
|  |   Storefront SPA Pages    |  |  Omnichannel Admin Suite |  |  X-Mall POS Thermal Register  |  |
|  |  (Navy/Silver/Gold Theme) |  |   (AdminPortal & BI)     |  |   (Serial / Barcode Scanner)  |  |
|  +---------------------------+  +--------------------------+  +-------------------------------+  |
|  +---------------------------+  +--------------------------+  +-------------------------------+  |
|  |   AI Image & Text Studio  |  |   Dropship Ops Portal    |  |    Product Comparison Modal   |  |
|  +---------------------------+  +--------------------------+  +-------------------------------+  |
+-----------------------------------------------|--------------------------------------------------+
                                                | HTTPS / REST / WSS / GraphQL
                                                v
+--------------------------------------------------------------------------------------------------+
|                               API GATEWAY & BACKEND INTEGRATION LAYER                            |
|                                                                                                  |
|  +-----------------------------+  +----------------------------+  +----------------------------+ |
|  |     Lovable AI Gateway      |  | Edge Functions & Outbox    |  |  Paymob HMAC SHA-512       | |
|  | (Gemini 1.5 Flash Endpoint) |  |  (Async Order Processor)   |  |   Webhook Verification     | |
|  +-----------------------------+  +----------------------------+  +----------------------------+ |
+-----------------|-----------------------------|-----------------------------|--------------------+
                  |                             |                             |
                  v                             v                             v
+---------------------------------+  +-------------------------+  +--------------------------------+
|     EXTERNAL SERVICES LAYER     |  | SUPABASE / CLOUD PG DB  |  |   SHOPIFY STOREFRONT GRAPHQL   |
|                                 |  |                         |  |                                |
|  • CJdropshipping API v2.0      |  | • PostgreSQL RLS & RPC  |  | • Storefront API 2025-07       |
|  • WooCommerce REST API v3      |  | • Supabase Auth JWT     |  | • Cart & Checkout Mutations    |
|  • WhatsApp Cloud API           |  | • Transactional Outbox  |  | • Catalog & Collections        |
+---------------------------------+  +-------------------------+  +--------------------------------+
```

---

## 2. Core Components & Subsystems

### 2.1 Storefront & User Interface (`/src`)
- **Theme & Design System**: Tailwind CSS with "Navy & Silver Professional" palette, gold accents (`from-primary via-accent to-gold`), light/dark mode persistence via `ThemeProvider`.
- **Navigation & Layout**: `Navbar.tsx` featuring dynamic Shopify collection links, search modal trigger, Supabase user status, and quick slide-out `CartDrawer.tsx`.
- **Egyptian Heritage Experience**: `EgyptianPopup.tsx` promoting handcrafted Egyptian art with a 30-day `localStorage` dismissal lock (`egyptianPopupDismissed`).
- **Product Matrix & Search**: `ProductCard.tsx` displaying badges (Winning Product, Heritage, Dropship, Affiliate), multi-currency dynamic formatting (`SAR`, `AED`, `EGP`, `USD`), and `ProductComparisonModal.tsx` comparing up to 4 items side-by-side.

### 2.2 Omnichannel Admin & Control Suite (`AdminPortal.tsx`)
- **Product & Inventory Management**: CRUD control supporting flexible product types (`owned_stock`, `dropship`, `affiliate`), price maker-checker workflows (`price_change_requests`), and low-stock triggers (`StockAlertManager`).
- **Promotional Hero Banner Studio (`HeroBannerStudio`)**: Live preview banner builder for headline text, overlay layers, discount badges, and CTA action targeting.
- **BI Dashboard (`BIDashboard.tsx`)**: Financial metrics using Recharts (Revenue trend area chart, visitor funnel pie chart, top products bar chart) broken down by business model channel.

### 2.3 AI Ingestion & Enrichment Engine (`AiProductRefiner.ts`)
- **API Endpoints**:
  - `POST /api/ai/extract-product`: Uses Gemini 1.5 Flash (`urlContext`) to extract title, description, USD price, specs array, brand compatibility, and color variants from supplier URLs.
  - `POST /api/ai/refine-product`: Generates SEO-optimized Arabic/English copy, target keywords, URL slug, and marketing descriptions styled by preset themes (`cyberpunk-neon`, `minimalist-titanium`, `exploded-engineering`, `magsafe-levitation`).
  - `POST /api/ai/process-image`: Accepts Base64 images and style prompts to re-render studio shots.
  - `POST /api/ai/enhance-description`: Generates high-density technical specs in Arabic.

### 2.4 Physical Retail POS & Warranty System (`PosRegisterModal.tsx`)
- **Offline/Online POS Module**: Barcode & SKU scanner integration, manual or scanned serial/IMEI registration per item, cash/card/InstaPay processing.
- **Location Stock Deduction**: Instant balance deduction against location `loc-xmall`.
- **Thermal Receipt Layout (`PosReceipt.tsx`)**: Optimized for standard 80mm thermal printers using `window.print()` styles, featuring itemized 15% VAT breakdown and warranty terms.
- **Serial Warranty Tracking (`product_serials`)**: Lifecycle tracking (`in_stock`, `reserved`, `sold`, `rma_defective`, `transferred`, `returned`) with 12/18/24-month coverage rules.

### 2.5 Multi-Supplier Dropshipping Engine (`DropshipOpsPortal.tsx`)
- **CJdropshipping Integration (`CJOrderAdapter.ts`)**: Token acquisition via `https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken` and automated order push to `https://developers.cjdropshipping.com/api2.0/v1/shopping/order/createOrder`.
- **WooCommerce Dropship Adapter (`GenericDropshipAdapter.ts`)**: POST order JSON payloads to `{endpointUrl}/wp-json/wc/v3/orders` via Basic Auth.
- **Margin Calculator**: Real-time margin auditing: `Profit = Retail Price (USD) - Supplier Cost (USD) - Estimated Freight`.

---

## 3. Data Architecture & Entity Relationship Blueprint

```
+--------------------------------------------------------------------------------------------------+
|                                    DATABASE SCHEMA BLUEPRINT                                     |
+--------------------------------------------------------------------------------------------------+

   [ profiles ] 1 ──── N [ price_change_requests ]
   (id, role, full_name, phone)

   [ products ] 1 ──── N [ product_variants ] 1 ──── N [ owned_stock_balances ]
   • id                  • id                         • variant_id (FK)
   • sku                 • product_id (FK)            • location_id (FK)
   • title_ar / title_en • name_ar / name_en          • quantity_on_hand
   • price_usd           • color_hex                  • quantity_reserved
   • source_type         • extra_price_usd            • usable (GENERATED)
   • supplier_cost_usd
   • supplier_name
   • affiliate_url

   [ product_variants ] 1 ──── N [ serial_numbers ]
                                 • id, serial_number, imei, status, warranty_expires_at

   [ orders ] 1 ──── N [ order_items ]
   • id, order_number, customer_name, fulfillment_type, payment_method, total_usd, profit_usd

   [ transactional_outbox ]
   • id, event_type, aggregate_type, aggregate_id, payload, status, retry_count
```

### 3.1 Key Tables & Columns
- `products`: Base catalog details including `source_type` (`owned`, `dropship`, `affiliate`), `price_usd`, `supplier_cost_usd`, `affiliate_url`, and `warranty_months`.
- `owned_stock_balances`: Inventory balances per location (`loc-xmall`, `loc-warehouse`). Stores `quantity_on_hand` and `quantity_reserved`.
- `serial_numbers`: Unique serial/IMEI warranty tracking records linked to specific variant items.
- `orders`: Master order records tracking `fulfillment_type` (`courier_delivery`, `click_and_collect_xmall`), `payment_method`, `payment_status`, and financial metrics (`total_usd`, `profit_usd`).
- `transactional_outbox`: Event log for reliable async processing (WhatsApp notifications, CJ order sync, webhook triggers).

---

## 4. Concurrency & Security Engineering

### 4.1 Atomic Stock Reservation (`reserveStockAtomic`)
To eliminate race conditions and overbooking during high-volume sales, stock reservation is executed inside PostgreSQL using row-level pessimistic locking (`SELECT FOR UPDATE`):

```sql
CREATE OR REPLACE FUNCTION reserve_stock_atomic(
  p_variant_id UUID,
  p_location_id TEXT,
  p_qty INT,
  p_order_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_available INT;
BEGIN
  -- Lock balance row for update
  SELECT (quantity_on_hand - quantity_reserved) INTO v_available
  FROM owned_stock_balances
  WHERE variant_id = p_variant_id AND location_id = p_location_id
  FOR UPDATE;

  IF v_available IS NULL OR v_available < p_qty THEN
    RETURN FALSE;
  END IF;

  -- Reserve stock
  UPDATE owned_stock_balances
  SET quantity_reserved = quantity_reserved + p_qty
  WHERE variant_id = p_variant_id AND location_id = p_location_id;

  -- Insert event into outbox
  INSERT INTO transactional_outbox (event_type, aggregate_type, aggregate_id, payload, status)
  VALUES ('STOCK_RESERVED', 'order', p_order_id::text, jsonb_build_object('variant_id', p_variant_id, 'qty', p_qty), 'PENDING');

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4.2 Paymob Webhook HMAC Verification (`PaymobHMACValidator`)
Payment callbacks are validated by SHA-512 hashing 19 concatenated payload parameters in strict key order with the Paymob Secret key:

**Concatenation Sequence**:
`amount_cents` + `created_at` + `currency` + `error_occured` + `has_parent_transaction` + `id` + `integration_id` + `is_3d_secure` + `is_auth` + `is_capture` + `is_standalone_payment` + `is_voided` + `order` + `owner` + `pending` + `source_data_pan` + `source_data_sub_type` + `source_data_type` + `success`

---

## 5. End-to-End Data Flows

### 5.1 Hybrid Fulfillment & Checkout Flow

```
[ Customer ] ───> Select Items in Storefront ───> Cart Engine calculates split groups:
                                                    ├── Group A: Owned Stock (X-Mall / Pickup)
                                                    └── Group B: Dropship Supplier (CJ)
                                                                 │
                                                                 v
                                                    Customer selects Payment Method:
                                                    ├── Paymob (Card/InstaPay)
                                                    └── Cash on Delivery (COD)
                                                                 │
                                                                 v
                                                    PostgreSQL `reserve_stock_atomic`
                                                    (Pessimistic lock on `owned_stock_balances`)
                                                                 │
                                             ┌───────────────────┴───────────────────┐
                                             v                                       v
                                [ Paymob Webhook Verification ]           [ COD Order Confirmation ]
                                (SHA-512 HMAC Check)                                │
                                             │                                       │
                                             └───────────────────┬───────────────────┘
                                                                 v
                                                   Outbox Event: `ORDER_CONFIRMED`
                                                                 │
                                             ┌───────────────────┴───────────────────┐
                                             v                                       v
                              [ CJ Dropship Order Adapter ]              [ Automated WhatsApp Outbox ]
                              POSTs to CJ API v2.0                       Notifies customer & ops
```

---

## 6. Deployment & Infrastructure Architecture

- **Frontend Host**: Vercel / Lovable Cloud hosting the static SPA bundle, deployed with CDN edge caching for sub-2-second page loads worldwide.
- **Edge API Gateway**: Serverless Functions / Lovable Gateway holding environment secrets (`GEMINI_API_KEY`, `PAYMOB_HMAC_SECRET`, `CJ_API_KEY`).
- **Database & Auth**: Supabase PostgreSQL with SSL connection pooling, automated daily snapshots, and strict Row Level Security (RLS) policies based on `auth.jwt() -> role`.
- **E-Commerce Backend**: Shopify Storefront API (GraphQL) handling cart creation, product queries, and checkout redirect fallback.

---

## 7. Migration Implementation Plan (4 Phases)

1. **Phase 1: Component & Portal Integration**
   - Integrate `AdminPortal.tsx` and `HeroBannerStudio` under protected `/admin` routing.
   - Connect dynamic banner state directly to PostgreSQL banner table.

2. **Phase 2: AI Gateway & Ingestion Setup**
   - Refactor AI extraction calls to route through secure Lovable AI Edge Functions using Gemini 1.5 Flash.
   - Implement bulk URL importer for suppliers.

3. **Phase 3: Dropshipping & Affiliate Calculator**
   - Deploy `DropshipOpsPortal.tsx` with CJdropshipping v2.0 order adapter and WooCommerce REST client.
   - Add outbound click tracking for affiliate product CTA buttons.

4. **Phase 4: Concurrency, Payment & POS Hardening**
   - Migrate stock updates to PostgreSQL `reserve_stock_atomic` RPC function.
   - Integrate Paymob HMAC validator for checkout webhooks and finalize thermal receipt thermal printing styles.
