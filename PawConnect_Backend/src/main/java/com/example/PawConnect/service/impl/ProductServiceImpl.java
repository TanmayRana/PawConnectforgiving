package com.example.PawConnect.service.impl;

import com.example.PawConnect.dto.request.admin.CategoryRequest;
import com.example.PawConnect.dto.request.admin.ProductRequest;
import com.example.PawConnect.dto.request.admin.UpdateProductStatusRequest;
import com.example.PawConnect.dto.request.admin.UpdateStockRequest;
import com.example.PawConnect.dto.response.ProductCategoryResponse;
import com.example.PawConnect.dto.response.ProductResponse;
import com.example.PawConnect.exception.DuplicateResourceException;
import com.example.PawConnect.exception.ResourceNotFoundException;
import com.example.PawConnect.mapper.ProductMapper;
import com.example.PawConnect.model.Product;
import com.example.PawConnect.model.ProductCategory;
import com.example.PawConnect.model.ProductImage;
import com.example.PawConnect.model.ProductStatus;
import com.example.PawConnect.model.OrderItem;
import com.example.PawConnect.model.User;
import com.example.PawConnect.repository.CartItemRepository;
import com.example.PawConnect.repository.OrderItemRepository;
import com.example.PawConnect.repository.ProductCategoryRepository;
import com.example.PawConnect.repository.ProductImageRepository;
import com.example.PawConnect.repository.ProductRepository;
import com.example.PawConnect.repository.UserRepository;
import com.example.PawConnect.response.PageResponse;
import com.example.PawConnect.service.ProductService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final ProductCategoryRepository productCategoryRepository;
    private final ProductImageRepository productImageRepository;
    private final CartItemRepository cartItemRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final ProductMapper productMapper;
    private final com.example.PawConnect.service.AuditLogService auditLogService;

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "id", "name", "price", "createdAt", "stockQuantity"
    );
    private static final int MAX_PAGE_SIZE = 100;

    private Pageable sanitizePageable(Pageable pageable) {
        int page = Math.max(0, pageable.getPageNumber());
        int size = Math.min(MAX_PAGE_SIZE, Math.max(1, pageable.getPageSize()));

        List<Sort.Order> validOrders = new ArrayList<>();
        for (Sort.Order order : pageable.getSort()) {
            if (!ALLOWED_SORT_FIELDS.contains(order.getProperty())) {
                throw new IllegalArgumentException(String.format(
                        "Invalid sort field '%s'. Allowed sort fields are: %s",
                        order.getProperty(), ALLOWED_SORT_FIELDS
                ));
            }
            validOrders.add(order);
        }

        Sort sort = validOrders.isEmpty()
                ? Sort.by(Sort.Direction.DESC, "createdAt")
                : Sort.by(validOrders);

        return PageRequest.of(page, size, sort);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> getPublicProducts(
            String search,
            Long categoryId,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Boolean inStock,
            Boolean featured,
            Pageable pageable
    ) {
        Pageable sanitizedPageable = sanitizePageable(pageable);

        Specification<Product> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Rule 1: Public listings must ONLY include active, eligible products
            predicates.add(cb.isTrue(root.get("isActive")));
            predicates.add(cb.equal(root.get("status"), ProductStatus.ACTIVE));

            if (search != null && !search.trim().isEmpty()) {
                String searchPattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), searchPattern),
                        cb.like(cb.lower(root.get("description")), searchPattern),
                        cb.like(cb.lower(root.get("sku")), searchPattern)
                ));
            }

            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            }

            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("price"), minPrice));
            }

            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), maxPrice));
            }

            if (Boolean.TRUE.equals(inStock)) {
                predicates.add(cb.greaterThan(root.get("stockQuantity"), 0));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Product> productPage = productRepository.findAll(spec, sanitizedPageable);
        return PageResponse.from(productPage.map(productMapper::toResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getPublicProductById(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        if (!Boolean.TRUE.equals(product.getIsActive()) || product.getStatus() != ProductStatus.ACTIVE) {
            throw new ResourceNotFoundException("Product is not active or available for purchase");
        }

        return productMapper.toResponse(product);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductCategoryResponse> getPublicCategories() {
        return productCategoryRepository.findByIsActiveTrue().stream()
                .map(productMapper::toCategoryResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> getFeaturedProducts(int limit) {
        int effectiveLimit = Math.min(20, Math.max(1, limit));
        Pageable pageable = PageRequest.of(0, effectiveLimit, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Product> page = productRepository.findByIsActiveTrue(pageable);

        return page.getContent().stream()
                .filter(p -> p.getStatus() == ProductStatus.ACTIVE)
                .map(productMapper::toResponse)
                .toList();
    }

    // =========================================================================
    // Admin Management Methods
    // =========================================================================

    @Override
    @Transactional
    public ProductResponse createProduct(ProductRequest request, Long adminUserId) {
        ProductCategory category = resolveCategory(request.getCategoryId());

        if (productRepository.findBySku(request.getSku()).isPresent()) {
            throw new DuplicateResourceException("Product with SKU already exists: " + request.getSku());
        }

        User adminUser = null;
        if (adminUserId != null) {
            adminUser = userRepository.findById(adminUserId).orElse(null);
        }

        Product product = Product.builder()
                .category(category)
                .name(request.getName().trim())
                .sku(request.getSku().trim())
                .description(request.getDescription())
                .price(request.getPrice())
                .stockQuantity(request.getStockQuantity())
                .weight(request.getWeight())
                .status(request.getStatus() != null ? request.getStatus() : ProductStatus.ACTIVE)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .createdBy(adminUser)
                .images(new ArrayList<>())
                .build();

        syncProductImages(product, request.getEffectiveImages());
        Product saved = productRepository.save(product);
        log.info("Created in-house product id {} by admin {}", saved.getId(), adminUserId);

        auditLogService.logAction(
                "PRODUCT_CREATED",
                "CATALOGUE",
                "PRODUCT",
                saved.getId(),
                null,
                "{\"name\":\"" + saved.getName() + "\",\"sku\":\"" + saved.getSku() + "\",\"price\":" + saved.getPrice() + "}"
        );

        return productMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public ProductResponse updateProduct(Long productId, ProductRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        if (!product.getSku().equals(request.getSku()) && productRepository.findBySku(request.getSku()).isPresent()) {
            throw new DuplicateResourceException("Product with SKU already exists: " + request.getSku());
        }

        ProductCategory category = request.getCategoryId() != null
                ? resolveCategory(request.getCategoryId())
                : (product.getCategory() != null ? product.getCategory() : resolveCategory(null));

        String oldSnapshot = "{\"name\":\"" + product.getName() + "\",\"price\":" + product.getPrice() + ",\"stock\":" + product.getStockQuantity() + "}";

        product.setCategory(category);
        product.setName(request.getName().trim());
        product.setSku(request.getSku().trim());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setStockQuantity(request.getStockQuantity());
        product.setWeight(request.getWeight());
        if (request.getStatus() != null) {
            product.setStatus(request.getStatus());
        }
        if (request.getIsActive() != null) {
            product.setIsActive(request.getIsActive());
        }

        if (request.getEffectiveImages() != null) {
            syncProductImages(product, request.getEffectiveImages());
        }

        Product updated = productRepository.save(product);
        log.info("Updated product id {}", updated.getId());

        String newSnapshot = "{\"name\":\"" + updated.getName() + "\",\"price\":" + updated.getPrice() + ",\"stock\":" + updated.getStockQuantity() + "}";
        auditLogService.logAction(
                "PRODUCT_UPDATED",
                "CATALOGUE",
                "PRODUCT",
                updated.getId(),
                oldSnapshot,
                newSnapshot
        );

        return productMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public ProductResponse updateProductStatus(Long productId, UpdateProductStatusRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        ProductStatus oldStatus = product.getStatus();
        Boolean oldActive = product.getIsActive();

        product.setStatus(request.getStatus());
        if (request.getIsActive() != null) {
            product.setIsActive(request.getIsActive());
        } else {
            product.setIsActive(request.getStatus() == ProductStatus.ACTIVE);
        }

        Product saved = productRepository.save(product);
        log.info("Updated product {} status to {}, isActive: {}", productId, saved.getStatus(), saved.getIsActive());

        auditLogService.logAction(
                "PRODUCT_STATUS_UPDATED",
                "CATALOGUE",
                "PRODUCT",
                productId,
                "{\"status\":\"" + oldStatus + "\",\"isActive\":" + oldActive + "}",
                "{\"status\":\"" + saved.getStatus() + "\",\"isActive\":" + saved.getIsActive() + "}"
        );

        return productMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public ProductResponse updateProductStock(Long productId, UpdateStockRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        Integer oldStock = product.getStockQuantity();
        product.setStockQuantity(request.getStockQuantity());
        Product saved = productRepository.save(product);
        log.info("Updated product {} stock to {}", productId, saved.getStockQuantity());

        auditLogService.logAction(
                "PRODUCT_STOCK_UPDATED",
                "CATALOGUE",
                "PRODUCT",
                productId,
                "{\"stock\":" + oldStock + "}",
                "{\"stock\":" + saved.getStockQuantity() + "}"
        );

        return productMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> getAdminProducts(
            String search,
            Long categoryId,
            ProductStatus status,
            Boolean isActive,
            Pageable pageable
    ) {
        Pageable sanitizedPageable = sanitizePageable(pageable);

        Specification<Product> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.trim().isEmpty()) {
                String searchPattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), searchPattern),
                        cb.like(cb.lower(root.get("description")), searchPattern),
                        cb.like(cb.lower(root.get("sku")), searchPattern)
                ));
            }

            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (isActive != null) {
                predicates.add(cb.equal(root.get("isActive"), isActive));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Product> page = productRepository.findAll(spec, sanitizedPageable);
        return PageResponse.from(page.map(productMapper::toResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getAdminProductById(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));
        return productMapper.toResponse(product);
    }

    @Override
    @Transactional
    public void deleteProduct(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        // 1. Unlink historical order items so past orders retain snapshot data
        List<OrderItem> orderItems = orderItemRepository.findByProductId(productId);
        if (!orderItems.isEmpty()) {
            for (OrderItem item : orderItems) {
                item.setProduct(null);
            }
            orderItemRepository.saveAll(orderItems);
        }

        // 2. Remove active cart items containing this product
        cartItemRepository.deleteByProductId(productId);

        // 3. Delete product and cascade images
        String productName = product.getName();
        productRepository.delete(product);
        log.info("Permanently deleted product id {} ({}) from database", productId, productName);

        // 4. Log audit action
        auditLogService.logAction(
                "PRODUCT_DELETED",
                "CATALOGUE",
                "PRODUCT",
                productId,
                "{\"name\":\"" + productName + "\"}",
                null
        );
    }

    @Override
    @Transactional
    public ProductCategoryResponse createCategory(CategoryRequest request) {
        if (productCategoryRepository.findByName(request.getName().trim()).isPresent()) {
            throw new DuplicateResourceException("Category already exists with name: " + request.getName());
        }

        ProductCategory category = ProductCategory.builder()
                .name(request.getName().trim())
                .description(request.getDescription())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        ProductCategory saved = productCategoryRepository.save(category);
        log.info("Created category id {}", saved.getId());
        return productMapper.toCategoryResponse(saved);
    }

    @Override
    @Transactional
    public ProductCategoryResponse updateCategory(Long categoryId, CategoryRequest request) {
        ProductCategory category = productCategoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + categoryId));

        if (!category.getName().equalsIgnoreCase(request.getName().trim())
                && productCategoryRepository.findByName(request.getName().trim()).isPresent()) {
            throw new DuplicateResourceException("Category already exists with name: " + request.getName());
        }

        category.setName(request.getName().trim());
        category.setDescription(request.getDescription());
        if (request.getIsActive() != null) {
            category.setIsActive(request.getIsActive());
        }

        ProductCategory saved = productCategoryRepository.save(category);
        log.info("Updated category id {}", saved.getId());
        return productMapper.toCategoryResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductCategoryResponse> getAllCategories() {
        return productCategoryRepository.findAllByOrderByNameAsc().stream()
                .map(productMapper::toCategoryResponse)
                .toList();
    }

    private ProductCategory resolveCategory(Long requestedCategoryId) {
        if (requestedCategoryId != null) {
            Optional<ProductCategory> found = productCategoryRepository.findById(requestedCategoryId);
            if (found.isPresent()) {
                return found.get();
            }
            log.warn("Category id {} not found, looking for fallback category", requestedCategoryId);
        }

        List<ProductCategory> activeCategories = productCategoryRepository.findByIsActiveTrue();
        if (!activeCategories.isEmpty()) {
            return activeCategories.get(0);
        }

        List<ProductCategory> allCategories = productCategoryRepository.findAll();
        if (!allCategories.isEmpty()) {
            return allCategories.get(0);
        }

        log.info("No product categories exist in database. Auto-creating default 'Food & Nutrition' category.");
        return productCategoryRepository.save(ProductCategory.builder()
                .name("Food & Nutrition")
                .description("Default pet nutrition and supplies category")
                .isActive(true)
                .build());
    }

    private void syncProductImages(Product product, List<String> incomingImages) {
        if (incomingImages == null) {
            return;
        }

        if (product.getImages() == null) {
            product.setImages(new ArrayList<>());
        } else {
            product.getImages().clear();
        }

        int order = 0;
        for (String url : incomingImages) {
            if (url != null && !url.trim().isEmpty()) {
                product.getImages().add(ProductImage.builder()
                        .product(product)
                        .imageUrl(url.trim())
                        .isPrimary(order == 0)
                        .sortOrder(order)
                        .build());
                order++;
            }
        }
        log.info("Synced {} images for product id {}", product.getImages().size(), product.getId());
    }
}
