# Architecture — Henoria Backend

## 1. System overview

```
                         ┌───────────────────────────────────────┐
                         │        Next.js frontend (3000)         │
                         │  e-com-henoria-test-frontend            │
                         │  lib/apiClient.ts → fetch(NEXT_PUBLIC_  │
                         │  API_URL + "/api/...")                  │
                         └───────────────┬─────────────────────────┘
                                          │ HTTPS / JSON, JWT bearer token
                                          ▼
                         ┌───────────────────────────────────────┐
                         │     Spring Boot backend (8080)          │
                         │     e-com-henoria-backend-test           │
                         │                                          │
                         │  Controller → Service → Repository → JPA │
                         └───────────────┬─────────────────────────┘
                                          │ JDBC
                                          ▼
                              ┌───────────────────────┐
                              │       MySQL 8           │
                              │       database: henoria │
                              └───────────────────────┘
```

The frontend never reads a database directly and no longer reads the bundled mock JSON
files in `data/henoria/*.json` for live data (those files now only back static, purely
presentational content such as `site.json` theme/branding). All products, categories,
orders, users, reviews, coupons and inventory come from this backend's REST API.

## 2. Layered design (backend)

```
controller/   → HTTP boundary only: request mapping, @Valid, status codes
dto/          → Request/response shapes — never expose entities directly
service/      → Business rules (interfaces) + service/impl (implementations)
entity/       → JPA entities — the persistence model
repository/   → Spring Data JPA repositories (+ repository/spec for dynamic queries)
security/     → JWT filter, user details service, principal
config/       → Security, CORS, Jackson, web (static resource mapping for /uploads), seed data
exception/    → Centralized error handling (GlobalExceptionHandler)
util/         → Small stateless helpers (slug generation, order number generation)
```

This is a classic **layered/N-tier** architecture rather than hexagonal/clean architecture —
appropriate for a project of this size. Controllers depend on service *interfaces*
(`ProductService`, `OrderService`, …), with concrete logic in `service/impl`, which keeps
controllers thin and services swappable/testable.

## 3. Request lifecycle

1. Request hits Tomcat → Spring's `DispatcherServlet`.
2. `JwtAuthFilter` (registered before `UsernamePasswordAuthenticationFilter`) reads the
   `Authorization: Bearer <token>` header if present, validates it with `JwtUtil`, and — if
   valid — populates the `SecurityContext` with a `UserPrincipal`.
3. `SecurityConfig`'s `SecurityFilterChain` authorizes the route:
   - `/api/auth/**`, public `GET /api/products|categories|reviews|coupons`, `/api/cart/**`,
     `/api/wishlist/**`, `POST /api/contact`, `POST /api/orders`… → public
   - `/api/admin/**` → requires `ROLE_ADMIN`
   - everything else → requires a valid JWT
4. Controller validates the request body (`@Valid` + Bean Validation annotations on DTOs).
5. Controller delegates to a service method; the service applies business rules and calls
   one or more repositories.
6. Entities are mapped to response DTOs (never returned directly) and wrapped in a common
   `ApiResponse<T>` / `PagedResponse<T>` envelope.
7. `GlobalExceptionHandler` turns thrown exceptions (`ResourceNotFoundException`,
   `BadRequestException`, `DuplicateResourceException`, validation errors) into consistent
   JSON error responses instead of raw stack traces.

## 4. Domain model (core entities)

- **User** — customer/admin/seller account; `Role` enum (`CUSTOMER`, `ADMIN`, `SELLER`)
- **Address** — belongs to a `User`; used at checkout
- **Category** — hierarchical (self-referencing) product categories
- **Product** — belongs to a `Category`; `price` + `discountPercent` → `finalPrice`
  recalculated on save; soft-deleted via `active`
- **Inventory** — per-`Product` **and per size** stock count; this is the row that actually
  moves on order placement/cancellation
