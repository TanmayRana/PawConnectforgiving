package com.example.PawConnect.controller;

import com.example.PawConnect.dto.request.payment.CreatePaymentOrderRequest;
import com.example.PawConnect.dto.response.PaymentResponse;
import com.example.PawConnect.dto.response.RazorpayOrderResponse;
import com.example.PawConnect.response.ApiResponse;
import com.example.PawConnect.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@Tag(name = "Customer Booking Payments", description = "Customer self-service payment order creation and status retrieval")
@PreAuthorize("hasRole('PET_OWNER')")
public class CustomerPaymentController {

    private final PaymentService paymentService;

    public CustomerPaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    // ==========================================
    // Unified Booking Payment Endpoints
    // ==========================================

    @PostMapping("/api/me/bookings/{bookingId}/payments/order")
    @Operation(summary = "Create a Razorpay payment order for an eligible confirmed booking")
    public ResponseEntity<ApiResponse<RazorpayOrderResponse>> createUnifiedPaymentOrder(
            @PathVariable Long bookingId,
            @RequestBody(required = false) CreatePaymentOrderRequest request
    ) {
        RazorpayOrderResponse response = paymentService.createUnifiedBookingPaymentOrder(bookingId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Payment order created successfully"));
    }

    @GetMapping("/api/me/bookings/{bookingId}/payment")
    @Operation(summary = "Retrieve payment status for an owned booking")
    public ResponseEntity<ApiResponse<PaymentResponse>> getUnifiedBookingPayment(
            @PathVariable Long bookingId,
            @RequestParam(required = false) String type
    ) {
        PaymentResponse response = paymentService.getBookingPayment(bookingId, type);
        return ResponseEntity.ok(ApiResponse.ok(response, "Payment details retrieved successfully"));
    }

    // ==========================================
    // Dedicated Appointment Payment Endpoints
    // ==========================================

    @PostMapping("/api/me/appointments/{appointmentId}/payments/order")
    @Operation(summary = "Create a Razorpay payment order for a confirmed veterinary appointment")
    public ResponseEntity<ApiResponse<RazorpayOrderResponse>> createAppointmentPaymentOrder(
            @PathVariable Long appointmentId,
            @RequestBody(required = false) CreatePaymentOrderRequest request
    ) {
        RazorpayOrderResponse response = paymentService.createAppointmentPaymentOrder(appointmentId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Appointment payment order created successfully"));
    }

    @GetMapping("/api/me/appointments/{appointmentId}/payment")
    @Operation(summary = "Retrieve payment details for a veterinary appointment")
    public ResponseEntity<ApiResponse<PaymentResponse>> getAppointmentPayment(
            @PathVariable Long appointmentId
    ) {
        PaymentResponse response = paymentService.getAppointmentPayment(appointmentId);
        return ResponseEntity.ok(ApiResponse.ok(response, "Appointment payment details retrieved successfully"));
    }

    // ==========================================
    // Dedicated Service Booking Payment Endpoints
    // ==========================================

    @PostMapping("/api/me/service-bookings/{bookingId}/payments/order")
    @Operation(summary = "Create a Razorpay payment order for a confirmed service booking")
    public ResponseEntity<ApiResponse<RazorpayOrderResponse>> createServiceBookingPaymentOrder(
            @PathVariable Long bookingId,
            @RequestBody(required = false) CreatePaymentOrderRequest request
    ) {
        RazorpayOrderResponse response = paymentService.createServiceBookingPaymentOrder(bookingId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Service booking payment order created successfully"));
    }

    @GetMapping("/api/me/service-bookings/{bookingId}/payment")
    @Operation(summary = "Retrieve payment details for a service booking")
    public ResponseEntity<ApiResponse<PaymentResponse>> getServiceBookingPayment(
            @PathVariable Long bookingId
    ) {
        PaymentResponse response = paymentService.getServiceBookingPayment(bookingId);
        return ResponseEntity.ok(ApiResponse.ok(response, "Service booking payment details retrieved successfully"));
    }
}
