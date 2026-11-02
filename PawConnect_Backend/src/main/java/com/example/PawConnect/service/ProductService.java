package com.example.PawConnect.service;

import com.example.PawConnect.dto.request.admin.CategoryRequest;
import com.example.PawConnect.dto.request.admin.ProductRequest;
import com.example.PawConnect.dto.request.admin.UpdateProductStatusRequest;
import com.example.PawConnect.dto.request.admin.UpdateStockRequest;
import com.example.PawConnect.dto.response.ProductCategoryResponse;
import com.example.PawConnect.dto.response.ProductResponse;
import com.example.PawConnect.model.ProductStatus;
import com.example.PawConnect.response.PageResponse;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;

public interface ProductService {

    // Public catalog operations
    PageResponse<ProductResponse> getPublicProducts(
            String search,
            Long categoryId,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Boolean inStock,
            Boolean featured,
            Pageable pageable
    );

    ProductResponse getPublicProductById(Long productId);

    List<ProductCategoryResponse> getPublicCategories();

    List<ProductResponse> getFeaturedProducts(int limit);

    // Admin catalog management
    ProductResponse createProduct(ProductRequest request, Long adminUserId);

    ProductResponse updateProduct(Long productId, ProductRequest request);

    ProductResponse updateProductStatus(Long productId, UpdateProductStatusRequest request);

    ProductResponse updateProductStock(Long productId, UpdateStockRequest request);

    PageResponse<ProductResponse> getAdminProducts(
            String search,
            Long categoryId,
            ProductStatus status,
            Boolean isActive,
            Pageable pageable
    );

    ProductResponse getAdminProductById(Long productId);

    void deleteProduct(Long productId);

    ProductCategoryResponse createCategory(CategoryRequest request);

    ProductCategoryResponse updateCategory(Long categoryId, CategoryRequest request);

    List<ProductCategoryResponse> getAllCategories();
}
