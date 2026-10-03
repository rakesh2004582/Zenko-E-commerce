package com.henoria.ecommerce.dto.product;

import lombok.Data;

import java.util.List;

/** Bound from query params for GET /api/products */
@Data
public class ProductFilterRequest {
    private String search;
    private String category;
    private String gender;
    private Double minPrice;
    private Double maxPrice;
    private Double rating;
    private List<String> sizes;
    private List<String> colors;
    private String brand;
    private Long sellerId;
    private String sortBy; // price_asc, price_desc, rating, newest, discount
    private int page = 0;
    private int size = 12;
}
