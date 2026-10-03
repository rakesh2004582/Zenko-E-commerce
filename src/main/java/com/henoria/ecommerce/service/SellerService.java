package com.henoria.ecommerce.service;

import com.henoria.ecommerce.dto.PagedResponse;
import com.henoria.ecommerce.dto.seller.SellerRegisterRequest;
import com.henoria.ecommerce.dto.seller.SellerResponse;

public interface SellerService {
    SellerResponse registerAsSeller(Long userId, SellerRegisterRequest request);
    SellerResponse getMyProfile(Long userId);
    PagedResponse<SellerResponse> getAll(String status, int page, int size);
    SellerResponse approve(Long sellerId);
    SellerResponse reject(Long sellerId, String reason);
}
