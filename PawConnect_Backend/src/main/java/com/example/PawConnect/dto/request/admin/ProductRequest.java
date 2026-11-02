package com.example.PawConnect.dto.request.admin;

import com.example.PawConnect.model.ProductStatus;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductRequest {

    private Long categoryId;

    @NotBlank(message = "Product name is required")
    @Size(max = 200, message = "Product name cannot exceed 200 characters")
    private String name;

    @NotBlank(message = "SKU is required")
    @Size(max = 100, message = "SKU cannot exceed 100 characters")
    private String sku;

    private String description;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.00", message = "Price cannot be negative")
    private BigDecimal price;

    @NotNull(message = "Stock quantity is required")
    @PositiveOrZero(message = "Stock quantity cannot be negative")
    private Integer stockQuantity;

    @DecimalMin(value = "0.00", message = "Weight cannot be negative")
    private BigDecimal weight;

    @NotNull(message = "Product status is required")
    private ProductStatus status;

    private Boolean isActive;

    private List<String> imageUrls;
    private List<String> images;

    public List<String> getEffectiveImages() {
        if (imageUrls != null && !imageUrls.isEmpty()) {
            return imageUrls;
        }
        if (images != null && !images.isEmpty()) {
            return images;
        }
        return Collections.emptyList();
    }
}
