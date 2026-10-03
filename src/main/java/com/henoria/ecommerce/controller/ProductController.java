package com.henoria.ecommerce.controller;

import com.henoria.ecommerce.dto.ApiResponse;
import com.henoria.ecommerce.dto.PagedResponse;
import com.henoria.ecommerce.dto.product.ProductFilterRequest;
import com.henoria.ecommerce.dto.product.ProductResponse;
import com.henoria.ecommerce.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    /**
     * Main storefront browsing endpoint.
     * Example: /api/products?search=shirt&category=men-shirts&gender=men&minPrice=500&maxPrice=2000
     *          &rating=4&sizes=M,L&colors=red,blue&sortBy=price_asc&page=0&size=12
     */
    @GetMapping
    public ApiResponse<PagedResponse<ProductResponse>> search(ProductFilterRequest filter) {
        return ApiResponse.ok(productService.search(filter, false));
    }

    @GetMapping("/id/{id}")
    public ApiResponse<ProductResponse> getById(@PathVariable Long id) {
        return ApiResponse.ok(productService.getById(id));
    }

    @GetMapping("/{slug}")
    public ApiResponse<ProductResponse> getBySlug(@PathVariable String slug) {
        return ApiResponse.ok(productService.getBySlug(slug));
    }

    @GetMapping("/featured")
    public ApiResponse<List<ProductResponse>> featured() {
        return ApiResponse.ok(productService.getFeatured());
    }

    @GetMapping("/new-arrivals")
    public ApiResponse<List<ProductResponse>> newArrivals() {
        return ApiResponse.ok(productService.getNewArrivals());
    }

    @GetMapping("/trending")
    public ApiResponse<List<ProductResponse>> trending() {
        return ApiResponse.ok(productService.getTrending());
    }
}
