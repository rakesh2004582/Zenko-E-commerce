package com.henoria.ecommerce.service;

import com.henoria.ecommerce.dto.PagedResponse;
import com.henoria.ecommerce.dto.review.ReviewRequest;
import com.henoria.ecommerce.dto.review.ReviewResponse;

public interface ReviewService {
    ReviewResponse addReview(Long userId, ReviewRequest request);
    PagedResponse<ReviewResponse> getProductReviews(Long productId, int page, int size);
    void markHelpful(Long reviewId);
    void deleteReview(Long reviewId);
}
