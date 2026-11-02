package com.example.PawConnect.dto.response;

import com.example.PawConnect.model.DiscountType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromoValidationResponse {
    private String code;
    private DiscountType discountType;
    private BigDecimal discountValue;
    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal finalTotal;
    private String message;
}
