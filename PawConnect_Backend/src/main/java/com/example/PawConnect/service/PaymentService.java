package com.example.PawConnect.service;

import com.example.PawConnect.dto.request.payment.ConfirmUpiPaymentRequest;
import com.example.PawConnect.dto.request.payment.CreateOrderRequestDTO;
import com.example.PawConnect.dto.request.payment.CreatePaymentOrderRequest;
import com.example.PawConnect.dto.request.payment.VerifyPaymentRequest;
import com.example.PawConnect.dto.request.payment.VerifyPaymentRequestDTO;
import com.example.PawConnect.dto.response.PaymentOrderResponseDTO;
import com.example.PawConnect.dto.response.PaymentResponse;
import com.example.PawConnect.dto.response.RazorpayOrderResponse;
import com.example.PawConnect.model.PaymentOrder;

public interface PaymentService {

    // ─── Standard Razorpay Checkout Architecture ──────────────────────────────
    PaymentOrderResponseDTO createOrder(CreateOrderRequestDTO request, Long authenticatedUserId);

    PaymentOrderResponseDTO verifyPaymentSignature(VerifyPaymentRequestDTO request);

    void handleWebhook(String rawBody, String signatureHeader);

    PaymentOrder fulfillOrderIdempotently(String razorpayOrderId, String razorpayPaymentId);

    PaymentOrderResponseDTO refundPayment(String razorpayOrderId, String reason);

    PaymentOrderResponseDTO getPaymentOrderStatus(String razorpayOrderId);

    PaymentOrderResponseDTO getPaymentStatus(String razorpayOrderId);

    void cancelAbandonedPayment(String razorpayOrderId, Long authenticatedUserId);

    PaymentOrderResponseDTO recordPaymentFailure(com.example.PawConnect.dto.request.payment.RecordFailureRequestDTO request, Long authenticatedUserId);

    // ─── Legacy / Compatibility Operations ───────────────────────────────────
    RazorpayOrderResponse createAppointmentPaymentOrder(Long appointmentId, CreatePaymentOrderRequest request);

    RazorpayOrderResponse createServiceBookingPaymentOrder(Long bookingId, CreatePaymentOrderRequest request);

    RazorpayOrderResponse createUnifiedBookingPaymentOrder(Long bookingId, CreatePaymentOrderRequest request);

    PaymentResponse verifyCheckoutPayment(VerifyPaymentRequest request);

    PaymentResponse confirmUpiPayment(ConfirmUpiPaymentRequest request);

    PaymentResponse getBookingPayment(Long bookingId, String bookingType);

    PaymentResponse getAppointmentPayment(Long appointmentId);

    PaymentResponse getServiceBookingPayment(Long bookingId);

    RazorpayOrderResponse createOrderPaymentOrder(Long orderId, CreatePaymentOrderRequest request);

    PaymentResponse getOrderPayment(Long orderId);

    PaymentResponse getPaymentById(Long paymentId);

    void processWebhook(String rawPayload, String signatureHeader);
}
