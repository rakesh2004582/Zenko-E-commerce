package com.henoria.ecommerce.controller;

import com.henoria.ecommerce.dto.ApiResponse;
import com.henoria.ecommerce.dto.PagedResponse;
import com.henoria.ecommerce.dto.product.ProductFilterRequest;
import com.henoria.ecommerce.dto.product.ProductRequest;
import com.henoria.ecommerce.dto.product.ProductResponse;
import com.henoria.ecommerce.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/** All endpoints here require ROLE_ADMIN (enforced globally in SecurityConfig for /api/admin/**) */
@RestController
@RequestMapping("/api/admin/products")
@RequiredArgsConstructor
public class AdminProductController {

    private final ProductService productService;

    @GetMapping
    public ApiResponse<PagedResponse<ProductResponse>> list(ProductFilterRequest filter) {
        // adminView=true -> includes inactive/soft-deleted products too
        return ApiResponse.ok(productService.search(filter, true));
    }

    @GetMapping("/{id}")
    public ApiResponse<ProductResponse> getById(@PathVariable Long id) {
        return ApiResponse.ok(productService.getById(id));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProductResponse>> create(@Valid @RequestBody ProductRequest request) {
        ProductResponse response = productService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Product created", response));
    }

    @PutMapping("/{id}")
    public ApiResponse<ProductResponse> update(@PathVariable Long id, @Valid @RequestBody ProductRequest request) {
        return ApiResponse.ok("Product updated", productService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        productService.delete(id);
        return ApiResponse.ok("Product deleted", null);
    }
}
