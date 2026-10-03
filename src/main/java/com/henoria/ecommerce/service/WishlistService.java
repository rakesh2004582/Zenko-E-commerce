package com.henoria.ecommerce.service;

import com.henoria.ecommerce.dto.product.ProductResponse;
import com.henoria.ecommerce.entity.Product;
import com.henoria.ecommerce.entity.User;
import com.henoria.ecommerce.entity.Wishlist;
import com.henoria.ecommerce.exception.ResourceNotFoundException;
import com.henoria.ecommerce.repository.ProductRepository;
import com.henoria.ecommerce.repository.UserRepository;
import com.henoria.ecommerce.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ProductService productService;

    public List<ProductResponse> getWishlist(Long userId, String guestId) {
        if (userId != null && guestId != null && !guestId.isBlank()) {
            mergeGuestWishlist(userId, guestId);
        }
        List<Long> productIds;
        if (userId != null) {
            productIds = wishlistRepository.findProductIdsByUserId(userId);
        } else if (guestId != null && !guestId.isBlank()) {
            productIds = wishlistRepository.findProductIdsByGuestId(guestId);
        } else {
            return List.of();
        }
        return productService.getByIds(productIds);
    }

    private void mergeGuestWishlist(Long userId, String guestId) {
        List<Wishlist> guestItems = wishlistRepository.findByGuestId(guestId);
        if (!guestItems.isEmpty()) {
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                for (Wishlist gw : guestItems) {
                    Optional<Wishlist> existing = wishlistRepository.findByUserIdAndProductId(userId, gw.getProduct().getId());
                    if (existing.isEmpty()) {
                        gw.setUser(user);
                        gw.setGuestId(null);
                        wishlistRepository.save(gw);
                    } else {
                        wishlistRepository.delete(gw);
                    }
                }
            }
        }
    }

    @Transactional
    public List<Long> addProduct(Long userId, String guestId, Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        Optional<Wishlist> existing;
        if (userId != null) {
            existing = wishlistRepository.findByUserIdAndProductId(userId, productId);
        } else {
            existing = wishlistRepository.findByGuestIdAndProductId(guestId, productId);
        }

        if (existing.isEmpty()) {
            Wishlist wishlist = Wishlist.builder()
                    .product(product)
                    .build();

            if (userId != null) {
                User user = userRepository.findById(userId).orElseThrow();
                wishlist.setUser(user);
            } else {
                wishlist.setGuestId(guestId);
            }

            wishlistRepository.save(wishlist);
        }

        return getProductIds(userId, guestId);
    }

    @Transactional
    public List<Long> removeProduct(Long userId, String guestId, Long productId) {
        Optional<Wishlist> existing;
        if (userId != null) {
            existing = wishlistRepository.findByUserIdAndProductId(userId, productId);
        } else {
            existing = wishlistRepository.findByGuestIdAndProductId(guestId, productId);
        }

        existing.ifPresent(wishlistRepository::delete);
        return getProductIds(userId, guestId);
    }

    private List<Long> getProductIds(Long userId, String guestId) {
        if (userId != null) {
            return wishlistRepository.findProductIdsByUserId(userId);
        } else if (guestId != null) {
            return wishlistRepository.findProductIdsByGuestId(guestId);
        }
        return List.of();
    }
}
