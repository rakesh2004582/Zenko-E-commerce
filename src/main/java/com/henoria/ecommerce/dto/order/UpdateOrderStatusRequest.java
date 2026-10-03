package com.henoria.ecommerce.dto.order;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateOrderStatusRequest {
    @NotBlank
    private String status; // PENDING/CONFIRMED/SHIPPED/DELIVERED/CANCELLED
    private String note;
}
