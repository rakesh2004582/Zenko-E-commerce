package com.henoria.ecommerce.service;

import com.henoria.ecommerce.dto.cart.CartItemRequest;
import com.henoria.ecommerce.dto.cart.CartItemResponse;
import com.henoria.ecommerce.entity.Cart;
import com.henoria.ecommerce.entity.CartItem;
import com.henoria.ecommerce.entity.Product;
import com.henoria.ecommerce.entity.User;
import com.henoria.ecommerce.exception.ResourceNotFoundException;
import com.henoria.ecommerce.repository.CartItemRepository;
import com.henoria.ecommerce.repository.CartRepository;
import com.henoria.ecommerce.repository.ProductRepository;
import com.henoria.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public List<CartItemResponse> getCart(Long userId, String guestId) {
        Cart cart = getOrCreateCart(userId, guestId);
        return cart.getItems().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public List<CartItemResponse> addItem(Long userId, String guestId, CartItemRequest request) {
        Cart cart = getOrCreateCart(userId, guestId);
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        Optional<CartItem> existingItem = cart.getItems().stream()
                .filter(i -> i.getProduct().getId().equals(product.getId())
                        && (i.getSize() == null || i.getSize().equals(request.getSize()))
                        && (i.getColor() == null || i.getColor().equals(request.getColor())))
                .findFirst();

        if (existingItem.isPresent()) {
            existingItem.get().setQuantity(existingItem.get().getQuantity() + request.getQuantity());
        } else {
            CartItem newItem = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .quantity(request.getQuantity())
                    .size(request.getSize())
                    .color(request.getColor())
                    .build();
            cart.addItem(newItem);
        }

        cartRepository.save(cart);
        return cart.getItems().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public List<CartItemResponse> updateItemQuantity(Long userId, String guestId, Long itemId, int quantity) {
        Cart cart = getOrCreateCart(userId, guestId);
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));

        if (!item.getCart().getId().equals(cart.getId())) {
            throw new IllegalArgumentException("Item does not belong to this cart");
        }

        item.setQuantity(quantity);
        cartItemRepository.save(item);
        
        // Refresh cart items
        return cart.getItems().stream()
                .map(i -> i.getId().equals(itemId) ? item : i)
                .map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public List<CartItemResponse> removeItem(Long userId, String guestId, Long itemId) {
        Cart cart = getOrCreateCart(userId, guestId);
        cart.getItems().removeIf(i -> i.getId().equals(itemId));
        cartRepository.save(cart);
        cartItemRepository.deleteById(itemId);
        return cart.getItems().stream().map(this::toResponse).collect(Collectors.toList());
    }

    private Cart getOrCreateCart(Long userId, String guestId) {
        if (userId != null) {
            Cart userCart = cartRepository.findByUserId(userId).orElseGet(() -> {
                User user = userRepository.findById(userId).orElseThrow();
                Cart cart = Cart.builder().user(user).build();
                return cartRepository.save(cart);
            });

            if (guestId != null && !guestId.isBlank()) {
                cartRepository.findByGuestId(guestId).ifPresent(guestCart -> {
                    if (guestCart.getItems() != null && !guestCart.getItems().isEmpty()) {
                        for (CartItem guestItem : new java.util.ArrayList<>(guestCart.getItems())) {
                            Optional<CartItem> existingItem = userCart.getItems().stream()
                                    .filter(i -> i.getProduct().getId().equals(guestItem.getProduct().getId())
                                            && java.util.Objects.equals(i.getSize(), guestItem.getSize())
                                            && java.util.Objects.equals(i.getColor(), guestItem.getColor()))
                                    .findFirst();

                            if (existingItem.isPresent()) {
                                existingItem.get().setQuantity(existingItem.get().getQuantity() + guestItem.getQuantity());
                            } else {
                                CartItem newItem = CartItem.builder()
                                        .cart(userCart)
                                        .product(guestItem.getProduct())
                                        .quantity(guestItem.getQuantity())
                                        .size(guestItem.getSize())
                                        .color(guestItem.getColor())
                                        .build();
                                userCart.addItem(newItem);
                            }
                        }
                    }
                    cartRepository.delete(guestCart);
                });
            }
            return cartRepository.save(userCart);
        } else if (guestId != null && !guestId.isBlank()) {
            return cartRepository.findByGuestId(guestId).orElseGet(() -> {
                Cart cart = Cart.builder().guestId(guestId).build();
                return cartRepository.save(cart);
            });
        }
        throw new IllegalArgumentException("Must provide userId or guestId");
    }

    private CartItemResponse toResponse(CartItem item) {
        return CartItemResponse.builder()
                .id(item.getId())
                .productId(String.valueOf(item.getProduct().getId()))
                .name(item.getProduct().getName())
                .thumbnail(item.getProduct().getThumbnail())
                .price(item.getProduct().getPrice())
                .finalPrice(item.getProduct().getFinalPrice())
                .discountPercent(item.getProduct().getDiscountPercent())
                .quantity(item.getQuantity())
                .size(item.getSize())
                .color(item.getColor())
                .build();
    }
}
