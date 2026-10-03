
package com.henoria.ecommerce.entity;

import com.henoria.ecommerce.entity.enums.OrderStatus;
import com.henoria.ecommerce.entity.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Table(
        name = "orders",
        indexes = {
                @Index(name = "idx_order_user", columnList = "user_id"),
                @Index(name = "idx_order_status", columnList = "status"),
                @Index(name = "idx_order_created_at", columnList = "created_at")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(onlyExplicitlyIncluded = true)
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @ToString.Include
    private Long id;

    @Column(
            name = "order_number",
            unique = true,
            nullable = false,
            length = 50
    )
    @ToString.Include
    private String orderNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    @ToString.Exclude
    private User user;

    @OneToMany(
            mappedBy = "order",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @Builder.Default
    @ToString.Exclude
    private List<OrderItem> items = new ArrayList<>();

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(
                    name = "fullName",
                    column = @Column(name = "shipping_full_name")
            ),
            @AttributeOverride(
                    name = "phone",
                    column = @Column(name = "shipping_phone")
            ),
            @AttributeOverride(
                    name = "line1",
                    column = @Column(name = "shipping_line1")
            ),
            @AttributeOverride(
                    name = "line2",
                    column = @Column(name = "shipping_line2")
            ),
            @AttributeOverride(
                    name = "city",
                    column = @Column(name = "shipping_city")
            ),
            @AttributeOverride(
                    name = "state",
                    column = @Column(name = "shipping_state")
            ),
            @AttributeOverride(
                    name = "pincode",
                    column = @Column(name = "shipping_pincode")
            ),
            @AttributeOverride(
                    name = "country",
                    column = @Column(name = "shipping_country")
            )
    })
    private ShippingSnapshot shippingAddress;

    @Column(name = "coupon_applied")
    private String couponApplied;

    @Column(nullable = false)
    private Double subtotal;

    @Builder.Default
    @Column(nullable = false)
    private Double discount = 0.0;

    @Builder.Default
    @Column(name = "delivery_charge", nullable = false)
    private Double deliveryCharge = 0.0;

    @Column(nullable = false)
    private Double total;

    @Builder.Default
    @Column(name = "payment_method", nullable = false)
    private String paymentMethod = "COD";

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "payment_status", nullable = false)
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false)
    private OrderStatus status = OrderStatus.PENDING;

    @OneToMany(
            mappedBy = "order",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @OrderBy("timestamp ASC")
    @Builder.Default
    @ToString.Exclude
    private List<OrderStatusHistory> statusHistory =
            new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();

        createdAt = now;
        updatedAt = now;

        normalizeCollections();
        normalizeAmounts();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();

        normalizeCollections();
        normalizeAmounts();
    }

    public void addItem(OrderItem item) {
        if (item == null) {
            return;
        }

        if (items == null) {
            items = new ArrayList<>();
        }

        items.add(item);
        item.setOrder(this);
    }

    public void removeItem(OrderItem item) {
        if (item == null || items == null) {
            return;
        }

        items.remove(item);
        item.setOrder(null);
    }

    public void addStatusHistory(
            OrderStatusHistory history
    ) {
        if (history == null) {
            return;
        }

        if (statusHistory == null) {
            statusHistory = new ArrayList<>();
        }

        statusHistory.add(history);
        history.setOrder(this);
    }

    private void normalizeCollections() {
        if (items == null) {
            items = new ArrayList<>();
        }

        if (statusHistory == null) {
            statusHistory = new ArrayList<>();
        }
    }

    private void normalizeAmounts() {
        if (discount == null) {
            discount = 0.0;
        }

        if (deliveryCharge == null) {
            deliveryCharge = 0.0;
        }
    }

    @Override
    public boolean equals(Object object) {
        if (this == object) {
            return true;
        }

        if (!(object instanceof Order other)) {
            return false;
        }

        return id != null && Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ShippingSnapshot {

        private String fullName;
        private String phone;
        private String line1;
        private String line2;
        private String city;
        private String state;
        private String pincode;
        private String country;
    }
}

