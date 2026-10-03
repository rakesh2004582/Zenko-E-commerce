package com.henoria.ecommerce.dto.seller;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SellerRegisterRequest {
    @NotBlank
    private String businessName;

    private String gstNumber;

    @NotBlank
    private String phone;

    @NotBlank
    private String address;

    private String city;
    private String state;
    private String pincode;
}