- **Cart** / **CartItem** — supports both logged-in users and guests (`X-Guest-Id` header)
- **Coupon** — `CouponType` (percentage/flat), validity window, min order value, usage limits
- **Order** / **OrderItem** / **OrderStatusHistory** — an order snapshots product price and
  size at the time of purchase (so later product edits don't retroactively change historical
  orders); `OrderStatus` and `PaymentStatus` are separate enums (see the state machine below)
- **Review** — product rating/comment; product's aggregate rating is recalculated whenever a
  review is added
- **Seller** — seller application/profile; `SellerStatus` enum for approval workflow
- **ContactMessage** — stored submissions from the public contact form

## 5. Order state machine (the trickiest part of this system)

```
OrderStatus:    PENDING → CONFIRMED → SHIPPED → DELIVERED
                     \                              
                      └──────────► CANCELLED (from PENDING/CONFIRMED only)

PaymentStatus (COD):  PENDING ───────────────────────► PAID
                                (flips automatically, only when
                                 OrderStatus transitions to DELIVERED)
```

Rules enforced in `OrderServiceImpl`:
- Placing an order deducts per-size stock from `Inventory` and validates any applied coupon
  (active window, min order value, usage cap) before committing.
- Cancelling an order (`POST /api/orders/{id}/cancel`) is only allowed from a cancellable
  status and **restores** exactly the stock quantities that were deducted.
- `paymentStatus` cannot be set directly by a client — it is derived from `OrderStatus`, so
  an order can never reach `PAID` without first legitimately reaching `DELIVERED`.
- Every status change is appended to `OrderStatusHistory` for an auditable timeline.

Anyone extending this project should treat this state machine as the thing to protect first —
it's the one piece of business logic where a shortcut (e.g. letting a client PATCH
`paymentStatus` directly) would silently corrupt financial data.

## 6. Cross-cutting concerns

- **Security** — see `config/SecurityConfig.java`. Stateless JWT, BCrypt passwords, CORS
  origins from `CORS_ALLOWED_ORIGINS`, method-level security enabled (`@EnableMethodSecurity`).
- **Validation** — Bean Validation (`jakarta.validation`) annotations on every request DTO;
  violations become structured 400 responses via `GlobalExceptionHandler`.
- **File uploads** — `FileUploadController` writes to `UPLOAD_DIR` (default
  `uploads/products`) and `WebConfig` maps that directory to the public `/uploads/**` URL path.
- **Email** — `EmailService` calls the EmailJS REST API **server-side** (welcome, order
  confirmation, order status update, contact, password reset). Disabled by default
  (`EMAILJS_ENABLED=false`) so the app runs with zero external dependencies out of the box.
- **Observability** — Actuator + Micrometer/Prometheus exposed at `/actuator/**`
  (`health`, `info`, `metrics`, `prometheus`).
- **API docs** — springdoc generates OpenAPI 3 from the controllers/DTOs directly, served at
  `/swagger-ui.html`; this is kept in sync automatically and is the canonical contract.

## 7. Why these decisions

| Decision | Reasoning |
|---|---|
| Layered architecture over hexagonal | Small enough domain that ports/adapters would add ceremony without real benefit; still testable because controllers depend on service interfaces. |
| `ddl-auto: update` + programmatic seed instead of Flyway | Fastest path to "clone and run" for a learning/evaluation project; documented in README as a deliberate trade-off, with a generated `db/schema.sql` snapshot for anyone who wants a static reference. |
| DTOs everywhere, never return entities | Avoids leaking JPA proxies/lazy-loading exceptions over JSON and decouples the wire format from the persistence model. |
| Stateless JWT, no sessions | Matches a decoupled SPA frontend and horizontally scales without sticky sessions. |
| Soft delete for products/categories | Historical orders and reviews must keep referring to something even after a product is discontinued. |
| Payment status derived, not settable | The single most important invariant in an e-commerce system: money status must follow fulfillment status, not the other way round. |
