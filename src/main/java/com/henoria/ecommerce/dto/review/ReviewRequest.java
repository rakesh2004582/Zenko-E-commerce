package com.henoria.ecommerce.dto.review;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class ReviewRequest {
    @NotNull
    private Long productId;

    @NotNull @Min(1) @Max(5)
    private Integer rating;

    private String title;
    private String body;
    private List<String> images;
}
