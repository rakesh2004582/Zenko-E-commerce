-- =====================================================================
-- Zenko E-Commerce — reference seed data (MySQL 8)
--
-- Optional. The application seeds this same data itself on first boot
-- via `config/DataInitializer.java` — you do not need to run this file
-- to get a working local environment. Use it only if you provisioned
-- the schema with schema.sql and want data without booting the app.
--
-- Usage:
--   mysql -u root -p zenko_ecom < seed.sql
-- =====================================================================

USE zenko_ecom;

-- Default admin — email: admin@zenko.com / password: Admin@123
-- (BCrypt hash below is a real hash of "Admin@123" — change this password
-- immediately in any shared/non-local environment.)
INSERT INTO users (name, email, password, role, active, created_at)
SELECT 'Zenko Admin', 'admin@zenko.com',
       '$2b$12$DOboZKJWjaMrhFT0hfF9ouVGrInnKePNFwZt2kN6zF.j9AG7.gVeC',
       'ADMIN', TRUE, NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@zenko.com');

-- Top-level categories
INSERT INTO categories (slug, name, gender, parent_slug, active)
SELECT * FROM (SELECT 'men' AS slug, 'Men' AS name, 'MALE' AS gender, NULL AS parent_slug, TRUE AS active) t
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'men');

INSERT INTO categories (slug, name, gender, parent_slug, active)
SELECT * FROM (SELECT 'women', 'Women', 'FEMALE', NULL, TRUE) t
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'women');

INSERT INTO categories (slug, name, gender, parent_slug, active)
SELECT * FROM (SELECT 'accessories', 'Accessories', 'UNISEX', NULL, TRUE) t
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'accessories');

-- Working promo coupons (match the checkout page hint: WELCOME10 · FLAT200 · SUMMER25 · FREESHIP)
INSERT INTO coupons (code, description, type, value, min_order_value, max_discount, usage_limit, used_count, active, applicable_for)
SELECT * FROM (SELECT 'WELCOME10' AS code, '10% off your first order' AS description, 'PERCENTAGE' AS type,
                      10.0 AS value, 500.0 AS min_order_value, 300.0 AS max_discount, 1000 AS usage_limit,
                      0 AS used_count, TRUE AS active, 'all' AS applicable_for) t
WHERE NOT EXISTS (SELECT 1 FROM coupons WHERE code = 'WELCOME10');

INSERT INTO coupons (code, description, type, value, min_order_value, max_discount, usage_limit, used_count, active, applicable_for)
SELECT * FROM (SELECT 'FLAT200', 'Flat ₹200 off', 'FLAT', 200.0, 1000.0, 200.0, 1000, 0, TRUE, 'all') t
WHERE NOT EXISTS (SELECT 1 FROM coupons WHERE code = 'FLAT200');

INSERT INTO coupons (code, description, type, value, min_order_value, max_discount, usage_limit, used_count, active, applicable_for)
SELECT * FROM (SELECT 'SUMMER25', '25% off summer sale', 'PERCENTAGE', 25.0, 800.0, 500.0, 1000, 0, TRUE, 'all') t
WHERE NOT EXISTS (SELECT 1 FROM coupons WHERE code = 'SUMMER25');

INSERT INTO coupons (code, description, type, value, min_order_value, max_discount, usage_limit, used_count, active, applicable_for)
SELECT * FROM (SELECT 'FREESHIP', 'Free delivery charge', 'FLAT', 0.0, 0.0, 0.0, 1000, 0, TRUE, 'all') t
WHERE NOT EXISTS (SELECT 1 FROM coupons WHERE code = 'FREESHIP');

-- Product catalog is intentionally not duplicated here — the app seeds a
-- richer, image-linked catalog programmatically (see DataInitializer#seedProducts).
-- Start the app once against this schema and it will fill in the rest.
