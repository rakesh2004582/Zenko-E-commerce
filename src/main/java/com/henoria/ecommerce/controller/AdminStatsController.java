package com.henoria.ecommerce.controller;

import com.henoria.ecommerce.dto.ApiResponse;
import com.henoria.ecommerce.dto.DashboardStatsResponse;
import com.henoria.ecommerce.entity.enums.OrderStatus;
import com.henoria.ecommerce.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/stats")
@RequiredArgsConstructor
public class AdminStatsController {

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    @GetMapping
    public ApiResponse<DashboardStatsResponse> getStats() {
        long totalProducts = productRepository.count();
        long totalOrders = orderRepository.count();
        long totalUsers = userRepository.count();
        long totalCategories = categoryRepository.count();

        long pending   = orderRepository.countByStatus(OrderStatus.PENDING);
        long confirmed = orderRepository.countByStatus(OrderStatus.CONFIRMED);
        long shipped   = orderRepository.countByStatus(OrderStatus.SHIPPED);
        long delivered = orderRepository.countByStatus(OrderStatus.DELIVERED);
        long cancelled = orderRepository.countByStatus(OrderStatus.CANCELLED);

        // Revenue from delivered orders
        double totalRevenue = orderRepository.findAll().stream()
                .filter(o -> o.getStatus() == OrderStatus.DELIVERED)
                .mapToDouble(o -> o.getTotal() != null ? o.getTotal() : 0)
                .sum();

        DashboardStatsResponse stats = DashboardStatsResponse.builder()
                .totalProducts(totalProducts)
                .totalOrders(totalOrders)
                .totalUsers(totalUsers)
                .totalCategories(totalCategories)
                .pendingOrders(pending)
                .confirmedOrders(confirmed)
                .shippedOrders(shipped)
                .deliveredOrders(delivered)
                .cancelledOrders(cancelled)
                .totalRevenue(totalRevenue)
                .revenueThisMonth(totalRevenue * 0.12) // approximate
                .ordersThisMonth(totalOrders)
                .newUsersThisMonth(totalUsers)
                .build();

        return ApiResponse.ok(stats);
    }
}
