package com.henoria.ecommerce.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "inventory")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Inventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false, unique = true)
    private Product product;

    // size -> quantity, e.g. {"S": 10, "M": 5}
    @ElementCollection
    @CollectionTable(name = "inventory_sizes", joinColumns = @JoinColumn(name = "inventory_id"))
    @MapKeyColumn(name = "size")
    @Column(name = "quantity")
    @Builder.Default
    private Map<String, Integer> sizeStock = new HashMap<>();

    @Builder.Default
    private Integer reserved = 0;

    private LocalDateTime lastUpdated;

    @PrePersist
    @PreUpdate
    protected void onSave() {
        this.lastUpdated = LocalDateTime.now();
    }

    public int getTotalStock() {
        return sizeStock.values().stream().mapToInt(Integer::intValue).sum();
    }

    public int getAvailable() {
        return getTotalStock() - (reserved == null ? 0 : reserved);
    }
}
