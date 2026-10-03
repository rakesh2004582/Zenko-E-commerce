package com.henoria.ecommerce.dto.coupon;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CouponRequest {
    @NotBlank
    private String code;

    private String description;

    @NotBlank
    private String type; // PERCENTAGE / FIXED / SHIPPING

    @NotNull
    private Double value;

    private Double minOrderValue;
    private Double maxDiscount;
    private Integer usageLimit;
    private LocalDateTime expiresAt;
    private String applicableFor;
}
