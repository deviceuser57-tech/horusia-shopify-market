# Source Component to Theme Mapping

| Source component/page | Theme section/template |
|---|---|
| `src/components/Navbar.tsx` | `sections/header.liquid` |
| `src/components/Footer.tsx` | `sections/footer.liquid` |
| `src/components/HeroCarousel.tsx` | `sections/hero-carousel.liquid` |
| `src/components/admin/HeroBannerStudio.tsx` | Theme editor controls in hero blocks and settings |
| `src/pages/Index.tsx` | `templates/index.json` with carousel and featured collection sections |
| `src/pages/Shop.tsx` | Shopify collections/all routing |
| `src/pages/Collections.tsx` | `templates/list-collections.json` |
| `src/pages/CollectionDetail.tsx` | `templates/collection.json` |
| `src/pages/ProductDetail.tsx` | `templates/product.json` and `sections/main-product.liquid` |
| `src/components/ProductCard.tsx` | `snippets/product-card.liquid` |
| `src/stores/cartStore.ts` | Native Shopify cart plus `assets/theme.js` Ajax cart enhancement |
| `src/components/CartDrawer.tsx` | `snippets/cart-drawer.liquid` |
| `src/pages/About.tsx` | `templates/page.about.json` |
| `src/pages/Contact.tsx` | `templates/page.contact.json` |
| `src/pages/Services.tsx` | `templates/page.services.json` |
| `src/pages/Shipping.tsx` | Shopify shipping policy page |
| `src/pages/Refund.tsx` | Shopify refund policy page |
| `src/pages/Privacy.tsx` | Shopify privacy policy page |
| `src/pages/Terms.tsx` | Shopify terms of service policy page |
| `src/pages/NotFound.tsx` | `templates/404.json` |
| `src/components/StructuredData.tsx` | Shopify-native SEO and resource metadata; product structured data is not duplicated |
| `src/components/SearchBar.tsx` | `/search` native form in `sections/main-search.liquid` |
| `src/pages/admin/*` | Removed; no theme replacement |
| Supabase/Affiliate/AI/connector components | Removed; optional apps require later owner assessment |
