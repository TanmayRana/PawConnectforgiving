package com.example.PawConnect.mapper;

import com.example.PawConnect.dto.response.PaymentResponse;
import com.example.PawConnect.model.Payment;
import org.springframework.stereotype.Component;

@Component
public class PaymentMapper {

    public PaymentResponse toResponse(Payment payment) {
        if (payment == null) {
            return null;
        }

        return PaymentResponse.builder()
                .id(payment.getId())
                .paymentReference(payment.getPaymentReference())
                .paymentFor(payment.getPaymentFor())
                .referenceId(payment.getReferenceId())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .status(payment.getStatus())
                .gatewayProvider(payment.getGatewayProvider())
                .gatewayOrderId(payment.getGatewayOrderId())
                .gatewayPaymentId(payment.getGatewayPaymentId())
                .gatewayStatus(payment.getGatewayStatus())
                .failureReason(payment.getFailureReason())
                .paidAt(payment.getPaidAt())
                .capturedAt(payment.getCapturedAt())
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt())
                .build();
    }
}
