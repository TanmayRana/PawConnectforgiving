package com.example.PawConnect.dto.response;

import com.example.PawConnect.model.PaymentFor;
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
public class PaymentResponse {

    private Long id;
    private String paymentReference;
    private PaymentFor paymentFor;
    private Long referenceId;
    private BigDecimal amount;
    private String currency;
    private PaymentStatus status;
    private String gatewayProvider;
    private String gatewayOrderId;
    private String gatewayPaymentId;
    private String gatewayStatus;
    private String failureReason;
    private LocalDateTime paidAt;
    private LocalDateTime capturedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
