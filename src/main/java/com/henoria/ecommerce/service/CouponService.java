package com.henoria.ecommerce.service;

import com.henoria.ecommerce.dto.coupon.CouponRequest;
import com.henoria.ecommerce.dto.coupon.CouponValidationResponse;
import com.henoria.ecommerce.entity.Coupon;

import java.util.List;

public interface CouponService {
    Coupon create(CouponRequest request);
    Coupon update(Long id, CouponRequest request);
    void delete(Long id);
    List<Coupon> getAll();
    Coupon getById(Long id);
    CouponValidationResponse validate(String code, double orderTotal);
}
