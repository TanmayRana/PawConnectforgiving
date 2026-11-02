package com.example.PawConnect.mapper;

import com.example.PawConnect.dto.response.ProductCategoryResponse;
import com.example.PawConnect.dto.response.ProductResponse;
import com.example.PawConnect.model.Product;
import com.example.PawConnect.model.ProductCategory;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
public class ProductMapper {

    public ProductResponse toResponse(Product product) {
        if (product == null) {
            return null;
        }

        Long categoryId = null;
        String categoryName = null;
        if (product.getCategory() != null) {
            categoryId = product.getCategory().getId();
            categoryName = product.getCategory().getName();
        }

        List<String> imageUrls = Collections.emptyList();
        if (product.getImages() != null && !product.getImages().isEmpty()) {
            imageUrls = product.getImages().stream()
                    .map(img -> img.getImageUrl())
                    .toList();
        }

        return ProductResponse.builder()
                .id(product.getId())
                .categoryId(categoryId)
                .categoryName(categoryName)
                .name(product.getName())
                .sku(product.getSku())
                .description(product.getDescription())
                .price(product.getPrice())
                .stockQuantity(product.getStockQuantity())
                .weight(product.getWeight())
                .status(product.getStatus())
                .isActive(product.getIsActive())
                .imageUrls(imageUrls)
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }

    public ProductCategoryResponse toCategoryResponse(ProductCategory category) {
        if (category == null) {
            return null;
        }

        return ProductCategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .isActive(category.getIsActive())
                .createdAt(category.getCreatedAt())
                .build();
    }
}
