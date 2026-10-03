package com.henoria.ecommerce.dto.product;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductResponse {
    private Long id;
    private String name;
    private String slug;
    private String description;
    private Double price;
    private Double discountPercent;
    private Double finalPrice;
    private String categoryName;
    private String categorySlug;
    private String gender;
    private String color;
    private String material;
    private String brand;
    private String thumbnail;
    private List<String> features;
    private List<String> sizes;
    private List<String> images;
    private List<String> tags;
    private Double rating;
    private Integer reviewCount;
    private boolean isFeatured;
    private boolean isNewArrival;
    private boolean isTrending;
    private boolean active;
    private Long sellerId;
    private String sellerName;
    private boolean approved;
    private Integer availableStock;
    private Map<String, Integer> stockBySize;
    private LocalDateTime createdAt;
}
