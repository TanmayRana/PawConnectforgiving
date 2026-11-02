package com.example.PawConnect.dto.request.payment;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConfirmUpiPaymentRequest {

    @NotBlank(message = "Gateway order ID is required")
    private String gatewayOrderId;

    private String paymentReference;

    private String upiId; // e.g. "user@okhdfcbank" or "success@razorpay"

    private String upiApp; // e.g. "GOOGLE_PAY", "PHONEPE", "PAYTM", "BHIM", "QR_SCANNER"

    private String transactionId; // Optional UPI UTR / Ref ID
}
