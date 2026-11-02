package com.example.PawConnect.dto.request.commerce;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckoutRequest {

    @NotNull(message = "Delivery address ID is required")
    private Long addressId;

    private String notes;

    private Long cartId;

    private String promoCode;

    private BigDecimal shippingFee;

    private BigDecimal deliveryFee;

    @jakarta.validation.Valid
    private java.util.List<CheckoutItemRequest> items;
}
