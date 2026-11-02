package com.example.PawConnect.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentOrderResponseDTO {

    private String orderId;
    private String razorpayOrderId;
    private Long amountInPaise;
    private String currency;
    private String keyId;
    private Long paymentOrderId;
    private Long productId;
    private Long orderIdReference;
    private Long bookingId;
    private String status;
    private boolean signatureVerified;
    private String razorpayPaymentId;
    private java.time.Instant paymentExpiresAt;
    private Long remainingPaymentSeconds;
    private Boolean canRetryPayment;
    private LocalDateTime createdAt;
}
