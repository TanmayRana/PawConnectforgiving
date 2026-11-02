package com.example.PawConnect.controller;

import com.example.PawConnect.dto.response.ProductCategoryResponse;
import com.example.PawConnect.dto.response.ProductResponse;
import com.example.PawConnect.response.ApiResponse;
import com.example.PawConnect.response.PageResponse;
import com.example.PawConnect.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping({"/api/products", "/api/public/products"})
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ProductResponse>>> getProducts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Boolean inStock,
            @RequestParam(required = false) Boolean featured,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        PageResponse<ProductResponse> products = productService.getPublicProducts(
                search, categoryId, minPrice, maxPrice, inStock, featured, pageable
        );
        return ResponseEntity.ok(ApiResponse.success(products));
    }

    @GetMapping("/{productId:[0-9]+}")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductById(@PathVariable Long productId) {
        ProductResponse product = productService.getPublicProductById(productId);
        return ResponseEntity.ok(ApiResponse.success(product));
    }

    @GetMapping({"/categories", "/product-categories"})
    public ResponseEntity<ApiResponse<List<ProductCategoryResponse>>> getCategories() {
        List<ProductCategoryResponse> categories = productService.getPublicCategories();
        return ResponseEntity.ok(ApiResponse.success(categories));
    }

    @GetMapping("/featured")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getFeaturedProducts(
            @RequestParam(defaultValue = "10") int limit
    ) {
        List<ProductResponse> featured = productService.getFeaturedProducts(limit);
        return ResponseEntity.ok(ApiResponse.success(featured));
    }
}
