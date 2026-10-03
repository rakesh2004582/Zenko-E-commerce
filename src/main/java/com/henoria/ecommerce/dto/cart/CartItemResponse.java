package com.henoria.ecommerce.dto.cart;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CartItemResponse {
    private Long id; // cart_item id
    private String productId;
    private String name;
    private String thumbnail;
    private Double price;
    private Double finalPrice;
    private Double discountPercent;
    private Integer quantity;
    private String size;
    private String color;
}
