package com.example.PawConnect.dto.request.admin;

import com.example.PawConnect.model.OrderStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderStatusRequest {

    @NotNull(message = "Order status is required")
    private OrderStatus orderStatus;

    private String remarks;
    private String notes;

    // Logistics & Dispatch fields
    private String courierPartner;
    private String trackingNumber;
    private String trackingUrl;
    private BigDecimal packageWeightKg;
    private String packageDimensions;
    private LocalDate estimatedDeliveryDate;
    private Boolean autoGenerateAwb;
}
