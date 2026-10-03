package com.henoria.ecommerce.repository;

import com.henoria.ecommerce.entity.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface WishlistRepository extends JpaRepository<Wishlist, Long> {
    List<Wishlist> findByUserId(Long userId);
    List<Wishlist> findByGuestId(String guestId);

    @Query("SELECT w.product.id FROM Wishlist w WHERE w.user.id = :userId")
    List<Long> findProductIdsByUserId(@Param("userId") Long userId);

    @Query("SELECT w.product.id FROM Wishlist w WHERE w.guestId = :guestId")
    List<Long> findProductIdsByGuestId(@Param("guestId") String guestId);

    Optional<Wishlist> findByUserIdAndProductId(Long userId, Long productId);
    Optional<Wishlist> findByGuestIdAndProductId(String guestId, Long productId);
}
