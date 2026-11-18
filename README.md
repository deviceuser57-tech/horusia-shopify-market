# Tumāninah Veritas Store

🎯 Project Goal:
Build an independent eCommerce website frontend for “Eagles One Store (Tumāninah Veritas – One Stop Store)” connected to Shopify backend via Shopify Storefront API.

💻 Platform:
- Use Shopify Storefront API for all products, collections, checkout, and customer data.
- The frontend should be standalone, responsive, and built using a modern stack (React, Vite, or Next.js).
- Integrate the site easily with Shopify Admin and Cloud backend.

🧱 Site Architecture:
1. Home Page:
   - Hero Section with the brand slogan “Tumāninah Veritas – One Stop Store”
   - Dynamic Featured Products from Shopify API
   - About Us mini section (philosophy, mission)
   - Newsletter signup (connected to Mailchimp or Shopify Marketing)
   - Testimonials carousel (customer reviews from Shopify)

2. Shop Page:
   - Fetch all products via Shopify GraphQL API
   - Category filter and search
   - Product cards with “Add to Cart” and “Quick View”
   - Product detail page with multiple images, reviews, price, and share options

3. Services Page:
   - Custom Orders / Gift Cards / Corporate Offers
   - Integrated form to send inquiries (connected to store email)

4. About Page:
   - Story of the brand (calmness, faith, trust, modern lifestyle)
   - Vision & values in a visually aesthetic layout

5. Contact Page:
   - Contact form (email to support@eaglesonestore.com)
   - WhatsApp quick contact button
   - Map (Google Maps iframe of business location)

6. Account Section:
   - Login / Register with Shopify customer authentication
   - Orders history, wishlist, subscriptions

7. Cart + Checkout:
   - Persistent cart synced with Shopify backend
   - Checkout redirect to Shopify checkout page or embedded checkout (if allowed)

8. Footer:
   - Policies (Shipping, Refund, Privacy)
   - Social media links (Instagram, Facebook, TikTok)
   - Multi-currency toggle (USD, EGP, EUR)

🎨 Design Style:
- Modern minimalist with warm neutral tones (creamy beige, coffee brown, gold accent)
- Typography: Elegant sans-serif (e.g., Lato / Poppins)
- Use soft hover animations and glassmorphism on cards
- Light/Dark theme toggle
- Hero banner with ambient parallax effect

⚙️ Technical Requirements:
- SEO optimized (meta tags, structured data)
- Fully responsive (mobile, tablet, desktop)
- Lazy-loading for images
- Google Analytics + Meta Pixel integration
- PWA-ready (progressive web app features)
- Accessible (WCAG 2.1 compliant)

🧩 Integration:
- Connect Shopify Storefront API (fetch products, checkout, reviews)
- Connect Shopify Admin API for stock & order sync
- Optional: connect Google Sheets or Firebase as auxiliary DB for analytics
- Support international currencies (via Shopify Markets)

💰 Monetization:
- Enable international shipping + region selector
- Add optional affiliate links and upsells on product pages

📈 Success Criteria:
- Page loads under 2 seconds
- Bounce rate < 40%
- At least 5 conversion-ready CTAs per page
- Fully functional on mobile
- Seamless checkout flow

🪄 Deliverables:
- Live preview link
- Editable components (Hero, Products, Footer)
- Integrated Shopify API key fields
- Source code export (React or Next.js)

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://eagles-veritas-shop.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4ee2702f-f225-4d1b-b513-22e372189201).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
