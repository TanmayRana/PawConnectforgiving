package com.example.PawConnect.service;

import com.example.PawConnect.dto.request.commerce.CreateCartItemRequest;
import com.example.PawConnect.dto.request.commerce.UpdateCartItemRequest;
import com.example.PawConnect.dto.response.CartResponse;

public interface CartService {

    CartResponse getCustomerCart(Long userId);

    CartResponse addItemToCart(Long userId, CreateCartItemRequest request);

    CartResponse updateCartItemQuantity(Long userId, Long cartItemId, UpdateCartItemRequest request);

    CartResponse setProductQuantity(Long userId, Long productId, Integer quantity);

    CartResponse removeCartItem(Long userId, Long cartItemId);

    CartResponse clearCart(Long userId);
}
