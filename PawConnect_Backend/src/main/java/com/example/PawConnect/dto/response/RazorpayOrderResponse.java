package com.example.PawConnect.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RazorpayOrderResponse {

    private String razorpayOrderId;
    private String orderId;
    private BigDecimal amount;
    private Long amountInPaise;
    private String currency;
    private String keyId; // Razorpay public key ID for frontend checkout
    private String paymentReference;
    private Long bookingId;
    private String bookingType; // VETERINARY or SERVICE
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private String description;
    private String preferredMethod;
}
