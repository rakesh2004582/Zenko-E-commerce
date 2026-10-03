# Zenko — Next.js Storefront & Admin Panel

A full e-commerce frontend — public storefront, customer dashboard, and admin panel — built
with **Next.js 14 (App Router)**, **TypeScript**, and **Tailwind CSS**.

> This app is wired to a **real backend**: the
> [`hinoria_backend`](../hinoria_backend) Spring Boot + MySQL API.
> Only branding/theme content (`data/zenko/site.json`, `home.json`) is still local static
> JSON — everything else (products, categories, orders, users, reviews, coupons, inventory)
> comes from the backend. See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full picture.

---

## 1. Prerequisites

- **Node.js 20+**
- The backend running first — see [`../hinoria_backend/README.md`](../hinoria_backend/README.md)
  (or run both together from the repo root with `docker compose up --build`)

## 2. Setup

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

Open http://localhost:3000.

`.env.local` only needs one thing to point at your backend:

```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## 3. Default login

Seeded automatically by the backend on first boot — **this is the only account that exists
out of the box**; there is no separate demo customer account until you register one through
the storefront's own sign-up flow.

```
email:    admin@henoria.com
password: Admin@123
```

Log in at `/login`, then visit `/admin` — access is gated client-side to users whose role
(returned by the backend) is `admin`.

---

## 4. Project structure

```
e-com-henoria-test-frontend/
├── app/
│   ├── (store)/                  # Public store pages
│   │   ├── page.tsx              # Home page
│   │   ├── girls/, boys/, bags/  # Category listing pages
│   │   ├── product/[cat]/[id]/   # Product detail
│   │   ├── checkout/             # Checkout flow (real COD order via the API)
│   │   ├── order-confirmation/
│   │   ├── search/
│   │   └── login/                # Login + register (real JWT auth)
│   ├── (user)/dashboard/         # Customer dashboard (protected)
│   │   ├── orders/                # Real order history + tracking
│   │   ├── profile/, address/, wishlist/
│   ├── (admin)/admin/            # Admin panel (admin-only)
│   │   ├── page.tsx              # Dashboard + stats
│   │   ├── products/, categories/, orders/, inventory/, users/, coupons/, reviews/
│   └── api/                      # Thin Next.js route handlers, e.g. app/api/products
├── components/
│   ├── layout/                   # Navbar, Footer, CartSidebar
│   └── shop/                     # ProductCard, ProductListing, ProductDetailClient
├── data/henoria/                 # STATIC presentational config only (site.json, home.json)
├── lib/
│   ├── apiClient.ts               # fetch wrapper — attaches JWT + guest-cart id to every call
│   ├── mappers.ts                 # backend DTO → frontend type shape conversion
│   ├── dataLoader.ts              # same function names as the old mock version, now backed
│   │                               # by real API calls (search/sort/filter/pagination happen
│   │                               # server-side in the backend)
│   └── store.ts                   # Zustand: cart, auth, wishlist client state
└── types/index.ts                 # Shared TypeScript types
```

## 5. How data flows

- **`lib/apiClient.ts`** attaches the JWT (from the Zustand auth store) and a guest-cart id
  (`X-Guest-Id` header, so an anonymous visitor's cart persists) to every request.
- **`lib/dataLoader.ts`** keeps the same function signatures the UI already expects
  (`getAllProducts`, `getProductById`, …) but each one now calls the backend instead of
  reading a JSON file — so pages/components didn't need to change shape, only their data
  source underneath.
- **`lib/mappers.ts`** converts backend response DTOs (numeric ids, uppercase enum values
  like `PENDING`/`DELIVERED`) into the shapes the existing UI components already expect.

## 6. Features

**Storefront** — home page, category browsing, mega-menu navigation, product detail with
gallery/size selector/reviews, cart sidebar, wishlist, search, filter/sort, coupon-aware
checkout, order confirmation.

**Customer dashboard** — login/register, order history with status timeline, profile editor,
address book, wishlist.

**Admin panel** (`/admin`) — dashboard with stats, product CRUD (with image upload to the
backend), category CRUD, order management with status updates, inventory view, user
management, coupon CRUD, review moderation.

## 7. Known simplifications

- The category/gender listing pages currently filter/sort client-side over the full product
  list; `lib/dataLoader.ts` also exposes a `browseProducts()` helper that does this
  server-side (pagination/filter/sort) if you want to migrate those pages over.
- The customer dashboard is intentionally minimal. The backend already supports order
  cancellation (`POST /api/orders/{id}/cancel`) — there's no button wired up for it yet.
- Product images are plain `<img>` tags pointing at the backend's `/uploads/...` static path.
  Fine for local dev; for a real deployment, point `NEXT_PUBLIC_API_URL` at your production API
  domain (and consider moving uploads to S3/Cloudinary instead of local disk).
- No online payment gateway — Cash on Delivery only, matching the backend.

## 8. Tech stack

| Tool             | Purpose                  |
|------------------|---------------------------|
| Next.js 14 (App Router) | Framework           |
| TypeScript       | Type safety                |
| Tailwind CSS     | Styling                    |
| Zustand          | Client state (cart/auth/wishlist) |
| react-hot-toast  | Notifications               |
| lucide-react     | Icons                       |
| swiper           | Carousels                   |

## 9. Adding a second storefront brand (multi-tenant)

The `data/henoria/` folder is read via a `client` parameter in `lib/dataLoader.ts`'s static
config functions. To add another brand:

1. Duplicate `data/henoria/` as `data/<client>/` and edit `site.json` (branding/theme) and
   `home.json` (banners).
2. Pass `client=<client>` through wherever `getSiteConfig`/`getHomeConfig` are called, or wire
   up subdomain-based routing.

This only applies to the static presentational config — product/order/user data is shared
through the one backend unless you also stand up a second backend/database per tenant.
