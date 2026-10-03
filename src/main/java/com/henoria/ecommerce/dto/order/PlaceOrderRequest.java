package com.henoria.ecommerce.dto.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class PlaceOrderRequest {

    @NotEmpty
    private List<OrderItemRequest> items;

    @Valid
    @NotNull
    private ShippingAddressRequest shippingAddress;

    private String couponCode; // optional

    @Data
    public static class OrderItemRequest {
        private Long productId;
        private Integer quantity;
        private String size;
        private String color;
    }

    @Data
    public static class ShippingAddressRequest {
        @NotBlank
        private String fullName;
        @NotBlank
        private String phone;
        @NotBlank
        private String line1;
        private String line2;
        @NotBlank
        private String city;
        @NotBlank
        private String state;
        @NotBlank
        private String pincode;
        private String email;
        private String country = "India";
    }
}
