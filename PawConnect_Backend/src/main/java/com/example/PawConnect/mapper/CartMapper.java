package com.example.PawConnect.mapper;

import com.example.PawConnect.dto.response.CartItemResponse;
import com.example.PawConnect.dto.response.CartResponse;
import com.example.PawConnect.model.Cart;
import com.example.PawConnect.model.CartItem;
import com.example.PawConnect.model.Product;
import com.example.PawConnect.model.ProductStatus;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

@Component
public class CartMapper {

    public CartItemResponse toItemResponse(CartItem item) {
        if (item == null) {
            return null;
        }

        Product product = item.getProduct();
        Long productId = product != null ? product.getId() : null;
        String productName = product != null ? product.getName() : "Unknown Product";
        String productSku = product != null ? product.getSku() : null;
        BigDecimal unitPrice = product != null ? product.getPrice() : item.getUnitPrice();
        Integer availableStock = product != null ? product.getStockQuantity() : 0;

        String productImageUrl = null;
        String categoryName = null;
        if (product != null) {
            if (product.getCategory() != null) {
                categoryName = product.getCategory().getName();
            }
            if (product.getImages() != null && !product.getImages().isEmpty()) {
                productImageUrl = product.getImages().stream()
                        .filter(img -> Boolean.TRUE.equals(img.getIsPrimary()))
                        .map(com.example.PawConnect.model.ProductImage::getImageUrl)
                        .findFirst()
                        .orElseGet(() -> product.getImages().get(0).getImageUrl());
            }
        }

        boolean isAvailable = product != null
                && Boolean.TRUE.equals(product.getIsActive())
                && product.getStatus() == ProductStatus.ACTIVE
                && availableStock >= item.getQuantity();

        BigDecimal lineTotal = unitPrice != null && item.getQuantity() != null
                ? unitPrice.multiply(BigDecimal.valueOf(item.getQuantity()))
                : BigDecimal.ZERO;

        return CartItemResponse.builder()
                .id(item.getId())
                .cartId(item.getCart() != null ? item.getCart().getId() : null)
                .productId(productId)
                .productName(productName)
                .productSku(productSku)
                .productImageUrl(productImageUrl)
                .imageUrl(productImageUrl)
                .category(categoryName)
                .categoryName(categoryName)
                .unitPrice(unitPrice)
                .quantity(item.getQuantity())
                .lineTotal(lineTotal)
                .availableStock(availableStock)
                .isAvailable(isAvailable)
                .build();
    }

    public CartResponse toResponse(Cart cart, List<CartItem> items) {
        if (cart == null) {
            return null;
        }

        List<CartItemResponse> itemResponses = items != null
                ? items.stream().map(this::toItemResponse).toList()
                : Collections.emptyList();

        BigDecimal subtotal = BigDecimal.ZERO;
        int totalItems = 0;

        for (CartItemResponse ir : itemResponses) {
            if (ir.getLineTotal() != null) {
                subtotal = subtotal.add(ir.getLineTotal());
            }
            if (ir.getQuantity() != null) {
                totalItems += ir.getQuantity();
            }
        }

        return CartResponse.builder()
                .id(cart.getId())
                .userId(cart.getUser() != null ? cart.getUser().getId() : null)
                .status(cart.getStatus())
                .items(itemResponses)
                .subtotal(subtotal)
                .totalItems(totalItems)
                .build();
    }
}
