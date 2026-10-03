package com.henoria.ecommerce.repository;

import com.henoria.ecommerce.entity.Order;
import com.henoria.ecommerce.entity.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByOrderNumber(String orderNumber);
    Page<Order> findByUserId(Long userId, Pageable pageable);
    Page<Order> findByStatus(OrderStatus status, Pageable pageable);
    long countByStatus(OrderStatus status);

    @Query("select distinct o from Order o join o.items i where i.product.sellerId = :sellerId order by o.createdAt desc")
    Page<Order> findBySellerId(@Param("sellerId") Long sellerId, Pageable pageable);
}
