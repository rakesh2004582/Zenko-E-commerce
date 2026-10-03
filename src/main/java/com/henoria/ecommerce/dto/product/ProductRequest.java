package com.henoria.ecommerce.dto.product;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.util.List;
import java.util.Map;
import com.fasterxml.jackson.annotation.JsonProperty;
/** Used for both create and update (admin only) */
@Data
public class ProductRequest {
    @NotBlank
    private String name;

    private String slug; // optional - auto-generated from name if blank

    private String description;

    @NotNull @Positive
    private Double price;

    private Double discountPercent = 0.0;

    @NotBlank
    private String categorySlug;

    @NotBlank
    private String gender; // MEN/WOMEN/KIDS/UNISEX

    private String color;
    private String material;
    private String brand;
    private String thumbnail;

    private List<String> features;
    private List<String> sizes;
    private List<String> images;
    private List<String> tags;
    @JsonProperty("isFeatured")
    private boolean isFeatured;

    @JsonProperty("isNewArrival")
    private boolean isNewArrival;

    @JsonProperty("isTrending")
    private boolean isTrending;

    // optional: initial stock per size, e.g. {"S": 10, "M": 20}
    private Map<String, Integer> sizeStock;
}
