package com.example.PawConnect.dto.request.commerce;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApplyPromoRequest {

    @NotBlank(message = "Promo code is required")
    private String code;
}
