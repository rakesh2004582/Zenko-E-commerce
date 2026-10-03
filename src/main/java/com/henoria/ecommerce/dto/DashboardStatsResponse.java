package com.henoria.ecommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {
    private long totalProducts;
    private long totalOrders;
    private long totalUsers;
    private long totalCategories;
    private long pendingOrders;
    private long confirmedOrders;
    private long shippedOrders;
    private long deliveredOrders;
    private long cancelledOrders;
    private double totalRevenue;
    private double revenueThisMonth;
    private long ordersThisMonth;
    private long newUsersThisMonth;
}
