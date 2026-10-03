package com.henoria.ecommerce.service;

import com.henoria.ecommerce.dto.PagedResponse;
import com.henoria.ecommerce.dto.product.ProductFilterRequest;
import com.henoria.ecommerce.dto.product.ProductRequest;
import com.henoria.ecommerce.dto.product.ProductResponse;

import java.util.List;

public interface ProductService {
    ProductResponse create(ProductRequest request);
    ProductResponse update(Long id, ProductRequest request);
    void delete(Long id);

    // ── Marketplace seller operations (product is scoped to the seller, needs admin approval) ──
    ProductResponse createAsSeller(Long sellerId, String sellerName, ProductRequest request);
    ProductResponse updateAsSeller(Long sellerId, Long productId, ProductRequest request);
    void deleteAsSeller(Long sellerId, Long productId);
    ProductResponse setApproval(Long productId, boolean approved);
    ProductResponse getById(Long id);
    ProductResponse getBySlug(String slug);
    PagedResponse<ProductResponse> search(ProductFilterRequest filter, boolean adminView);
    List<ProductResponse> getFeatured();
    List<ProductResponse> getNewArrivals();
    List<ProductResponse> getTrending();
    List<ProductResponse> getByIds(List<Long> ids);
}
