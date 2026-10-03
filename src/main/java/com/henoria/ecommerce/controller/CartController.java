package com.henoria.ecommerce.controller;

import com.henoria.ecommerce.dto.ApiResponse;
import com.henoria.ecommerce.dto.cart.CartItemRequest;
import com.henoria.ecommerce.dto.cart.CartItemResponse;
import com.henoria.ecommerce.security.UserPrincipal;
import com.henoria.ecommerce.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ApiResponse<List<CartItemResponse>> getCart(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestHeader(value = "X-Guest-Id", required = false) String guestId) {
        
        Long userId = principal != null ? principal.getId() : null;
        return ApiResponse.ok(cartService.getCart(userId, guestId));
    }

    @PostMapping("/items")
    public ApiResponse<List<CartItemResponse>> addItem(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestHeader(value = "X-Guest-Id", required = false) String guestId,
            @Valid @RequestBody CartItemRequest request) {
        
        Long userId = principal != null ? principal.getId() : null;
        return ApiResponse.ok("Item added to cart", cartService.addItem(userId, guestId, request));
    }

    @PutMapping("/items/{itemId}")
    public ApiResponse<List<CartItemResponse>> updateItem(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestHeader(value = "X-Guest-Id", required = false) String guestId,
            @PathVariable Long itemId,
            @RequestParam int quantity) {
            
        Long userId = principal != null ? principal.getId() : null;
        return ApiResponse.ok("Quantity updated", cartService.updateItemQuantity(userId, guestId, itemId, quantity));
    }

    @DeleteMapping("/items/{itemId}")
    public ApiResponse<List<CartItemResponse>> removeItem(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestHeader(value = "X-Guest-Id", required = false) String guestId,
            @PathVariable Long itemId) {
            
        Long userId = principal != null ? principal.getId() : null;
        return ApiResponse.ok("Item removed", cartService.removeItem(userId, guestId, itemId));
    }
}
