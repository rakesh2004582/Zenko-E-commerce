package com.henoria.ecommerce.service;

import com.henoria.ecommerce.dto.PagedResponse;
import com.henoria.ecommerce.dto.order.OrderResponse;
import com.henoria.ecommerce.dto.order.PlaceOrderRequest;
import com.henoria.ecommerce.dto.order.UpdateOrderStatusRequest;

public interface OrderService {
    OrderResponse placeOrder(Long userId, PlaceOrderRequest request);
    OrderResponse getById(Long userId, Long orderId, boolean isAdmin);
    PagedResponse<OrderResponse> getMyOrders(Long userId, int page, int size);
    PagedResponse<OrderResponse> getAllOrders(String status, int page, int size);
    OrderResponse updateStatus(Long orderId, UpdateOrderStatusRequest request);
    OrderResponse cancelOrder(Long userId, Long orderId);
}
