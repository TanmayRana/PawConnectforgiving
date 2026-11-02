package com.example.PawConnect.dto.response.admin;

import com.example.PawConnect.model.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminPaymentRecordResponse {

    private Long id;
    private String paymentReference;
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private boolean signatureVerified;

    private Long userId;
    private String customerName;
    private String customerEmail;
    private String customerPhone;

    private String paymentFor; // ORDER | APPOINTMENT | SERVICE_BOOKING
    private Long referenceId;
    private String referenceNumber; // e.g. PC-ORD-..., PC-APT-..., PC-BKG-...

    private BigDecimal amount;
    private Long amountInPaise;
    private String currency;
    private String paymentMethod;

    private PaymentStatus status;
    private String failureReason;
    private String refundReason;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime capturedAt;

    public String getGatewayPaymentId() {
        return razorpayPaymentId;
    }

    public String getGatewayOrderId() {
        return razorpayOrderId;
    }
}
