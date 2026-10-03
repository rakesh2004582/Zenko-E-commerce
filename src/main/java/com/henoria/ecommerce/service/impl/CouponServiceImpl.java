package com.henoria.ecommerce.service.impl;

import com.henoria.ecommerce.dto.coupon.CouponRequest;
import com.henoria.ecommerce.dto.coupon.CouponValidationResponse;
import com.henoria.ecommerce.entity.Coupon;
import com.henoria.ecommerce.entity.enums.CouponType;
import com.henoria.ecommerce.exception.DuplicateResourceException;
import com.henoria.ecommerce.exception.ResourceNotFoundException;
import com.henoria.ecommerce.repository.CouponRepository;
import com.henoria.ecommerce.service.CouponService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CouponServiceImpl implements CouponService {

    // kept in sync with OrderServiceImpl's delivery-charge rules
    private static final double FREE_DELIVERY_THRESHOLD = 999.0;
    private static final double FLAT_DELIVERY_CHARGE = 49.0;

    private final CouponRepository couponRepository;

    @Override
    public Coupon create(CouponRequest request) {
        if (couponRepository.findByCodeIgnoreCase(request.getCode()).isPresent()) {
            throw new DuplicateResourceException("A coupon with code '" + request.getCode() + "' already exists");
        }
        Coupon coupon = Coupon.builder()
                .code(request.getCode().toUpperCase())
                .description(request.getDescription())
                .type(CouponType.valueOf(request.getType().toUpperCase()))
                .value(request.getValue())
                .minOrderValue(request.getMinOrderValue())
                .maxDiscount(request.getMaxDiscount())
                .usageLimit(request.getUsageLimit())
                .usedCount(0)
                .active(true)
                .expiresAt(request.getExpiresAt())
                .applicableFor(request.getApplicableFor())
                .build();
        return couponRepository.save(coupon);
    }

    @Override
    public Coupon update(Long id, CouponRequest request) {
        Coupon coupon = getById(id);
        coupon.setDescription(request.getDescription());
        coupon.setType(CouponType.valueOf(request.getType().toUpperCase()));
        coupon.setValue(request.getValue());
        coupon.setMinOrderValue(request.getMinOrderValue());
        coupon.setMaxDiscount(request.getMaxDiscount());
        coupon.setUsageLimit(request.getUsageLimit());
        coupon.setExpiresAt(request.getExpiresAt());
        coupon.setApplicableFor(request.getApplicableFor());
        return couponRepository.save(coupon);
    }

    @Override
    public void delete(Long id) {
        Coupon coupon = getById(id);
        coupon.setActive(false);
        couponRepository.save(coupon);
    }

    @Override
    public List<Coupon> getAll() {
        return couponRepository.findAll();
    }

    @Override
    public Coupon getById(Long id) {
        return couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found with id: " + id));
    }

    @Override
    public CouponValidationResponse validate(String code, double orderTotal) {
        var couponOpt = couponRepository.findByCodeIgnoreCase(code);
        if (couponOpt.isEmpty()) {
            return CouponValidationResponse.builder().valid(false).message("Invalid coupon code").build();
        }
        Coupon coupon = couponOpt.get();

        if (!coupon.isActive()) {
            return CouponValidationResponse.builder().valid(false).message("This coupon is no longer active").build();
        }
        if (coupon.getExpiresAt() != null && coupon.getExpiresAt().isBefore(LocalDateTime.now())) {
            return CouponValidationResponse.builder().valid(false).message("This coupon has expired").build();
        }
        if (coupon.getUsageLimit() != null && coupon.getUsedCount() >= coupon.getUsageLimit()) {
            return CouponValidationResponse.builder().valid(false).message("This coupon has reached its usage limit").build();
        }
        if (coupon.getMinOrderValue() != null && orderTotal < coupon.getMinOrderValue()) {
            return CouponValidationResponse.builder().valid(false)
                    .message("Minimum order value of ₹" + coupon.getMinOrderValue() + " required").build();
        }

        double discount;
        String message = "Coupon applied successfully";
        if (coupon.getType() == CouponType.PERCENTAGE) {
            discount = orderTotal * (coupon.getValue() / 100.0);
            if (coupon.getMaxDiscount() != null) discount = Math.min(discount, coupon.getMaxDiscount());
        } else if (coupon.getType() == CouponType.FIXED) {
            discount = coupon.getValue();
        } else if (coupon.getType() == CouponType.SHIPPING) {
            // mirrors the order-placement logic: waives the flat delivery charge when the
            // order doesn't already qualify for free delivery on its own
            if (orderTotal >= FREE_DELIVERY_THRESHOLD) {
                discount = 0.0;
                message = "This order already qualifies for free delivery!";
            } else {
                discount = FLAT_DELIVERY_CHARGE;
                message = "Free delivery applied!";
            }
        } else {
            discount = 0.0;
        }
        discount = Math.round(discount);

        return CouponValidationResponse.builder()
                .valid(true).code(coupon.getCode()).discount(discount).message(message).build();
    }
}
