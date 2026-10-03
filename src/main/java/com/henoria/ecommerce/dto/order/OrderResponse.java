package com.henoria.ecommerce.dto.order;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderResponse {
    private Long id;
    private String orderNumber;
    private List<OrderItemView> items;
    private ShippingAddressView shippingAddress;
    private String couponApplied;
    private String paymentMethod;
    private String paymentStatus;
    private String status;
    private Double subtotal;
    private Double discount;
    private Double deliveryCharge;
    private Double total;
    private List<StatusHistoryView> statusHistory;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ShippingAddressView {
        private String fullName;
        private String phone;
        private String line1;
        private String line2;
        private String city;
        private String state;
        private String pincode;
        private String country;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OrderItemView {
        private Long productId;
        private String productName;
        private String thumbnail;
        private Double finalPrice;
        private Integer quantity;
        private String size;
        private String color;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StatusHistoryView {
        private String status;
        private LocalDateTime timestamp;
        private String note;
    }
}
