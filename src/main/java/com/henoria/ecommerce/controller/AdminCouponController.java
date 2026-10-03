package com.henoria.ecommerce.controller;

import com.henoria.ecommerce.dto.ApiResponse;
import com.henoria.ecommerce.dto.coupon.CouponRequest;
import com.henoria.ecommerce.entity.Coupon;
import com.henoria.ecommerce.service.CouponService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/coupons")
@RequiredArgsConstructor
public class AdminCouponController {

    private final CouponService couponService;

    @GetMapping
    public ApiResponse<List<Coupon>> list() {
        return ApiResponse.ok(couponService.getAll());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Coupon>> create(@Valid @RequestBody CouponRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Coupon created", couponService.create(request)));
    }

    @PutMapping("/{id}")
    public ApiResponse<Coupon> update(@PathVariable Long id, @Valid @RequestBody CouponRequest request) {
        return ApiResponse.ok("Coupon updated", couponService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        couponService.delete(id);
        return ApiResponse.ok("Coupon deactivated", null);
    }
}
