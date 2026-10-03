package com.henoria.ecommerce.service.impl;

import com.henoria.ecommerce.dto.PagedResponse;
import com.henoria.ecommerce.dto.review.ReviewRequest;
import com.henoria.ecommerce.dto.review.ReviewResponse;
import com.henoria.ecommerce.entity.Product;
import com.henoria.ecommerce.entity.Review;
import com.henoria.ecommerce.entity.User;
import com.henoria.ecommerce.exception.BadRequestException;
import com.henoria.ecommerce.exception.ResourceNotFoundException;
import com.henoria.ecommerce.repository.ProductRepository;
import com.henoria.ecommerce.repository.ReviewRepository;
import com.henoria.ecommerce.repository.UserRepository;
import com.henoria.ecommerce.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public ReviewResponse addReview(Long userId, ReviewRequest request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (reviewRepository.existsByProductIdAndUserId(product.getId(), userId)) {
            throw new BadRequestException("You have already reviewed this product");
        }

        Review review = Review.builder()
                .product(product)
                .user(user)
                .rating(request.getRating())
                .title(request.getTitle())
                .body(request.getBody())
                .images(request.getImages())
                .helpful(0)
                .verified(false)
                .build();

        review = reviewRepository.save(review);
        recalculateProductRating(product);

        return toResponse(review);
    }

    @Override
    public PagedResponse<ReviewResponse> getProductReviews(Long productId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Review> reviews = reviewRepository.findByProductId(productId, pageable);
        return PagedResponse.from(reviews.map(this::toResponse));
    }

    @Override
    @Transactional
    public void markHelpful(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));
        review.setHelpful(review.getHelpful() + 1);
        reviewRepository.save(review);
    }

    @Override
    @Transactional
    public void deleteReview(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));
        Product product = review.getProduct();
        reviewRepository.delete(review);
        recalculateProductRating(product);
    }

    private void recalculateProductRating(Product product) {
        List<Review> all = reviewRepository.findByProductId(product.getId(), Pageable.unpaged()).getContent();
        int count = all.size();
        double avg = count == 0 ? 0.0 : all.stream().mapToInt(Review::getRating).average().orElse(0.0);
        product.setRating(Math.round(avg * 10.0) / 10.0);
        product.setReviewCount(count);
        productRepository.save(product);
    }

    private ReviewResponse toResponse(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .productId(review.getProduct().getId())
                .userId(review.getUser().getId())
                .userName(review.getUser().getName())
                .rating(review.getRating())
                .title(review.getTitle())
                .body(review.getBody())
                .images(review.getImages())
                .helpful(review.getHelpful())
                .verified(review.isVerified())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
