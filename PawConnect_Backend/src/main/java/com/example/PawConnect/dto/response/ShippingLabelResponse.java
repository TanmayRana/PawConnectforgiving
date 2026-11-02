package com.example.PawConnect.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShippingLabelResponse {
    private Long orderId;
    private String orderNumber;
    private String invoiceNumber;
    private String shippingLabelNumber;
    private String awbNumber;
    private String courierPartner;
    private String paymentMode;
    private LocalDateTime orderDate;
    private LocalDateTime packedAt;
    private LocalDate estimatedDeliveryDate;

    private BigDecimal packageWeightKg;
    private String packageDimensions;
    private Integer totalItemsCount;
    private BigDecimal declaredValue;

    private String shipFrom;

    // Ship To recipient address details
    private String recipientName;
    private String phone;
    private String fullAddress;
    private String city;
    private String state;
    private String postalCode;
    private String country;

    private List<ShippingLabelItemResponse> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ShippingLabelItemResponse {
        private String sku;
        private String productName;
        private Integer quantity;
        private BigDecimal unitPrice;
    }
}
