package com.example.PawConnect.controller;

import com.example.PawConnect.dto.request.admin.BatchShippingLabelRequest;
import com.example.PawConnect.dto.request.admin.OrderStatusRequest;
import com.example.PawConnect.dto.response.OrderResponse;
import com.example.PawConnect.dto.response.ShippingLabelResponse;
import com.example.PawConnect.model.OrderStatus;
import com.example.PawConnect.model.PaymentStatus;
import com.example.PawConnect.response.ApiResponse;
import com.example.PawConnect.response.PageResponse;
import com.example.PawConnect.service.CurrentUserService;
import com.example.PawConnect.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/orders")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminOrderController {

    private final OrderService orderService;
    private final CurrentUserService currentUserService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<OrderResponse>>> getAllOrders(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) PaymentStatus paymentStatus,
            @RequestParam(required = false) Long userId,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        PageResponse<OrderResponse> orders = orderService.getAllOrders(status, paymentStatus, userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<ApiResponse<OrderResponse>> getAdminOrderDetails(@PathVariable Long orderId) {
        OrderResponse order = orderService.getAdminOrderDetails(orderId);
        return ResponseEntity.ok(ApiResponse.success(order));
    }

    @GetMapping("/{orderId}/shipping-label")
    public ResponseEntity<ApiResponse<ShippingLabelResponse>> getShippingLabel(@PathVariable Long orderId) {
        ShippingLabelResponse label = orderService.getShippingLabel(orderId);
        return ResponseEntity.ok(ApiResponse.success(label));
    }

    @PostMapping("/shipping-labels/batch")
    public ResponseEntity<ApiResponse<List<ShippingLabelResponse>>> getBulkShippingLabels(
            @Valid @RequestBody BatchShippingLabelRequest request
    ) {
        List<ShippingLabelResponse> labels = orderService.getBulkShippingLabels(request.getOrderIds());
        return ResponseEntity.ok(ApiResponse.success(labels));
    }

    @PatchMapping("/{orderId}/status")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderStatus(
            @PathVariable Long orderId,
            @Valid @RequestBody OrderStatusRequest request
    ) {
        Long adminUserId = currentUserService.getCurrentUserId();
        OrderResponse order = orderService.updateOrderStatus(orderId, request, adminUserId);
        return ResponseEntity.ok(ApiResponse.success(order));
    }

    @PatchMapping("/batch/status")
    public ResponseEntity<ApiResponse<com.example.PawConnect.dto.response.BatchOrderStatusResponse>> batchUpdateOrderStatus(
            @Valid @RequestBody com.example.PawConnect.dto.request.admin.BatchOrderStatusRequest request
    ) {
        Long adminUserId = currentUserService.getCurrentUserId();
        com.example.PawConnect.dto.response.BatchOrderStatusResponse response = orderService.batchUpdateOrderStatus(request, adminUserId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
