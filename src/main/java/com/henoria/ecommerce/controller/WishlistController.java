package com.henoria.ecommerce.controller;

import com.henoria.ecommerce.dto.ApiResponse;
import com.henoria.ecommerce.dto.product.ProductResponse;
import com.henoria.ecommerce.security.UserPrincipal;
import com.henoria.ecommerce.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;

    @GetMapping
    public ApiResponse<List<ProductResponse>> myWishlist(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestHeader(value = "X-Guest-Id", required = false) String guestId) {
            
        Long userId = principal != null ? principal.getId() : null;
        return ApiResponse.ok(wishlistService.getWishlist(userId, guestId));
    }

    @PostMapping("/{productId}")
    public ApiResponse<List<Long>> add(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestHeader(value = "X-Guest-Id", required = false) String guestId,
            @PathVariable Long productId) {
            
        Long userId = principal != null ? principal.getId() : null;
        return ApiResponse.ok("Added to wishlist", wishlistService.addProduct(userId, guestId, productId));
    }

    @DeleteMapping("/{productId}")
    public ApiResponse<List<Long>> remove(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestHeader(value = "X-Guest-Id", required = false) String guestId,
            @PathVariable Long productId) {
            
        Long userId = principal != null ? principal.getId() : null;
        return ApiResponse.ok("Removed from wishlist", wishlistService.removeProduct(userId, guestId, productId));
    }
}
