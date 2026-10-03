package com.henoria.ecommerce.dto.category;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CategoryRequest {
    @NotBlank
    private String name;

    private String slug; // auto-generated from name if blank

    @NotBlank
    private String gender; // MEN/WOMEN/KIDS/UNISEX

    private String parentSlug;
    private String image;
}
