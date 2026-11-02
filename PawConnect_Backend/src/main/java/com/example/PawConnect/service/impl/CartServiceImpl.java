package com.example.PawConnect.service.impl;

import com.example.PawConnect.dto.request.commerce.CreateCartItemRequest;
import com.example.PawConnect.dto.request.commerce.UpdateCartItemRequest;
import com.example.PawConnect.dto.response.CartResponse;
import com.example.PawConnect.exception.BusinessRuleException;
import com.example.PawConnect.exception.ForbiddenException;
import com.example.PawConnect.exception.InsufficientStockException;
import com.example.PawConnect.exception.ResourceNotFoundException;
import com.example.PawConnect.mapper.CartMapper;
import com.example.PawConnect.model.*;
import com.example.PawConnect.repository.CartItemRepository;
import com.example.PawConnect.repository.CartRepository;
import com.example.PawConnect.repository.ProductRepository;
import com.example.PawConnect.repository.UserRepository;
import com.example.PawConnect.service.CartService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CartMapper cartMapper;

    @Transactional
    public Cart getOrCreateActiveCart(Long userId) {
        Optional<Cart> existing = cartRepository.findTopByUserIdAndStatusOrderByUpdatedAtDesc(userId, CartStatus.ACTIVE);
        if (existing.isPresent()) {
            return existing.get();
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        try {
            Cart newCart = Cart.builder()
                    .user(user)
                    .status(CartStatus.ACTIVE)
                    .build();
            return cartRepository.save(newCart);
        } catch (DataIntegrityViolationException ex) {
            // Concurrent request created active cart simultaneously
            return cartRepository.findTopByUserIdAndStatusOrderByUpdatedAtDesc(userId, CartStatus.ACTIVE)
                    .orElseThrow(() -> new BusinessRuleException("Could not resolve active cart"));
        }
    }

    @Override
    @Transactional
    public CartResponse getCustomerCart(Long userId) {
        Cart cart = getOrCreateActiveCart(userId);
        List<CartItem> items = cartItemRepository.findByCartId(cart.getId());
        return cartMapper.toResponse(cart, items);
    }

    @Override
    @Transactional
    public CartResponse addItemToCart(Long userId, CreateCartItemRequest request) {
        Cart baseCart = getOrCreateActiveCart(userId);
        Cart cart = cartRepository.findByIdForUpdate(baseCart.getId()).orElse(baseCart);

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + request.getProductId()));

        if (!Boolean.TRUE.equals(product.getIsActive()) || product.getStatus() != ProductStatus.ACTIVE) {
            throw new IllegalArgumentException("Product is not active or available for purchase");
        }

        if (request.getQuantity() == null || request.getQuantity() <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than zero");
        }

        Optional<CartItem> existingItemOpt = cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId());

        int targetQuantity = request.getQuantity();
        if (existingItemOpt.isPresent()) {
            targetQuantity += existingItemOpt.get().getQuantity();
        }

        if (targetQuantity > product.getStockQuantity()) {
            throw new InsufficientStockException(String.format(
                    "Requested quantity (%d) exceeds available stock (%d) for product '%s'",
                    targetQuantity, product.getStockQuantity(), product.getName()
            ));
        }

        if (existingItemOpt.isPresent()) {
            CartItem existingItem = existingItemOpt.get();
            existingItem.setQuantity(targetQuantity);
            existingItem.setUnitPrice(product.getPrice()); // Always refresh with trusted server price
            cartItemRepository.save(existingItem);
            log.info("Updated quantity for cart item {} in cart {}", existingItem.getId(), cart.getId());
        } else {
            CartItem newItem = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .quantity(request.getQuantity())
                    .unitPrice(product.getPrice()) // Trusted server price
                    .build();
            cartItemRepository.save(newItem);
            log.info("Added new item for product {} to cart {}", product.getId(), cart.getId());
        }

        List<CartItem> items = cartItemRepository.findByCartId(cart.getId());
        return cartMapper.toResponse(cart, items);
    }

    @Override
    @Transactional
    public CartResponse setProductQuantity(Long userId, Long productId, Integer quantity) {
        Cart baseCart = getOrCreateActiveCart(userId);
        Cart cart = cartRepository.findByIdForUpdate(baseCart.getId()).orElse(baseCart);

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        Optional<CartItem> existingItemOpt = cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId());

        if (quantity == null || quantity <= 0) {
            existingItemOpt.ifPresent(item -> {
                cartItemRepository.delete(item);
                log.info("Removed cart item {} for product {} from cart {}", item.getId(), productId, cart.getId());
            });
        } else {
            if (!Boolean.TRUE.equals(product.getIsActive()) || product.getStatus() != ProductStatus.ACTIVE) {
                throw new BusinessRuleException("Product is not active or available for purchase");
            }

            if (quantity > product.getStockQuantity()) {
                throw new InsufficientStockException(String.format(
                        "Requested quantity (%d) exceeds available stock (%d) for product '%s'",
                        quantity, product.getStockQuantity(), product.getName()
                ));
            }

            if (existingItemOpt.isPresent()) {
                CartItem existingItem = existingItemOpt.get();
                existingItem.setQuantity(quantity);
                existingItem.setUnitPrice(product.getPrice());
                cartItemRepository.save(existingItem);
                log.info("Set quantity for cart item {} in cart {} to {}", existingItem.getId(), cart.getId(), quantity);
            } else {
                CartItem newItem = CartItem.builder()
                        .cart(cart)
                        .product(product)
                        .quantity(quantity)
                        .unitPrice(product.getPrice())
                        .build();
                cartItemRepository.save(newItem);
                log.info("Added new item for product {} to cart {} with quantity {}", product.getId(), cart.getId(), quantity);
            }
        }

        List<CartItem> items = cartItemRepository.findByCartId(cart.getId());
        return cartMapper.toResponse(cart, items);
    }

    @Override
    @Transactional
    public CartResponse updateCartItemQuantity(Long userId, Long cartItemId, UpdateCartItemRequest request) {
        Cart cart = getOrCreateActiveCart(userId);

        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found with id: " + cartItemId));

        if (!item.getCart().getId().equals(cart.getId())) {
            throw new ForbiddenException("Access denied: you do not own this cart item");
        }

        Product product = item.getProduct();
        if (!Boolean.TRUE.equals(product.getIsActive()) || product.getStatus() != ProductStatus.ACTIVE) {
            throw new BusinessRuleException("Product is no longer active or available for purchase");
        }

        if (request.getQuantity() == null || request.getQuantity() <= 0) {
            cartItemRepository.delete(item);
            log.info("Removed cart item {} from cart {} due to zero quantity", item.getId(), cart.getId());
            List<CartItem> items = cartItemRepository.findByCartId(cart.getId());
            return cartMapper.toResponse(cart, items);
        }

        if (request.getQuantity() > product.getStockQuantity()) {
            throw new InsufficientStockException(String.format(
                    "Requested quantity (%d) exceeds available stock (%d) for product '%s'",
                    request.getQuantity(), product.getStockQuantity(), product.getName()
            ));
        }

        item.setQuantity(request.getQuantity());
        item.setUnitPrice(product.getPrice());
        cartItemRepository.save(item);

        List<CartItem> items = cartItemRepository.findByCartId(cart.getId());
        return cartMapper.toResponse(cart, items);
    }

    @Override
    @Transactional
    public CartResponse removeCartItem(Long userId, Long cartItemId) {
        Cart cart = getOrCreateActiveCart(userId);

        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found with id: " + cartItemId));

        if (!item.getCart().getId().equals(cart.getId())) {
            throw new ForbiddenException("Access denied: you do not own this cart item");
        }

        cartItemRepository.delete(item);
        log.info("Removed cart item {} from cart {}", cartItemId, cart.getId());

        List<CartItem> items = cartItemRepository.findByCartId(cart.getId());
        return cartMapper.toResponse(cart, items);
    }

    @Override
    @Transactional
    public CartResponse clearCart(Long userId) {
        Cart cart = getOrCreateActiveCart(userId);
        cartItemRepository.deleteByCartId(cart.getId());
        log.info("Cleared all items in cart {}", cart.getId());

        return cartMapper.toResponse(cart, List.of());
    }
}
