package com.henoria.ecommerce.entity;

import com.henoria.ecommerce.entity.enums.CouponType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "coupons")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    private String description;

    @Enumerated(EnumType.STRING)
    private CouponType type;

    private Double value;
    private Double minOrderValue;
    private Double maxDiscount;
    private Integer usageLimit;

    @Builder.Default
    private Integer usedCount = 0;

    @Builder.Default
    private boolean active = true;

    private LocalDateTime expiresAt;

    // "all", or a category slug, or "men"/"women" etc.
    private String applicableFor;
}
