package com.henoria.ecommerce.repository;

import com.henoria.ecommerce.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    Page<Review> findByProductId(Long productId, Pageable pageable);
    boolean existsByProductIdAndUserId(Long productId, Long userId);
    long countByProductId(Long productId);
}
