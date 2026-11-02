package com.example.PawConnect.controller;

import com.example.PawConnect.dto.request.payment.ConfirmUpiPaymentRequest;
import com.example.PawConnect.dto.request.payment.CreateOrderRequestDTO;
import com.example.PawConnect.dto.request.payment.VerifyPaymentRequest;
import com.example.PawConnect.dto.request.payment.VerifyPaymentRequestDTO;
import com.example.PawConnect.dto.response.PaymentOrderResponseDTO;
import com.example.PawConnect.dto.response.PaymentResponse;
import com.example.PawConnect.response.ApiResponse;
import com.example.PawConnect.service.CurrentUserService;
import com.example.PawConnect.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping({"/api/payment", "/api/payments"})
@Tag(name = "Payments", description = "Production-grade Razorpay checkout, verification, and webhook fulfillment endpoints")
public class PaymentController {

    private final PaymentService paymentService;
    private final CurrentUserService currentUserService;

    public PaymentController(PaymentService paymentService, CurrentUserService currentUserService) {
        this.paymentService = paymentService;
        this.currentUserService = currentUserService;
    }

    // =========================================================================
    // Standard Razorpay Checkout Architecture
    // =========================================================================

    @PostMapping({"/create-order", "/create-payment-order"})
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Create a standard Razorpay checkout order with server-calculated price")
    public ResponseEntity<ApiResponse<PaymentOrderResponseDTO>> createOrder(
            @Valid @RequestBody CreateOrderRequestDTO request
    ) {
        Long authenticatedUserId = currentUserService.getCurrentUserId();
        PaymentOrderResponseDTO response = paymentService.createOrder(request, authenticatedUserId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "Razorpay payment order created successfully"));
    }

    @PostMapping({"/verify"})
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Verify standard Razorpay payment signature and execute idempotent order fulfillment")
    public ResponseEntity<ApiResponse<PaymentOrderResponseDTO>> verifyPayment(
            @Valid @RequestBody VerifyPaymentRequestDTO request
    ) {
        PaymentOrderResponseDTO response = paymentService.verifyPaymentSignature(request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Payment verified and order fulfilled successfully"));
    }

    @PostMapping({"/webhook"})
    @Operation(summary = "Receive and idempotently process server-to-server webhook notifications from Razorpay")
    public ResponseEntity<ApiResponse<Void>> handleWebhook(
            @RequestBody String rawPayload,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature
    ) {
        log.info("Received Razorpay webhook payload at /api/payment/webhook");
        paymentService.handleWebhook(rawPayload, signature);
        return ResponseEntity.ok(ApiResponse.ok(null, "Webhook processed successfully"));
    }

    @GetMapping({"/status/{razorpayOrderId}", "/order/{razorpayOrderId}/status"})
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Retrieve current payment order status for polling and disconnected checkout reconciliation")
    public ResponseEntity<ApiResponse<PaymentOrderResponseDTO>> getPaymentStatus(
            @PathVariable String razorpayOrderId
    ) {
        PaymentOrderResponseDTO response = paymentService.getPaymentOrderStatus(razorpayOrderId);
        return ResponseEntity.ok(ApiResponse.ok(response, "Payment status retrieved successfully"));
    }

    @PostMapping({"/refund/{razorpayOrderId}"})
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Initiate an automated refund for a paid Razorpay order")
    public ResponseEntity<ApiResponse<PaymentOrderResponseDTO>> refundPayment(
            @PathVariable String razorpayOrderId,
            @RequestParam(required = false, defaultValue = "Customer request or administrative cancellation") String reason
    ) {
        PaymentOrderResponseDTO response = paymentService.refundPayment(razorpayOrderId, reason);
        return ResponseEntity.ok(ApiResponse.ok(response, "Payment refunded successfully"));
    }

    @PostMapping({"/cancel-abandoned/{razorpayOrderId}"})
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Cancel an abandoned or dismissed payment order and release reserved stock")
    public ResponseEntity<ApiResponse<Void>> cancelAbandonedPayment(
            @PathVariable String razorpayOrderId
    ) {
        Long userId = currentUserService.getCurrentUserId();
        paymentService.cancelAbandonedPayment(razorpayOrderId, userId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Abandoned payment order cancelled successfully"));
    }

    @PostMapping({"/record-failure"})
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Record payment attempt failure or dismissal without prematurely cancelling active 15-minute order window")
    public ResponseEntity<ApiResponse<PaymentOrderResponseDTO>> recordPaymentFailure(
            @Valid @RequestBody com.example.PawConnect.dto.request.payment.RecordFailureRequestDTO request
    ) {
        Long userId = currentUserService.getCurrentUserId();
        PaymentOrderResponseDTO response = paymentService.recordPaymentFailure(request, userId);
        return ResponseEntity.ok(ApiResponse.ok(response, "Payment failure recorded successfully"));
    }

    // =========================================================================
    // Backward-Compatible Endpoints
    // =========================================================================

    @PostMapping("/razorpay/verify")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Legacy verification endpoint for existing checkout callbacks")
    public ResponseEntity<ApiResponse<PaymentResponse>> verifyRazorpayPayment(
            @Valid @RequestBody VerifyPaymentRequest request
    ) {
        PaymentResponse response = paymentService.verifyCheckoutPayment(request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Payment verified successfully"));
    }

    @PostMapping("/upi/confirm")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Confirm UPI and Google Pay QR scanner payment and update status")
    public ResponseEntity<ApiResponse<PaymentResponse>> confirmUpiPayment(
            @Valid @RequestBody ConfirmUpiPaymentRequest request
    ) {
        PaymentResponse response = paymentService.confirmUpiPayment(request);
        return ResponseEntity.ok(ApiResponse.ok(response, "UPI Payment confirmed successfully"));
    }

    @GetMapping("/{paymentId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Retrieve payment record details by ID")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentById(
            @PathVariable Long paymentId
    ) {
        PaymentResponse response = paymentService.getPaymentById(paymentId);
        return ResponseEntity.ok(ApiResponse.ok(response, "Payment retrieved successfully"));
    }
}
