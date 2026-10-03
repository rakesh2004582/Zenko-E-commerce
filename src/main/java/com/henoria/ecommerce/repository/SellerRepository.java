package com.henoria.ecommerce.repository;

import com.henoria.ecommerce.entity.Seller;
import com.henoria.ecommerce.entity.enums.SellerStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SellerRepository extends JpaRepository<Seller, Long> {
    Optional<Seller> findByUserId(Long userId);
    boolean existsByUserId(Long userId);
    Page<Seller> findByStatus(SellerStatus status, Pageable pageable);
}
