package com.henoria.ecommerce.controller;

import com.henoria.ecommerce.dto.ApiResponse;
import com.henoria.ecommerce.dto.coupon.CouponValidationResponse;
import com.henoria.ecommerce.service.CouponService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
public class CouponController {

    private final CouponService couponService;

    @GetMapping("/validate")
    public ApiResponse<CouponValidationResponse> validate(
            @RequestParam String code,
            @RequestParam double total) {
        return ApiResponse.ok(couponService.validate(code, total));
    }
}
