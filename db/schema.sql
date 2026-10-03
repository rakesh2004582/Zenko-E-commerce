-- =====================================================================
-- Zenko E-Commerce — reference schema (MySQL 8)
--
-- This file is a convenience snapshot of the schema Hibernate generates
-- automatically at boot (DDL_AUTO=update). The application does NOT
-- require you to run this file — `docker compose up` / `mvn spring-boot:run`
-- create everything on their own. Use this only if you want a static,
-- versioned reference (e.g. to hand to a DBA, or to seed a CI database
-- without booting the app first).
--
-- Usage:
--   mysql -u root -p < schema.sql
--   mysql -u root -p zenko_ecom < seed.sql
-- =====================================================================

CREATE DATABASE IF NOT EXISTS zenko_ecom
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE zenko_ecom;

-- ---------------------------------------------------------------------
-- Users & addresses
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    name                VARCHAR(255) NOT NULL,
    email               VARCHAR(255) NOT NULL UNIQUE,
    password            VARCHAR(255) NOT NULL,
    phone               VARCHAR(50),
    avatar              VARCHAR(500),
    role                VARCHAR(20)  NOT NULL DEFAULT 'CUSTOMER', -- CUSTOMER | ADMIN | SELLER
    active              BOOLEAN      NOT NULL DEFAULT TRUE,
    reset_token         VARCHAR(255),
    reset_token_expiry  DATETIME,
    created_at          DATETIME     NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS addresses (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    label       VARCHAR(100),
    full_name   VARCHAR(255),
    phone       VARCHAR(50),
    line1       VARCHAR(255),
    line2       VARCHAR(255),
    city        VARCHAR(100),
    state       VARCHAR(100),
    pincode     VARCHAR(20),
    country     VARCHAR(100) DEFAULT 'India',
    is_default  BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_address_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Sellers
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sellers (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id             BIGINT NOT NULL UNIQUE,
    business_name       VARCHAR(255) NOT NULL,
    gst_number          VARCHAR(50),
    phone               VARCHAR(50),
    address             VARCHAR(255),
    city                VARCHAR(100),
    state               VARCHAR(100),
    pincode             VARCHAR(20),
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING | APPROVED | REJECTED
    rejection_reason    VARCHAR(500),
    commission_percent  DOUBLE DEFAULT 10.0,
    created_at          DATETIME,
    updated_at          DATETIME,
    CONSTRAINT fk_seller_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Categories & products
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    slug        VARCHAR(255) NOT NULL UNIQUE,
    name        VARCHAR(255) NOT NULL,
    gender      VARCHAR(20),  -- MALE | FEMALE | UNISEX
    parent_slug VARCHAR(255),
    image       VARCHAR(500),
    active      BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS products (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    name                VARCHAR(255) NOT NULL,
    slug                VARCHAR(255) NOT NULL UNIQUE,
    description         VARCHAR(4000),
    price               DOUBLE NOT NULL,
    discount_percent    DOUBLE NOT NULL DEFAULT 0,
    final_price         DOUBLE NOT NULL,
    category_id         BIGINT,
    seller_id           BIGINT,
    seller_name         VARCHAR(255),
    approved            BOOLEAN NOT NULL DEFAULT TRUE,
    gender              VARCHAR(20),
    color               VARCHAR(100),
    material            VARCHAR(100),
    brand               VARCHAR(100),
    thumbnail           VARCHAR(1000),
    rating              DOUBLE NOT NULL DEFAULT 0,
    review_count        INT NOT NULL DEFAULT 0,
    is_featured         BOOLEAN NOT NULL DEFAULT FALSE,
    is_new_arrival      BOOLEAN NOT NULL DEFAULT FALSE,
    is_trending         BOOLEAN NOT NULL DEFAULT FALSE,
    active              BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          DATETIME NOT NULL,
    updated_at          DATETIME NOT NULL,
    CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES categories(id),
    INDEX idx_product_active_approved (active, approved),
    INDEX idx_product_category (category_id),
    INDEX idx_product_seller (seller_id),
    INDEX idx_product_final_price (final_price)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS product_features (
    product_id BIGINT NOT NULL,
    feature    VARCHAR(500),
    CONSTRAINT fk_pf_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS product_sizes (
    product_id BIGINT NOT NULL,
    size       VARCHAR(50),
    CONSTRAINT fk_ps_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS product_images (
    product_id  BIGINT NOT NULL,
    image_order INT NOT NULL,
    image_url   VARCHAR(1000),
    CONSTRAINT fk_pi_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS product_tags (
    product_id BIGINT NOT NULL,
    tag        VARCHAR(100),
    CONSTRAINT fk_pt_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Inventory (per product, per size)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id   BIGINT NOT NULL UNIQUE,
    reserved     INT DEFAULT 0,
    last_updated DATETIME,
    CONSTRAINT fk_inventory_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS inventory_sizes (
    inventory_id BIGINT NOT NULL,
    size         VARCHAR(50) NOT NULL,
    quantity     INT NOT NULL DEFAULT 0,
    PRIMARY KEY (inventory_id, size),
    CONSTRAINT fk_is_inventory FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Cart / wishlist (supports guests via guest_id)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS carts (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id    BIGINT,
    guest_id   VARCHAR(100),
    updated_at DATETIME,
    CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_cart_user (user_id),
    INDEX idx_cart_guest (guest_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cart_items (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    cart_id    BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity   INT NOT NULL,
    size       VARCHAR(50),
    color      VARCHAR(100),
    CONSTRAINT fk_cartitem_cart FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    CONSTRAINT fk_cartitem_product FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS wishlists (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id    BIGINT,
    guest_id   VARCHAR(100),
    product_id BIGINT NOT NULL,
    created_at DATETIME,
    CONSTRAINT fk_wishlist_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_wishlist_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_wishlist_user (user_id),
    INDEX idx_wishlist_guest (guest_id),
    INDEX idx_wishlist_product (product_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Coupons
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coupons (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    code             VARCHAR(50) NOT NULL UNIQUE,
    description      VARCHAR(500),
    type             VARCHAR(20), -- PERCENTAGE | FLAT
    value            DOUBLE,
    min_order_value  DOUBLE,
    max_discount     DOUBLE,
    usage_limit      INT,
    used_count       INT DEFAULT 0,
    active           BOOLEAN DEFAULT TRUE,
    expires_at       DATETIME,
    applicable_for   VARCHAR(100) -- 'all', a category slug, or a gender segment
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id                    BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_number          VARCHAR(50) NOT NULL UNIQUE,
    user_id               BIGINT NOT NULL,
    shipping_full_name    VARCHAR(255),
    shipping_phone        VARCHAR(50),
    shipping_line1        VARCHAR(255),
    shipping_line2        VARCHAR(255),
    shipping_city         VARCHAR(100),
    shipping_state        VARCHAR(100),
    shipping_pincode      VARCHAR(20),
    shipping_country      VARCHAR(100),
    coupon_applied        VARCHAR(50),
    subtotal              DOUBLE NOT NULL,
    discount              DOUBLE NOT NULL DEFAULT 0,
    delivery_charge       DOUBLE NOT NULL DEFAULT 0,
    total                 DOUBLE NOT NULL,
    payment_method        VARCHAR(20) NOT NULL DEFAULT 'COD',
    payment_status        VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING | PAID
    status                VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING|CONFIRMED|SHIPPED|DELIVERED|CANCELLED
    created_at            DATETIME NOT NULL,
    updated_at            DATETIME NOT NULL,
    CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_order_user (user_id),
    INDEX idx_order_status (status),
    INDEX idx_order_created_at (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_items (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id          BIGINT NOT NULL,
    product_id        BIGINT,
    product_name      VARCHAR(255),
    thumbnail         VARCHAR(1000),
    price             DOUBLE,
    discount_percent  DOUBLE,
    final_price       DOUBLE,
    quantity          INT,
    size              VARCHAR(50),
    color             VARCHAR(100),
    CONSTRAINT fk_orderitem_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_orderitem_product FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_status_history (
    id        BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id  BIGINT NOT NULL,
    status    VARCHAR(20),
    timestamp DATETIME,
    note      VARCHAR(500),
    CONSTRAINT fk_osh_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Reviews
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    user_id    BIGINT NOT NULL,
    rating     INT NOT NULL,
    title      VARCHAR(255),
    body       VARCHAR(2000),
    helpful    INT DEFAULT 0,
    verified   BOOLEAN DEFAULT FALSE,
    created_at DATETIME,
    CONSTRAINT fk_review_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_review_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS review_images (
    review_id BIGINT NOT NULL,
    image_url VARCHAR(1000),
    CONSTRAINT fk_ri_review FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Contact form
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contact_messages (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    email      VARCHAR(255) NOT NULL,
    phone      VARCHAR(50),
    subject    VARCHAR(255),
    message    VARCHAR(2000) NOT NULL,
    resolved   BOOLEAN DEFAULT FALSE,
    created_at DATETIME
) ENGINE=InnoDB;
