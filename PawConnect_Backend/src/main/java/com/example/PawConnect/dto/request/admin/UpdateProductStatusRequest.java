package com.example.PawConnect.dto.request.admin;

import com.example.PawConnect.model.ProductStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateProductStatusRequest {

    @NotNull(message = "Product status is required")
    private ProductStatus status;

    private Boolean isActive;
}
