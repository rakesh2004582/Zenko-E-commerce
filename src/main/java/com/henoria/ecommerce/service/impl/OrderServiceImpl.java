package com.henoria.ecommerce.service.impl;

import com.henoria.ecommerce.dto.PagedResponse;
import com.henoria.ecommerce.dto.order.OrderResponse;
import com.henoria.ecommerce.dto.order.PlaceOrderRequest;
import com.henoria.ecommerce.dto.order.UpdateOrderStatusRequest;
import com.henoria.ecommerce.entity.*;
import com.henoria.ecommerce.entity.enums.CouponType;
import com.henoria.ecommerce.entity.enums.OrderStatus;
import com.henoria.ecommerce.entity.enums.PaymentStatus;
import com.henoria.ecommerce.exception.BadRequestException;
import com.henoria.ecommerce.exception.ResourceNotFoundException;
import com.henoria.ecommerce.repository.*;
import com.henoria.ecommerce.service.EmailService;
import com.henoria.ecommerce.service.OrderService;
import com.henoria.ecommerce.util.OrderNumberGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.henoria.ecommerce.entity.enums.Role;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private static final double FREE_DELIVERY_THRESHOLD = 999.0;
    private static final double FLAT_DELIVERY_CHARGE = 49.0;

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final UserRepository userRepository;
    private final CouponRepository couponRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public OrderResponse placeOrder(Long userId, PlaceOrderRequest request) {
        User user;
        if (userId != null) {
            user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        } else {
            String email = (request.getShippingAddress() != null && request.getShippingAddress().getEmail() != null && !request.getShippingAddress().getEmail().isBlank())
                    ? request.getShippingAddress().getEmail()
                    : (request.getShippingAddress() != null && request.getShippingAddress().getPhone() != null ? request.getShippingAddress().getPhone() + "@henoria.com" : "guest_" + UUID.randomUUID().toString().substring(0, 8) + "@henoria.com");
            String phone = request.getShippingAddress() != null ? request.getShippingAddress().getPhone() : "";
            String name = request.getShippingAddress() != null ? request.getShippingAddress().getFullName() : "Guest Customer";

            user = userRepository.findByEmail(email).orElseGet(() -> {
                User newUser = User.builder()
                        .name(name)
                        .email(email)
                        .phone(phone)
                        .password(passwordEncoder.encode("Henoria@" + UUID.randomUUID().toString().substring(0, 8)))
                        .role(Role.CUSTOMER)
                        .build();
                return userRepository.save(newUser);
            });
        }

        List<OrderItem> orderItems = new ArrayList<>();
        double subtotal = 0.0;

        for (PlaceOrderRequest.OrderItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + itemReq.getProductId()));

            if (!product.isActive()) {
                throw new BadRequestException("Product '" + product.getName() + "' is no longer available");
            }

            int qty = itemReq.getQuantity() == null ? 1 : itemReq.getQuantity();
            if (qty < 1) throw new BadRequestException("Quantity must be at least 1");

            // deduct stock if inventory is tracked for this product
            Inventory inventory = inventoryRepository.findByProductId(product.getId()).orElse(null);
            if (inventory != null && itemReq.getSize() != null) {
                Integer available = inventory.getSizeStock().get(itemReq.getSize());
                if (available == null || available < qty) {
                    throw new BadRequestException("Insufficient stock for '" + product.getName() + "' size " + itemReq.getSize());
                }
                inventory.getSizeStock().put(itemReq.getSize(), available - qty);
                inventoryRepository.save(inventory);
            }

            double finalPrice = product.getFinalPrice() != null ? product.getFinalPrice() : product.getPrice();
            subtotal += finalPrice * qty;

            orderItems.add(OrderItem.builder()
                    .product(product)
                    .productName(product.getName())
                    .thumbnail(product.getThumbnail())
                    .price(product.getPrice())
                    .discountPercent(product.getDiscountPercent())
                    .finalPrice(finalPrice)
                    .quantity(qty)
                    .size(itemReq.getSize())
                    .color(itemReq.getColor())
                    .build());
        }

        double deliveryCharge = subtotal >= FREE_DELIVERY_THRESHOLD ? 0.0 : FLAT_DELIVERY_CHARGE;

        double discount = 0.0;
        String appliedCouponCode = null;
        if (request.getCouponCode() != null && !request.getCouponCode().isBlank()) {
            Coupon coupon = couponRepository.findByCodeIgnoreCase(request.getCouponCode())
                    .orElseThrow(() -> new BadRequestException("Invalid coupon code"));
            discount = validateAndCalculateDiscount(coupon, subtotal);
            if (coupon.getType() == CouponType.SHIPPING) {
                // shipping-type coupons waive the delivery charge instead of discounting the subtotal
                deliveryCharge = 0.0;
            }
            coupon.setUsedCount(coupon.getUsedCount() + 1);
            couponRepository.save(coupon);
            appliedCouponCode = coupon.getCode();
        }

        double total = Math.max(subtotal - discount, 0) + deliveryCharge;

        Order.ShippingSnapshot shipping = Order.ShippingSnapshot.builder()
                .fullName(request.getShippingAddress().getFullName())
                .phone(request.getShippingAddress().getPhone())
                .line1(request.getShippingAddress().getLine1())
                .line2(request.getShippingAddress().getLine2())
                .city(request.getShippingAddress().getCity())
                .state(request.getShippingAddress().getState())
                .pincode(request.getShippingAddress().getPincode())
                .country(request.getShippingAddress().getCountry() == null ? "India" : request.getShippingAddress().getCountry())
                .build();

        Order order = Order.builder()
                .orderNumber(OrderNumberGenerator.generate())
                .user(user)
                .shippingAddress(shipping)
                .couponApplied(appliedCouponCode)
                .subtotal(round(subtotal))
                .discount(round(discount))
                .deliveryCharge(deliveryCharge)
                .total(round(total))
                .paymentMethod("COD")
                .paymentStatus(PaymentStatus.PENDING)
                .status(OrderStatus.PENDING)
                .build();

        orderItems.forEach(order::addItem);

        order = orderRepository.save(order);

        OrderStatusHistory history = OrderStatusHistory.builder()
                .order(order)
                .status(OrderStatus.PENDING)
                .note("Order placed successfully (Cash on Delivery)")
                .build();
        order.getStatusHistory().add(history);
        order = orderRepository.save(order);

        String itemsSummary = orderItems.stream()
                .map(i -> i.getProductName() + " x" + i.getQuantity() + (i.getSize() != null ? " (" + i.getSize() + ")" : ""))
                .reduce((a, b) -> a + ", " + b).orElse("");
        emailService.sendOrderConfirmationEmail(user.getEmail(), user.getName(), order.getOrderNumber(),
                itemsSummary, order.getTotal(), order.getPaymentMethod());

        return toResponse(order);
    }

    @Override
    public OrderResponse getById(Long userId, Long orderId, boolean isAdmin) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        if (!isAdmin && !order.getUser().getId().equals(userId)) {
            throw new BadRequestException("You are not authorized to view this order");
        }
        return toResponse(order);
    }

    @Override
    public PagedResponse<OrderResponse> getMyOrders(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Order> orders = orderRepository.findByUserId(userId, pageable);
        return PagedResponse.from(orders.map(this::toResponse));
    }

    @Override
    public PagedResponse<OrderResponse> getAllOrders(String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Order> orders;
        if (status != null && !status.isBlank()) {
            orders = orderRepository.findByStatus(OrderStatus.valueOf(status.toUpperCase()), pageable);
        } else {
            orders = orderRepository.findAll(pageable);
        }
        return PagedResponse.from(orders.map(this::toResponse));
    }

    @Override
    @Transactional
    public OrderResponse updateStatus(Long orderId, UpdateOrderStatusRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        OrderStatus newStatus = OrderStatus.valueOf(request.getStatus().toUpperCase());
        order.setStatus(newStatus);

        // COD: mark payment collected once delivered
        if (newStatus == OrderStatus.DELIVERED) {
            order.setPaymentStatus(PaymentStatus.PAID);
        } else if (newStatus == OrderStatus.CANCELLED) {
            order.setPaymentStatus(PaymentStatus.FAILED);
        }

        OrderStatusHistory history = OrderStatusHistory.builder()
                .order(order)
                .status(newStatus)
                .note(request.getNote() != null ? request.getNote() : "Status updated to " + newStatus)
                .build();
        order.getStatusHistory().add(history);

        order = orderRepository.save(order);

        emailService.sendOrderStatusUpdateEmail(order.getUser().getEmail(), order.getUser().getName(),
                order.getOrderNumber(), newStatus.name(), history.getNote());

        return toResponse(order);
    }

    @Override
    @Transactional
    public OrderResponse cancelOrder(Long userId, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (!order.getUser().getId().equals(userId)) {
            throw new BadRequestException("You are not authorized to cancel this order");
        }
        if (order.getStatus() == OrderStatus.SHIPPED || order.getStatus() == OrderStatus.DELIVERED) {
            throw new BadRequestException("Order can no longer be cancelled as it has already been " + order.getStatus());
        }

        order.setStatus(OrderStatus.CANCELLED);
        order.setPaymentStatus(PaymentStatus.FAILED);

        // restock items
        for (OrderItem item : order.getItems()) {
            if (item.getProduct() != null && item.getSize() != null) {
                inventoryRepository.findByProductId(item.getProduct().getId()).ifPresent(inv -> {
                    inv.getSizeStock().merge(item.getSize(), item.getQuantity(), Integer::sum);
                    inventoryRepository.save(inv);
                });
            }
        }

        OrderStatusHistory history = OrderStatusHistory.builder()
                .order(order)
                .status(OrderStatus.CANCELLED)
                .note("Cancelled by customer")
                .build();
        order.getStatusHistory().add(history);

        order = orderRepository.save(order);

        emailService.sendOrderStatusUpdateEmail(order.getUser().getEmail(), order.getUser().getName(),
                order.getOrderNumber(), OrderStatus.CANCELLED.name(), "Cancelled by customer");

        return toResponse(order);
    }

    private double validateAndCalculateDiscount(Coupon coupon, double subtotal) {
        if (!coupon.isActive()) throw new BadRequestException("This coupon is no longer active");
        if (coupon.getExpiresAt() != null && coupon.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("This coupon has expired");
        }
        if (coupon.getUsageLimit() != null && coupon.getUsedCount() >= coupon.getUsageLimit()) {
            throw new BadRequestException("This coupon has reached its usage limit");
        }
        if (coupon.getMinOrderValue() != null && subtotal < coupon.getMinOrderValue()) {
            throw new BadRequestException("Minimum order value of " + coupon.getMinOrderValue() + " required for this coupon");
        }

        double discount;
        if (coupon.getType() == CouponType.PERCENTAGE) {
            discount = subtotal * (coupon.getValue() / 100.0);
            if (coupon.getMaxDiscount() != null) {
                discount = Math.min(discount, coupon.getMaxDiscount());
            }
        } else if (coupon.getType() == CouponType.FIXED) {
            discount = coupon.getValue();
        } else {
            discount = 0.0; // shipping-type coupons handled via deliveryCharge waiver, kept simple here
        }
        return discount;
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private OrderResponse toResponse(Order order) {
        List<OrderResponse.OrderItemView> items = order.getItems().stream()
                .map(item -> OrderResponse.OrderItemView.builder()
                        .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                        .productName(item.getProductName())
                        .thumbnail(item.getThumbnail())
                        .finalPrice(item.getFinalPrice())
                        .quantity(item.getQuantity())
                        .size(item.getSize())
                        .color(item.getColor())
                        .build())
                .toList();

        List<OrderResponse.StatusHistoryView> history = order.getStatusHistory().stream()
                .map(h -> OrderResponse.StatusHistoryView.builder()
                        .status(h.getStatus().name())
                        .timestamp(h.getTimestamp())
                        .note(h.getNote())
                        .build())
                .toList();

        return OrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .items(items)
                .shippingAddress(order.getShippingAddress() == null ? null : OrderResponse.ShippingAddressView.builder()
                        .fullName(order.getShippingAddress().getFullName())
                        .phone(order.getShippingAddress().getPhone())
                        .line1(order.getShippingAddress().getLine1())
                        .line2(order.getShippingAddress().getLine2())
                        .city(order.getShippingAddress().getCity())
                        .state(order.getShippingAddress().getState())
                        .pincode(order.getShippingAddress().getPincode())
                        .country(order.getShippingAddress().getCountry())
                        .build())
                .couponApplied(order.getCouponApplied())
                .paymentMethod(order.getPaymentMethod())
                .paymentStatus(order.getPaymentStatus().name())
                .status(order.getStatus().name())
                .subtotal(order.getSubtotal())
                .discount(order.getDiscount())
                .deliveryCharge(order.getDeliveryCharge())
                .total(order.getTotal())
                .statusHistory(history)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }
}
