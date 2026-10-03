package com.henoria.ecommerce.controller;

import com.henoria.ecommerce.dto.ApiResponse;
import com.henoria.ecommerce.dto.PagedResponse;
import com.henoria.ecommerce.dto.product.ProductResponse;
import com.henoria.ecommerce.dto.seller.SellerResponse;
import com.henoria.ecommerce.service.ProductService;
import com.henoria.ecommerce.service.SellerService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** All endpoints here require ROLE_ADMIN (enforced globally in SecurityConfig for /api/admin/**) */
@RestController
@RequestMapping("/api/admin/sellers")
@RequiredArgsConstructor
public class AdminSellerController {

    private final SellerService sellerService;
    private final ProductService productService;

    @GetMapping
    public ApiResponse<PagedResponse<SellerResponse>> list(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(sellerService.getAll(status, page, size));
    }

    @PostMapping("/{id}/approve")
    public ApiResponse<SellerResponse> approve(@PathVariable Long id) {
        return ApiResponse.ok("Seller approved", sellerService.approve(id));
    }

    @PostMapping("/{id}/reject")
    public ApiResponse<SellerResponse> reject(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        return ApiResponse.ok("Seller application rejected", sellerService.reject(id, reason));
    }

    /** Approve/reject a product that a seller submitted (products start unapproved -> hidden from storefront) */
    @PatchMapping("/products/{productId}/approval")
    public ApiResponse<ProductResponse> setProductApproval(@PathVariable Long productId, @RequestParam boolean approved) {
        return ApiResponse.ok(approved ? "Product approved" : "Product rejected", productService.setApproval(productId, approved));
    }
}
