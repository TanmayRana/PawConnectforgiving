package com.example.PawConnect.controller;

import com.example.PawConnect.dto.request.admin.CategoryRequest;
import com.example.PawConnect.dto.request.admin.ProductRequest;
import com.example.PawConnect.dto.request.admin.UpdateProductStatusRequest;
import com.example.PawConnect.dto.request.admin.UpdateStockRequest;
import com.example.PawConnect.dto.response.ProductCategoryResponse;
import com.example.PawConnect.dto.response.ProductResponse;
import com.example.PawConnect.model.ProductStatus;
import com.example.PawConnect.response.ApiResponse;
import com.example.PawConnect.response.PageResponse;
import com.example.PawConnect.service.CurrentUserService;
import com.example.PawConnect.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminProductController {

    private final ProductService productService;
    private final CurrentUserService currentUserService;

    @PostMapping("/products")
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(@Valid @RequestBody ProductRequest request) {
        Long adminUserId = currentUserService.getCurrentUserId();
        ProductResponse response = productService.createProduct(request, adminUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(response));
    }

    @PutMapping("/products/{productId}")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @PathVariable Long productId,
            @Valid @RequestBody ProductRequest request
    ) {
        ProductResponse response = productService.updateProduct(productId, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/products/{productId}/status")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProductStatus(
            @PathVariable Long productId,
            @Valid @RequestBody UpdateProductStatusRequest request
    ) {
        ProductResponse response = productService.updateProductStatus(productId, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/products/{productId}/stock")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProductStock(
            @PathVariable Long productId,
            @Valid @RequestBody UpdateStockRequest request
    ) {
        ProductResponse response = productService.updateProductStock(productId, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/products")
    public ResponseEntity<ApiResponse<PageResponse<ProductResponse>>> getAdminProducts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) ProductStatus status,
            @RequestParam(required = false) Boolean isActive,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        PageResponse<ProductResponse> products = productService.getAdminProducts(
                search, categoryId, status, isActive, pageable
        );
        return ResponseEntity.ok(ApiResponse.success(products));
    }

    @GetMapping("/products/{productId}")
    public ResponseEntity<ApiResponse<ProductResponse>> getAdminProductById(@PathVariable Long productId) {
        ProductResponse response = productService.getAdminProductById(productId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/products/{productId}")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable Long productId) {
        productService.deleteProduct(productId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Product deleted successfully"));
    }

    // Category Management
    @PostMapping({"/categories", "/products/categories"})
    public ResponseEntity<ApiResponse<ProductCategoryResponse>> createCategory(@Valid @RequestBody CategoryRequest request) {
        ProductCategoryResponse response = productService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(response));
    }

    @PutMapping({"/categories/{categoryId}", "/products/categories/{categoryId}"})
    public ResponseEntity<ApiResponse<ProductCategoryResponse>> updateCategory(
            @PathVariable Long categoryId,
            @Valid @RequestBody CategoryRequest request
    ) {
        ProductCategoryResponse response = productService.updateCategory(categoryId, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping({"/categories", "/products/categories"})
    public ResponseEntity<ApiResponse<List<ProductCategoryResponse>>> getAllCategories() {
        List<ProductCategoryResponse> categories = productService.getAllCategories();
        return ResponseEntity.ok(ApiResponse.success(categories));
    }
}
