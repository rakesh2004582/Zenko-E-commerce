package com.henoria.ecommerce.controller;

import com.henoria.ecommerce.dto.ApiResponse;
import com.henoria.ecommerce.dto.PagedResponse;
import com.henoria.ecommerce.dto.order.OrderResponse;
import com.henoria.ecommerce.dto.product.ProductFilterRequest;
import com.henoria.ecommerce.dto.product.ProductRequest;
import com.henoria.ecommerce.dto.product.ProductResponse;
import com.henoria.ecommerce.dto.seller.SellerRegisterRequest;
import com.henoria.ecommerce.dto.seller.SellerResponse;
import com.henoria.ecommerce.entity.Seller;
import com.henoria.ecommerce.exception.ResourceNotFoundException;
import com.henoria.ecommerce.repository.OrderRepository;
import com.henoria.ecommerce.repository.SellerRepository;
import com.henoria.ecommerce.security.UserPrincipal;
import com.henoria.ecommerce.service.ProductService;
import com.henoria.ecommerce.service.SellerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Any logged-in customer can apply via POST /api/seller/register.
 * Product/order management endpoints require ROLE_SELLER (granted once admin approves).
 */
@RestController
@RequestMapping("/api/seller")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class SellerController {

    private final SellerService sellerService;
    private final SellerRepository sellerRepository;
    private final ProductService productService;
    private final OrderRepository orderRepository;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<SellerResponse>> register(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody SellerRegisterRequest request) {
        SellerResponse response = sellerService.registerAsSeller(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Application submitted - awaiting admin approval", response));
    }

    @GetMapping("/me")
    public ApiResponse<SellerResponse> myProfile(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.ok(sellerService.getMyProfile(principal.getId()));
    }

    @GetMapping("/products")
    @PreAuthorize("hasRole('SELLER')")
    public ApiResponse<PagedResponse<ProductResponse>> myProducts(
            @AuthenticationPrincipal UserPrincipal principal, ProductFilterRequest filter) {
        Long sellerId = currentSellerId(principal.getId());
        filter.setSellerId(sellerId);
        return ApiResponse.ok(productService.search(filter, true));
    }

    @PostMapping("/products")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<ApiResponse<ProductResponse>> addProduct(
            @AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody ProductRequest request) {
        Seller seller = approvedSeller(principal.getId());
        ProductResponse response = productService.createAsSeller(seller.getId(), seller.getBusinessName(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Product submitted - pending admin approval", response));
    }

    @PutMapping("/products/{id}")
    @PreAuthorize("hasRole('SELLER')")
    public ApiResponse<ProductResponse> updateProduct(
            @AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id,
            @Valid @RequestBody ProductRequest request) {
        Seller seller = approvedSeller(principal.getId());
        return ApiResponse.ok("Product updated - pending re-approval", productService.updateAsSeller(seller.getId(), id, request));
    }

    @DeleteMapping("/products/{id}")
    @PreAuthorize("hasRole('SELLER')")
    public ApiResponse<Void> deleteProduct(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id) {
        Seller seller = approvedSeller(principal.getId());
        productService.deleteAsSeller(seller.getId(), id);
        return ApiResponse.ok("Product removed", null);
    }

    @GetMapping("/orders")
    @PreAuthorize("hasRole('SELLER')")
    public ApiResponse<?> myOrders(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Seller seller = approvedSeller(principal.getId());
        Page<com.henoria.ecommerce.entity.Order> orders = orderRepository.findBySellerId(
                seller.getId(), PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return ApiResponse.ok(orders.map(o -> java.util.Map.of(
                "id", o.getId(),
                "orderNumber", o.getOrderNumber(),
                "status", o.getStatus().name(),
                "total", o.getTotal(),
                "createdAt", o.getCreatedAt().toString(),
                "itemCount", o.getItems().size()
        )));
    }

    private Long currentSellerId(Long userId) {
        return sellerRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Seller profile not found"))
                .getId();
    }

    private Seller approvedSeller(Long userId) {
        return sellerRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Seller profile not found"));
    }
}
