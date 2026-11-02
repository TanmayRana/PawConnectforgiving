package com.example.PawConnect.controller;

import com.example.PawConnect.dto.request.commerce.ApplyPromoRequest;
import com.example.PawConnect.dto.request.commerce.CreateCartItemRequest;
import com.example.PawConnect.dto.request.commerce.UpdateCartItemRequest;
import com.example.PawConnect.dto.response.CartResponse;
import com.example.PawConnect.dto.response.PromoValidationResponse;
import com.example.PawConnect.response.ApiResponse;
import com.example.PawConnect.service.CartService;
import com.example.PawConnect.service.CurrentUserService;
import com.example.PawConnect.service.PromoCodeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/me/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;
    private final PromoCodeService promoCodeService;
    private final CurrentUserService currentUserService;

    @GetMapping
    public ResponseEntity<ApiResponse<CartResponse>> getCart() {
        Long userId = currentUserService.getCurrentUserId();
        CartResponse cart = cartService.getCustomerCart(userId);
        return ResponseEntity.ok(ApiResponse.success(cart));
    }

    @PostMapping("/apply-promo")
    public ResponseEntity<ApiResponse<PromoValidationResponse>> applyPromo(@Valid @RequestBody ApplyPromoRequest request) {
        Long userId = currentUserService.getCurrentUserId();
        PromoValidationResponse response = promoCodeService.validatePromoCodeForCart(userId, request.getCode());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/items")
    public ResponseEntity<ApiResponse<CartResponse>> addItem(@Valid @RequestBody CreateCartItemRequest request) {
        Long userId = currentUserService.getCurrentUserId();
        CartResponse cart = cartService.addItemToCart(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(cart));
    }

    @PutMapping("/items/{cartItemId}")
    public ResponseEntity<ApiResponse<CartResponse>> updateItemQuantity(
            @PathVariable Long cartItemId,
            @Valid @RequestBody UpdateCartItemRequest request
    ) {
        Long userId = currentUserService.getCurrentUserId();
        CartResponse cart = cartService.updateCartItemQuantity(userId, cartItemId, request);
        return ResponseEntity.ok(ApiResponse.success(cart));
    }

    @PutMapping("/products/{productId}")
    public ResponseEntity<ApiResponse<CartResponse>> setProductQuantity(
            @PathVariable Long productId,
            @Valid @RequestBody UpdateCartItemRequest request
    ) {
        Long userId = currentUserService.getCurrentUserId();
        CartResponse cart = cartService.setProductQuantity(userId, productId, request.getQuantity());
        return ResponseEntity.ok(ApiResponse.success(cart));
    }

    @PutMapping("/items")
    public ResponseEntity<ApiResponse<CartResponse>> setItemQuantityByProduct(
            @Valid @RequestBody CreateCartItemRequest request
    ) {
        Long userId = currentUserService.getCurrentUserId();
        CartResponse cart = cartService.setProductQuantity(userId, request.getProductId(), request.getQuantity());
        return ResponseEntity.ok(ApiResponse.success(cart));
    }

    @DeleteMapping("/items/{cartItemId}")
    public ResponseEntity<ApiResponse<CartResponse>> removeItem(@PathVariable Long cartItemId) {
        Long userId = currentUserService.getCurrentUserId();
        CartResponse cart = cartService.removeCartItem(userId, cartItemId);
        return ResponseEntity.ok(ApiResponse.success(cart));
    }

    @DeleteMapping({"", "/items"})
    public ResponseEntity<ApiResponse<CartResponse>> clearCart() {
        Long userId = currentUserService.getCurrentUserId();
        CartResponse cart = cartService.clearCart(userId);
        return ResponseEntity.ok(ApiResponse.success(cart));
    }
}
