# Architecture — Henoria Frontend

## 1. Where this sits in the system

```
Browser ──► Next.js server (App Router, SSR + a few Route Handlers) ──► Spring Boot API (8080)
                        │
                        └─► data/henoria/site.json, home.json  (static branding config only)
```

There is **no database connection from the frontend**. Every domain read/write (products,
categories, orders, users, reviews, coupons, inventory) goes through `lib/apiClient.ts` to the
backend's REST API. The only local data source left is presentational config — theme colors,
fonts, nav/footer structure, homepage banners — which genuinely belongs in the frontend
because it's UI configuration, not business data.

## 2. Layer responsibilities

```
app/                → Routes (pages) + a few thin API route handlers
components/          → Presentational + light client-state components
lib/apiClient.ts     → All HTTP to the backend — the ONLY place fetch() to the backend happens
lib/dataLoader.ts    → Domain-shaped functions (getAllProducts, placeOrder, …) that pages call;
                       internally calls apiClient + mappers
lib/mappers.ts       → Backend DTO ⇄ frontend type translation (the anti-corruption layer)
lib/store.ts         → Zustand stores for client-only state: cart, auth token, wishlist
types/index.ts       → The frontend's own type vocabulary — pages/components code against this,
                       not against backend DTOs directly
```

Pages and components are written against `lib/dataLoader.ts` and `types/index.ts`, **not**
against the backend's DTOs or `apiClient` directly. That indirection is what let this app be
re-pointed from static JSON files to a real backend without rewriting every page — only
`dataLoader.ts` and `mappers.ts` changed.

## 3. Auth flow

1. `/login` submits to `POST /api/auth/login` (or `/api/auth/register`) via `apiClient`.
2. The JWT returned by the backend is stored in the Zustand auth store
   (`lib/store.ts`), persisted to `localStorage` under `henoria-auth`.
3. `apiClient.getToken()` reads it back out and attaches
   `Authorization: Bearer <token>` to every subsequent request.
4. Admin-only pages under `app/(admin)/admin` check the decoded role client-side before
   rendering; the backend independently re-enforces this with `hasRole("ADMIN")`, so the UI
   check is a UX convenience, not the actual security boundary.

## 4. Guest cart/wishlist

Anonymous visitors get a random id (`crypto.randomUUID()`) stored in `localStorage` as
`henoria_guest_id` and sent as the `X-Guest-Id` header on cart/wishlist requests. The backend
keys guest carts by this id instead of a user id, so a cart persists across a session without
requiring login, and can later be merged into a real account after login (see `CartService`
on the backend).

## 5. Rendering strategy

- Server Components fetch data at request time via `dataLoader.ts` → `apiClient.ts` (which
  runs on the Next.js server for SSR'd pages, and in the browser for client-triggered actions
  like "Add to cart" or admin form submits).
- `app/layout.tsx` fetches `site.json`/theme config once per request to drive fonts/CSS
  variables and page metadata.
- A handful of `app/api/*` route handlers exist as thin server-side proxies (e.g.
  `app/api/products/route.ts`) for cases where a client component needs a same-origin JSON
  endpoint rather than calling the backend cross-origin directly.

## 6. Why these decisions

| Decision | Reasoning |
|---|---|
| Keep `dataLoader.ts`'s original function signatures when swapping to the real backend | Let every existing page/component keep working unchanged — only the implementation underneath moved from `fs.readFile` to `fetch`. |
| Separate `mappers.ts` from `apiClient.ts` | Backend DTOs (numeric ids, uppercase enums) and frontend types (string ids, lowercase status values used in existing UI logic) are different vocabularies; isolating the translation in one file means a backend field rename touches one file, not every page. |
| JWT in `localStorage` via Zustand persist, not cookies | Matches this being a decoupled SPA-style app talking cross-origin to a separately-deployed API; simplest to reason about for a learning/evaluation project. A production hardening pass would weigh this against `httpOnly` cookies to reduce XSS exposure of the token. |
| Guest cart via header, not cookies | Works identically whether the frontend and backend are same-origin or not, without relying on browser cookie/CORS credential nuances. |
| Static JSON kept only for branding/theme | That data changes per *deployment*, not per *transaction* — it doesn't need a database round-trip, and keeping it in the repo makes forking a themed storefront trivial. |
