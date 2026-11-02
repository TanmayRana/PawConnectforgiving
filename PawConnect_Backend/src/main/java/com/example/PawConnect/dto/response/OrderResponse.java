package com.example.PawConnect.dto.response;

import com.example.PawConnect.model.OrderStatus;
import com.example.PawConnect.model.PaymentStatus;
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
public class OrderResponse {
    private Long id;
    private String orderNo;
    private Long userId;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private Long addressId;

    // Delivery address snapshot
    private String deliveryRecipientName;
    private String deliveryPhone;
    private String deliveryAddressLine1;
    private String deliveryAddressLine2;
    private String deliveryCity;
    private String deliveryState;
    private String deliveryPostalCode;
    private String deliveryCountry;
    private BigDecimal deliveryLatitude;
    private BigDecimal deliveryLongitude;

    // Resolved address aliases for frontend convenience
    private String recipientName;
    private String phone;
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String postalCode;
    private String country;
    private BigDecimal latitude;
    private BigDecimal longitude;

    // Logistics & Dispatch
    private String courierPartner;
    private String trackingNumber;
    private String awbNumber;
    private String trackingUrl;
    private String shippingLabelNumber;
    private String invoiceNumber;
    private BigDecimal packageWeightKg;
    private String packageDimensions;
    private LocalDateTime packedAt;
    private LocalDateTime shippedAt;
    private LocalDate estimatedDeliveryDate;
    private LocalDateTime deliveredAt;
    private String dispatchNotes;

    // Financial calculations
    private BigDecimal subtotal;
    private BigDecimal shippingFee;
    private BigDecimal taxAmount;
    private BigDecimal discountAmount;
    private String promoCode;
    private BigDecimal totalAmount;

    // Statuses
    private PaymentStatus paymentStatus;
    private OrderStatus orderStatus;

    private LocalDateTime placedAt;
    private java.time.Instant paymentExpiresAt;
    private Long remainingPaymentSeconds;
    private Boolean canRetryPayment;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private Integer totalItemCount;
    private Integer totalQuantity;

    private List<OrderItemResponse> items;
    private List<OrderStatusHistoryResponse> statusHistories;
}
