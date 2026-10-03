package com.henoria.ecommerce.config;

import com.henoria.ecommerce.entity.*;
import com.henoria.ecommerce.entity.enums.CouponType;
import com.henoria.ecommerce.entity.enums.Gender;
import com.henoria.ecommerce.entity.enums.Role;
import com.henoria.ecommerce.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final CouponRepository couponRepository;
    private final PasswordEncoder passwordEncoder;

    @org.springframework.beans.factory.annotation.Value("${app.frontend.url}")
    private String frontendUrl;

    @Override
    @org.springframework.transaction.annotation.Transactional
    public void run(String... args) {
        seedAdmin();
        seedCategories();
        seedProducts();
        fixExistingProductImageUrls();
        approveExistingProducts();
        seedCoupons();
    }

    private void seedAdmin() {
        if (!userRepository.existsByEmail("admin@zenko.com")) {
            User admin = User.builder()
                    .name("Zenko Admin")
                    .email("admin@zenko.com")
                    .password(passwordEncoder.encode("Admin@123"))
                    .role(Role.ADMIN)
                    .active(true)
                    .build();
            userRepository.save(admin);
            log.info("=================================================");
            log.info(" Default admin created -> admin@zenko.com / Admin@123");
            log.info("=================================================");
        }
    }

    /** Bonus / promo coupons so the checkout page's "Try: WELCOME10 · FLAT200 · SUMMER25 · FREESHIP"
     *  hint actually works out of the box instead of every code coming back invalid. */
    private void seedCoupons() {
        seedCoupon("WELCOME10", "10% off for new customers", CouponType.PERCENTAGE, 10.0, 499.0, 300.0, 1000);
        seedCoupon("FLAT200", "Flat ₹200 off", CouponType.FIXED, 200.0, 1499.0, null, 1000);
        seedCoupon("SUMMER25", "25% off summer sale", CouponType.PERCENTAGE, 25.0, 999.0, 500.0, 1000);
        seedCoupon("FREESHIP", "Free delivery on your order", CouponType.SHIPPING, 0.0, 0.0, null, 1000);
    }

    private void seedCoupon(String code, String description, CouponType type, Double value,
                             Double minOrderValue, Double maxDiscount, Integer usageLimit) {
        if (couponRepository.findByCodeIgnoreCase(code).isPresent()) return;
        Coupon coupon = Coupon.builder()
                .code(code)
                .description(description)
                .type(type)
                .value(value)
                .minOrderValue(minOrderValue)
                .maxDiscount(maxDiscount)
                .usageLimit(usageLimit)
                .usedCount(0)
                .active(true)
                .expiresAt(LocalDateTime.now().plusYears(2))
                .applicableFor("all")
                .build();
        couponRepository.save(coupon);
        log.info("Seeded coupon -> {}", code);
    }

    private void seedCategories() {
        if (categoryRepository.count() > 0) return;
        log.info("Seeding categories...");
        List<Category> cats = List.of(
            cat("kurtas-women", "Kurtas", Gender.WOMEN, null),
            cat("sarees", "Sarees", Gender.WOMEN, null),
            cat("kurtis", "Kurtis", Gender.WOMEN, null),
            cat("lehengas", "Lehengas", Gender.WOMEN, null),
            cat("tops-women", "Tops", Gender.WOMEN, null),
            cat("dresses", "Dresses", Gender.WOMEN, null),
            cat("jeans-women", "Jeans", Gender.WOMEN, null),
            cat("suits-women", "Suits & Suit Sets", Gender.WOMEN, null),
            cat("palazzos", "Palazzos", Gender.WOMEN, null),
            cat("t-shirts-men", "T-Shirts", Gender.MEN, null),
            cat("shirts-men", "Casual Shirts", Gender.MEN, null),
            cat("jeans-men", "Jeans", Gender.MEN, null),
            cat("kurtas-men", "Kurtas & Kurta Sets", Gender.MEN, null),
            cat("trousers-men", "Trousers", Gender.MEN, null),
            cat("shorts-men", "Shorts", Gender.MEN, null),
            cat("kids-boys", "Boys Clothing", Gender.KIDS, null),
            cat("kids-girls", "Girls Clothing", Gender.KIDS, null),
            cat("ethnic-kids", "Kids Ethnic Wear", Gender.KIDS, null),
            cat("backpacks", "Bags & Backpacks", Gender.UNISEX, null),
            cat("handbags", "Handbags", Gender.WOMEN, null),
            cat("wallets", "Wallets", Gender.UNISEX, null)
        );
        categoryRepository.saveAll(cats);
        log.info("Seeded {} categories", cats.size());
    }

    private Category cat(String slug, String name, Gender gender, String parent) {
        return Category.builder().slug(slug).name(name).gender(gender).parentSlug(parent).active(true).build();
    }

    private void seedProducts() {
        if (productRepository.count() > 0) return;
        log.info("Seeding 200+ products...");

        // Serve all product images consistently from backend uploads directory (/uploads/products/).
        String BASE = "/uploads/products/";
        String[] womenClothes = {
            BASE + "women-01.jpg",
            BASE + "women-02.jpg",
            BASE + "women-03.jpg",
            BASE + "women-04.jpg",
            BASE + "women-01.jpg",   // duplicate intentional (same as original index 0 == 4)
            BASE + "women-05.jpg",
            BASE + "women-06.jpg",
            BASE + "women-07.jpg",
            BASE + "women-08.jpg",
            BASE + "women-09.jpg"
        };
        String[] menClothes = {
            BASE + "men-01.jpg",
            BASE + "men-02.jpg",
            BASE + "men-03.jpg",
            BASE + "men-04.jpg",
            BASE + "men-05.jpg",
            BASE + "men-06.jpg",
            BASE + "men-07.jpg",
            BASE + "men-08.jpg",
            BASE + "men-09.jpg",
            BASE + "men-10.jpg"
        };

        List<Product> products = new ArrayList<>();
        Random rnd = new Random(42);

        // ── Women's Products ──────────────────────────────────────────────────

        // Kurtas (20 products)
        Category kurtasW = categoryRepository.findBySlug("kurtas-women").orElse(null);
        String[] kurtaNames = {
            "Floral Print Anarkali Kurta", "Cotton Block Print A-Line Kurta", "Embroidered Straight Kurta",
            "Rayon Printed Long Kurta", "Chanderi Silk Kurta Set", "Georgette Kurta with Palazzo",
            "Bandhani Print Kurta", "Mirror Work Kurta Set", "Digital Print Straight Kurta",
            "Cotton Flex Kurta with Dupatta", "Viscose Crepe Printed Kurta", "Chikankari Embroidery Kurta",
            "Striped Cotton Kurta Set", "Angrakha Style Kurta", "Organza Embroidered Kurta",
            "Printed Yoke Design Kurta", "Sequence Work Festive Kurta", "Tie-Dye Long Kurta",
            "Lakhnavi Work Kurta", "Bamboo Cotton Daily Wear Kurta"
        };
        for (int i = 0; i < kurtaNames.length; i++) {
            products.add(buildProduct(kurtaNames[i], "women-kurta", kurtasW, Gender.WOMEN,
                299 + rnd.nextInt(1200), 10 + rnd.nextInt(40),
                List.of("XS","S","M","L","XL","XXL"), womenClothes[i % womenClothes.length],
                List.of("Blue","Pink","Green","Yellow").get(rnd.nextInt(4)),
                "Cotton", "Libas", i < 6, i < 4, i < 5, rnd));
        }

        // Sarees (20 products)
        Category sarees = categoryRepository.findBySlug("sarees").orElse(null);
        String[] sareeNames = {
            "Banarasi Silk Saree with Blouse", "Kanjivaram Pure Silk Saree", "Georgette Printed Saree",
            "Chiffon Floral Saree", "Cotton Handloom Saree", "Bhagalpuri Silk Saree",
            "Linen Saree with Zari Border", "Organza Ruffle Saree", "Satin Printed Party Saree",
            "Mysore Silk Saree", "Patola Design Silk Saree", "Net Embroidered Wedding Saree",
            "Bandhani Print Georgette Saree", "Tussar Silk Saree", "Pochampally Ikkat Saree",
            "Velvet Embroidered Saree", "Chanderi Silk Saree with Border", "Phulkari Embroidered Saree",
            "Digital Print Art Silk Saree", "Kerala Kasavu Saree"
        };
        for (int i = 0; i < sareeNames.length; i++) {
            products.add(buildProduct(sareeNames[i], "women-saree", sarees, Gender.WOMEN,
                499 + rnd.nextInt(3500), 5 + rnd.nextInt(35),
                List.of("Free Size"), womenClothes[i % womenClothes.length],
                List.of("Red","Blue","Green","Pink","Gold").get(rnd.nextInt(5)),
                "Silk", "Meena Bazaar", i < 5, i < 3, i < 6, rnd));
        }

        // Kurtis (20 products)
        Category kurtis = categoryRepository.findBySlug("kurtis").orElse(null);
        String[] kurtiNames = {
            "Short Rayon Kurti", "Asymmetric Hem Printed Kurti", "Embroidered Short Kurti",
            "Flared A-Line Kurti", "Cold Shoulder Kurti", "Lace Border Straight Kurti",
            "Crop Kurti with Dhoti Pants", "Shrug Style Kurti", "Mandarin Collar Kurti",
            "Jaipuri Print Short Kurti", "Sequin Work Party Kurti", "Boho Printed Kurti",
            "Digital Print Poly Kurti", "V-Neck Pintuck Kurti", "Cape Style Kurti",
            "Floral Embroidered Kurti", "Tunic Style Long Kurti", "Abstract Print Kurti",
            "Off-Shoulder Kurti", "Solid Colour Casual Kurti"
        };
        for (int i = 0; i < kurtiNames.length; i++) {
            products.add(buildProduct(kurtiNames[i], "women-kurti", kurtis, Gender.WOMEN,
                199 + rnd.nextInt(800), 15 + rnd.nextInt(50),
                List.of("S","M","L","XL","XXL"), womenClothes[i % womenClothes.length],
                List.of("Maroon","Teal","Orange","White","Black").get(rnd.nextInt(5)),
                "Rayon", "AKS", i < 7, i < 5, i < 8, rnd));
        }

        // Dresses (20 products)
        Category dresses = categoryRepository.findBySlug("dresses").orElse(null);
        String[] dressNames = {
            "Bodycon Midi Dress", "Floral Wrap Dress", "A-Line Sundress", "Maxi Boho Dress",
            "Off-Shoulder Mini Dress", "Shirt Dress with Belt", "Slip Dress Satin", "Smock Dress",
            "Corset Style Party Dress", "Pleated Skater Dress", "Linen Casual Dress",
            "Cold Shoulder Dress", "Tiered Ruffle Maxi Dress", "Printed Halter Dress",
            "Striped T-shirt Dress", "Strapless Bandeau Dress", "Velvet Party Dress",
            "Balloon Sleeve Mini Dress", "Empire Waist Maxi Dress", "Cutout Detail Dress"
        };
        for (int i = 0; i < dressNames.length; i++) {
            products.add(buildProduct(dressNames[i], "women-dress", dresses, Gender.WOMEN,
                399 + rnd.nextInt(1800), 10 + rnd.nextInt(45),
                List.of("XS","S","M","L","XL"), womenClothes[i % womenClothes.length],
                List.of("Black","White","Red","Blue","Green").get(rnd.nextInt(5)),
                "Polyester", "Vero Moda", i < 6, i < 4, i < 7, rnd));
        }

        // Tops (20 products)
        Category topsW = categoryRepository.findBySlug("tops-women").orElse(null);
        String[] topNames = {
            "Crop Fitted Top", "Puff Sleeve Blouse", "Lace Trim Cami Top", "Tie-Front Casual Top",
            "Printed Oversized Top", "Cold Shoulder Top", "Bardot Neck Top", "Ruffled Hem Top",
            "Strappy Back Top", "V-Neck Printed Top", "Polka Dot Button Top", "Striped Fitted Top",
            "Asymmetric Hem Knit Top", "Cowl Neck Silk Top", "Backless Party Top",
            "Floral Print Blouse", "Sheer Overlay Top", "Cutwork Detail Top",
            "Abstract Print Tank Top", "Ruched Side Top"
        };
        for (int i = 0; i < topNames.length; i++) {
            products.add(buildProduct(topNames[i], "women-top", topsW, Gender.WOMEN,
                249 + rnd.nextInt(900), 5 + rnd.nextInt(40),
                List.of("XS","S","M","L","XL"), womenClothes[i % womenClothes.length],
                List.of("Pink","White","Black","Lavender","Mint").get(rnd.nextInt(5)),
                "Polyester", "H&M", i < 5, i < 5, i < 6, rnd));
        }

        // Jeans Women (10 products)
        Category jeansW = categoryRepository.findBySlug("jeans-women").orElse(null);
        String[] jeansWNames = {
            "Slim Fit High Waist Jeans", "Mom Jeans Light Blue", "Skinny Black Jeans",
            "Wide Leg Denim Jeans", "Boyfriend Distressed Jeans", "Straight Fit Classic Jeans",
            "Cropped Flare Jeans", "High Rise Stretch Jeans", "Paperbag Waist Jeans", "Ripped Knee Jeans"
        };
        for (int i = 0; i < jeansWNames.length; i++) {
            products.add(buildProduct(jeansWNames[i], "women-jeans", jeansW, Gender.WOMEN,
                599 + rnd.nextInt(1400), 5 + rnd.nextInt(30),
                List.of("26","28","30","32","34"), womenClothes[i % womenClothes.length],
                List.of("Blue","Black","White").get(rnd.nextInt(3)),
                "Denim", "Roadster", i < 3, i < 3, i < 4, rnd));
        }

        // ── Men's Products ────────────────────────────────────────────────────

        // T-Shirts (25 products)
        Category tshirtsM = categoryRepository.findBySlug("t-shirts-men").orElse(null);
        String[] tshirtNames = {
            "Graphic Print Round Neck T-Shirt", "Solid Colour V-Neck T-Shirt", "Polo Collar T-Shirt",
            "Oversized Drop Shoulder T-Shirt", "Striped Casual T-Shirt", "Henley Neck Half Sleeve T-Shirt",
            "Printed Typography T-Shirt", "Anime Graphic Tee", "Acid Wash T-Shirt",
            "Polo Embroidered T-Shirt", "Abstract Print T-Shirt", "Tie-Dye T-Shirt",
            "Long Line T-Shirt", "Raglan Sleeve T-Shirt", "Ribbed Fitted T-Shirt",
            "Vintage Wash T-Shirt", "Pocket Detail T-Shirt", "Band Print T-Shirt",
            "Blocked Colour T-Shirt", "Distressed Logo T-Shirt",
            "Plain White Everyday T-Shirt", "Navy Blue Essential T-Shirt",
            "Camouflage Print T-Shirt", "Checkered Print T-Shirt", "Sports Dry-Fit T-Shirt"
        };
        for (int i = 0; i < tshirtNames.length; i++) {
            products.add(buildProduct(tshirtNames[i], "men-tshirt", tshirtsM, Gender.MEN,
                199 + rnd.nextInt(700), 10 + rnd.nextInt(40),
                List.of("S","M","L","XL","XXL","3XL"), menClothes[i % menClothes.length],
                List.of("White","Black","Navy","Grey","Red","Green").get(rnd.nextInt(6)),
                "Cotton", "Bewakoof", i < 8, i < 6, i < 10, rnd));
        }

        // Shirts (20 products)
        Category shirtsM = categoryRepository.findBySlug("shirts-men").orElse(null);
        String[] shirtNames = {
            "Slim Fit Solid Casual Shirt", "Floral Printed Slim Shirt", "Oxford Cotton Shirt",
            "Linen Solid Shirt", "Checks Slim Fit Shirt", "Mandarin Collar Printed Shirt",
            "Oversized Shirt Streetwear", "Denim Shirt", "Cuban Collar Shirt",
            "Striped Full Sleeve Shirt", "Abstract Print Rayon Shirt", "Solid Spread Collar Shirt",
            "Batik Print Resort Shirt", "Corduroy Shirt", "Dobby Texture Slim Shirt",
            "Graphic Doodle Shirt", "Chambray Blue Shirt", "Bohemian Print Shirt",
            "Half Sleeve Cotton Shirt", "Windowpane Check Shirt"
        };
        for (int i = 0; i < shirtNames.length; i++) {
            products.add(buildProduct(shirtNames[i], "men-shirt", shirtsM, Gender.MEN,
                399 + rnd.nextInt(1200), 5 + rnd.nextInt(35),
                List.of("S","M","L","XL","XXL"), menClothes[i % menClothes.length],
                List.of("White","Blue","Black","Cream").get(rnd.nextInt(4)),
                "Cotton", "Peter England", i < 6, i < 5, i < 7, rnd));
        }

        // Kurtas Men (15 products)
        Category kurtasM = categoryRepository.findBySlug("kurtas-men").orElse(null);
        String[] menKurtaNames = {
            "Embroidered Straight Kurta", "Solid Cotton Kurta Set", "Block Print Kurta Set",
            "Festive Silk Blend Kurta", "Casual Linen Kurta", "Angrakha Style Kurta",
            "Bandhgala Kurta Set", "Printed Short Kurta", "Nehru Jacket with Kurta Set",
            "Geometric Print Kurta", "Mirror Work Ethnic Kurta", "Indo-Western Kurta Set",
            "Chikankari Cotton Kurta", "Ethnic Pintuck Kurta", "Dobby Texture Kurta"
        };
        for (int i = 0; i < menKurtaNames.length; i++) {
            products.add(buildProduct(menKurtaNames[i], "men-kurta", kurtasM, Gender.MEN,
                499 + rnd.nextInt(2000), 5 + rnd.nextInt(35),
                List.of("S","M","L","XL","XXL"), menClothes[i % menClothes.length],
                List.of("White","Cream","Blue","Beige","Maroon").get(rnd.nextInt(5)),
                "Cotton", "Manyavar", i < 5, i < 3, i < 5, rnd));
        }

        // Jeans Men (15 products)
        Category jeansM = categoryRepository.findBySlug("jeans-men").orElse(null);
        String[] jeansMNames = {
            "Slim Fit Dark Blue Jeans", "Skinny Stretch Jeans", "Regular Fit Classic Jeans",
            "Relaxed Fit Cargo Jeans", "Distressed Slim Jeans", "Black Slim Fit Jeans",
            "Light Blue Straight Jeans", "Tapered Fit Jeans", "Acid Wash Slim Jeans",
            "Jogger Style Jeans", "Bootcut Denim Jeans", "Cropped Slim Fit Jeans",
            "High Rise Retro Jeans", "Stretch Skinny Jeans", "Double Denim Jeans"
        };
        for (int i = 0; i < jeansMNames.length; i++) {
            products.add(buildProduct(jeansMNames[i], "men-jeans", jeansM, Gender.MEN,
                699 + rnd.nextInt(1500), 5 + rnd.nextInt(30),
                List.of("28","30","32","34","36","38"), menClothes[i % menClothes.length],
                List.of("Blue","Black","Grey").get(rnd.nextInt(3)),
                "Denim", "Levis", i < 4, i < 4, i < 5, rnd));
        }

        // Kids (15 products)
        Category kidsB = categoryRepository.findBySlug("kids-boys").orElse(null);
        String[] kidsNames = {
            "Boys Cartoon Print T-Shirt", "Boys Denim Jogger", "Boys Ethnic Kurta Set",
            "Boys Graphic Hoodie", "Boys Casual Shorts", "Boys Striped T-Shirt",
            "Girls Frock with Bow", "Girls Palazzo Set", "Girls Floral Dress",
            "Girls Lehenga Choli Set", "Girls Embroidered Top", "Kids Festive Kurta Pyjama",
            "Kids Printed Nightsuit Set", "Boys Cargo Pants", "Girls Jumpsuit"
        };
        for (int i = 0; i < kidsNames.length; i++) {
            Gender g = i < 6 ? Gender.KIDS : (i < 11 ? Gender.KIDS : Gender.KIDS);
            Category kidCat = i < 6 ? kidsB : categoryRepository.findBySlug("kids-girls").orElse(kidsB);
            products.add(buildProduct(kidsNames[i], "kids-" + i, kidCat, g,
                199 + rnd.nextInt(600), 5 + rnd.nextInt(30),
                List.of("2Y","3Y","4Y","5Y","6Y","7Y","8Y","9Y","10Y"), menClothes[i % menClothes.length],
                List.of("Blue","Pink","Red","Yellow","Green").get(rnd.nextInt(5)),
                "Cotton", "FirstCry", i < 5, i < 4, i < 5, rnd));
        }

        // Bags & Accessories (12 products) — real bag photography already bundled in
        // public/images/products/bags/
        String BAGS_BASE = "/uploads/products/";
        String[] bagImages = {
            BAGS_BASE + "product-1.jpg",
            BAGS_BASE + "product-2.jpg",
            BAGS_BASE + "product-3.jpg",
            BAGS_BASE + "product-10.jpg"
        };
        Category backpacks = categoryRepository.findBySlug("backpacks").orElse(null);
        Category handbags = categoryRepository.findBySlug("handbags").orElse(null);
        Category wallets = categoryRepository.findBySlug("wallets").orElse(null);
        String[] bagNames = {
            "Suede Fringe Sling Bag", "Classic Leather Backpack", "Quilted Chain Strap Handbag",
            "Canvas Travel Backpack", "Structured Tote Bag", "Woven Straw Beach Bag",
            "Mini Crossbody Bag", "Laptop Backpack with USB Port", "Faux Leather Clutch",
            "Zip-Around Wallet", "Bifold Leather Wallet", "Everyday Sling Backpack"
        };
        Category[] bagCats = { backpacks, backpacks, handbags, backpacks, handbags, handbags,
                                handbags, backpacks, handbags, wallets, wallets, backpacks };
        for (int i = 0; i < bagNames.length; i++) {
            products.add(buildProduct(bagNames[i], "bag", bagCats[i], Gender.UNISEX,
                399 + rnd.nextInt(2200), 5 + rnd.nextInt(40),
                List.of("One Size"), bagImages[i % bagImages.length],
                List.of("Beige","Black","Brown","Tan","Grey").get(rnd.nextInt(5)),
                "Leatherette", "Caprese", i < 4, i < 3, i < 5, rnd));
        }

        productRepository.saveAll(products);
        log.info("Seeded {} products successfully!", products.size());

        // Seed inventory for all products
        List<Inventory> inventories = products.stream().map(p -> {
            Map<String, Integer> sizeStock = new HashMap<>();
            for (String size : p.getSizes()) {
                sizeStock.put(size, 20 + new Random().nextInt(80));
            }
            return Inventory.builder()
                    .product(p)
                    .sizeStock(sizeStock)
                    .reserved(0)
                    .build();
        }).toList();
        inventoryRepository.saveAll(inventories);
        log.info("Seeded inventory for {} products", inventories.size());
    }

    private static long slugCounter = 0;

    private Product buildProduct(String name, String slugBase, Category category, Gender gender,
                                  int basePrice, int discPct, List<String> sizes,
                                  String imageUrl, String color, String material, String brand,
                                  boolean featured, boolean newArrival, boolean trending, Random rnd) {
        slugCounter++;
        String slug = slugBase + "-" + slugCounter;
        double price = basePrice;
        double disc = discPct;
        double finalPr = Math.round(price * (1 - disc / 100.0) * 100.0) / 100.0;
        double rating = 3.5 + rnd.nextDouble() * 1.5;
        int reviews = 5 + rnd.nextInt(950);

        return Product.builder()
                .name(name)
                .slug(slug)
                .description("Premium quality " + name + " crafted with fine " + material + ". " +
                        "Perfect for everyday wear and special occasions. Available in multiple sizes.")
                .price(price)
                .discountPercent(disc)
                .finalPrice(finalPr)
                .category(category)
                .gender(gender)
                .color(color)
                .material(material)
                .brand(brand)
                .thumbnail(imageUrl)
                .images(new ArrayList<>(List.of(imageUrl, imageUrl)))
                .sizes(sizes != null ? new ArrayList<>(sizes) : new ArrayList<>())
                .tags(new ArrayList<>(List.of(brand.toLowerCase(), material.toLowerCase(), gender.name().toLowerCase())))
                .features(new ArrayList<>(List.of("Machine Washable", "Breathable Fabric", "Comfortable Fit", "Vibrant Colors")))
                .rating(Math.round(rating * 10.0) / 10.0)
                .reviewCount(reviews)
                .isFeatured(featured)
                .isNewArrival(newArrival)
                .isTrending(trending)
                .approved(true)
                .active(true)
                .build();
    }

    private void approveExistingProducts() {
        List<Product> unapproved = productRepository.findAll()
                .stream()
                .filter(p -> !p.isApproved())
                .toList();
        if (!unapproved.isEmpty()) {
            log.info("Approving {} unapproved products in database...", unapproved.size());
            for (Product p : unapproved) {
                p.setApproved(true);
            }
            productRepository.saveAll(unapproved);
            log.info("Successfully approved {} products for storefront display!", unapproved.size());
        }
    }

    @org.springframework.transaction.annotation.Transactional
    public void fixExistingProductImageUrls() {
        List<Product> products = productRepository.findAll();
        boolean updated = false;
        for (Product p : products) {
            boolean changed = false;
            if (p.getThumbnail() != null && (p.getThumbnail().startsWith("http") || p.getThumbnail().contains("/images/products/"))) {
                String filename = p.getThumbnail().substring(p.getThumbnail().lastIndexOf("/") + 1);
                p.setThumbnail("/uploads/products/" + filename);
                changed = true;
            }
            if (p.getImages() != null && !p.getImages().isEmpty()) {
                List<String> newImages = new ArrayList<>();
                for (String img : p.getImages()) {
                    if (img != null && (img.startsWith("http") || img.contains("/images/products/"))) {
                        String filename = img.substring(img.lastIndexOf("/") + 1);
                        newImages.add("/uploads/products/" + filename);
                        changed = true;
                    } else {
                        newImages.add(img);
                    }
                }
                if (changed) p.setImages(new ArrayList<>(newImages));
            }
            if (changed) {
                productRepository.save(p);
                updated = true;
            }
        }
        if (updated) log.info("Normalized existing product image URLs in database to /uploads/products/");
    }
}
