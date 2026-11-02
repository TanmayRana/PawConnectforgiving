package com.example.PawConnect.controller;

import com.example.PawConnect.dto.request.commerce.CheckoutRequest;
import com.example.PawConnect.dto.request.payment.CreatePaymentOrderRequest;
import com.example.PawConnect.dto.response.OrderItemResponse;
import com.example.PawConnect.dto.response.OrderResponse;
import com.example.PawConnect.dto.response.PaymentResponse;
import com.example.PawConnect.dto.response.RazorpayOrderResponse;
import com.example.PawConnect.response.ApiResponse;
import com.example.PawConnect.response.PageResponse;
import com.example.PawConnect.service.CurrentUserService;
import com.example.PawConnect.service.OrderService;
import com.example.PawConnect.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class OrderController {

    private final OrderService orderService;
    private final PaymentService paymentService;
    private final CurrentUserService currentUserService;

    public OrderController(OrderService orderService, PaymentService paymentService, CurrentUserService currentUserService) {
        this.orderService = orderService;
        this.paymentService = paymentService;
        this.currentUserService = currentUserService;
    }

    @PostMapping({"/api/me/orders", "/api/orders/checkout"})
    public ResponseEntity<ApiResponse<OrderResponse>> checkout(@Valid @RequestBody CheckoutRequest request) {
        Long userId = currentUserService.getCurrentUserId();
        OrderResponse order = orderService.checkout(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(order));
    }

    @GetMapping("/api/me/orders")
    public ResponseEntity<ApiResponse<PageResponse<OrderResponse>>> getMyOrders(
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Long userId = currentUserService.getCurrentUserId();
        PageResponse<OrderResponse> orders = orderService.getUserOrders(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @GetMapping({"/api/me/orders/{orderId}", "/api/orders/{orderId}"})
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderDetails(@PathVariable Long orderId) {
        Long userId = currentUserService.getCurrentUserId();
        OrderResponse order = orderService.getOrderDetails(userId, orderId);
        return ResponseEntity.ok(ApiResponse.success(order));
    }

    @GetMapping("/api/me/orders/{orderId}/items")
    public ResponseEntity<ApiResponse<List<OrderItemResponse>>> getOrderItems(@PathVariable Long orderId) {
        Long userId = currentUserService.getCurrentUserId();
        List<OrderItemResponse> items = orderService.getOrderItems(userId, orderId);
        return ResponseEntity.ok(ApiResponse.success(items));
    }

    @RequestMapping(
            value = {"/api/me/orders/{orderId}/cancel", "/api/orders/{orderId}/cancel"},
            method = {RequestMethod.PATCH, RequestMethod.POST}
    )
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrder(
            @PathVariable Long orderId,
            @RequestBody(required = false) Map<String, String> body
    ) {
        Long userId = currentUserService.getCurrentUserId();
        String reason = body != null ? body.get("reason") : null;
        OrderResponse order = orderService.cancelOrder(userId, orderId, reason);
        return ResponseEntity.ok(ApiResponse.success(order));
    }

    // Razorpay payment integration for customer merchandise orders
    @PostMapping("/api/me/orders/{orderId}/payments/order")
    public ResponseEntity<ApiResponse<RazorpayOrderResponse>> createOrderPayment(
            @PathVariable Long orderId,
            @RequestBody(required = false) CreatePaymentOrderRequest request
    ) {
        RazorpayOrderResponse paymentOrder = paymentService.createOrderPaymentOrder(orderId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(paymentOrder));
    }

    @GetMapping("/api/me/orders/{orderId}/payment")
    public ResponseEntity<ApiResponse<PaymentResponse>> getOrderPayment(@PathVariable Long orderId) {
        PaymentResponse payment = paymentService.getOrderPayment(orderId);
        return ResponseEntity.ok(ApiResponse.success(payment));
    }
}
