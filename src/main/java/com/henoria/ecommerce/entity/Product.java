
package com.henoria.ecommerce.entity;

import com.henoria.ecommerce.entity.enums.Gender;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Table(
        name = "products",
        indexes = {
                @Index(name = "idx_product_active_approved", columnList = "active, approved"),
                @Index(name = "idx_product_category", columnList = "category_id"),
                @Index(name = "idx_product_seller", columnList = "seller_id"),
                @Index(name = "idx_product_final_price", columnList = "final_price")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(onlyExplicitlyIncluded = true)
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @ToString.Include
    private Long id;

    @Column(nullable = false)
    @ToString.Include
    private String name;

    @Column(nullable = false, unique = true)
    @ToString.Include
    private String slug;

    @Column(length = 4000)
    private String description;

    @Column(nullable = false)
    private Double price;

    @Builder.Default
    @Column(nullable = false)
    private Double discountPercent = 0.0;

    @Column(name = "final_price", nullable = false)
    private Double finalPrice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    @ToString.Exclude
    private Category category;

    @Column(name = "seller_id")
    private Long sellerId;

    @Column(name = "seller_name")
    private String sellerName;

    @Builder.Default
    @Column(nullable = false)
    private boolean approved = true;

    @Enumerated(EnumType.STRING)
    private Gender gender;

    private String color;
    private String material;
    private String brand;

    @Column(length = 1000)
    private String thumbnail;

    @ElementCollection
    @CollectionTable(
            name = "product_features",
            joinColumns = @JoinColumn(name = "product_id")
    )
    @Column(name = "feature")
    @Builder.Default
    private List<String> features = new ArrayList<>();

    @ElementCollection
    @CollectionTable(
            name = "product_sizes",
            joinColumns = @JoinColumn(name = "product_id")
    )
    @Column(name = "size")
    @Builder.Default
    private List<String> sizes = new ArrayList<>();

    @ElementCollection
    @CollectionTable(
            name = "product_images",
            joinColumns = @JoinColumn(name = "product_id")
    )
    @Column(name = "image_url", length = 1000)
    @OrderColumn(name = "image_order")
    @Builder.Default
    private List<String> images = new ArrayList<>();

    @ElementCollection
    @CollectionTable(
            name = "product_tags",
            joinColumns = @JoinColumn(name = "product_id")
    )
    @Column(name = "tag")
    @Builder.Default
    private List<String> tags = new ArrayList<>();

    @Builder.Default
    @Column(nullable = false)
    private Double rating = 0.0;

    @Builder.Default
    @Column(nullable = false)
    private Integer reviewCount = 0;

    @Builder.Default
    @Column(nullable = false)
    private boolean isFeatured = false;

    @Builder.Default
    @Column(nullable = false)
    private boolean isNewArrival = false;

    @Builder.Default
    @Column(nullable = false)
    private boolean isTrending = false;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();

        createdAt = now;
        updatedAt = now;

        normalizeCollections();
        recalculateFinalPrice();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();

        normalizeCollections();
        recalculateFinalPrice();
    }

    public void recalculateFinalPrice() {
        if (price == null) {
            finalPrice = null;
            return;
        }

        double validDiscount = discountPercent == null
                ? 0.0
                : Math.max(0.0, Math.min(discountPercent, 100.0));

        discountPercent = validDiscount;

        double calculatedPrice =
                price * (1.0 - validDiscount / 100.0);

        finalPrice =
                Math.round(calculatedPrice * 100.0) / 100.0;
    }

    private void normalizeCollections() {
        this.features = features != null ? new ArrayList<>(features) : new ArrayList<>();
        this.sizes = sizes != null ? new ArrayList<>(sizes) : new ArrayList<>();
        this.images = images != null ? new ArrayList<>(images) : new ArrayList<>();
        this.tags = tags != null ? new ArrayList<>(tags) : new ArrayList<>();
    }

    @Override
    public boolean equals(Object object) {
        if (this == object) {
            return true;
        }

        if (!(object instanceof Product other)) {
            return false;
        }

        return id != null && Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}

