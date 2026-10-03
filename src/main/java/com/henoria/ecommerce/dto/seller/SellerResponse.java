package com.henoria.ecommerce.dto.seller;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SellerResponse {
    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private String businessName;
    private String gstNumber;
    private String phone;
    private String address;
    private String city;
    private String state;
    private String pincode;
    private String status;
    private String rejectionReason;
    private Double commissionPercent;
    private LocalDateTime createdAt;
}
