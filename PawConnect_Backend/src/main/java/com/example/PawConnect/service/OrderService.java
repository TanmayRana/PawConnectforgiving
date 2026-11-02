package com.example.PawConnect.service;

import com.example.PawConnect.dto.request.admin.OrderStatusRequest;
import com.example.PawConnect.dto.request.commerce.CheckoutRequest;
import com.example.PawConnect.dto.response.OrderItemResponse;
import com.example.PawConnect.dto.response.OrderResponse;
import com.example.PawConnect.model.OrderStatus;
import com.example.PawConnect.model.PaymentStatus;
import com.example.PawConnect.response.PageResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

import com.example.PawConnect.dto.response.ShippingLabelResponse;

public interface OrderService {

    OrderResponse checkout(Long userId, CheckoutRequest request);

    PageResponse<OrderResponse> getUserOrders(Long userId, Pageable pageable);

    OrderResponse getOrderDetails(Long userId, Long orderId);

    List<OrderItemResponse> getOrderItems(Long userId, Long orderId);

    OrderResponse cancelOrder(Long userId, Long orderId, String reason);

    // Admin operations
    PageResponse<OrderResponse> getAllOrders(
            OrderStatus status,
            PaymentStatus paymentStatus,
            Long userId,
            Pageable pageable
    );

    OrderResponse getAdminOrderDetails(Long orderId);

    OrderResponse updateOrderStatus(Long orderId, OrderStatusRequest request, Long adminUserId);

    ShippingLabelResponse getShippingLabel(Long orderId);

    List<ShippingLabelResponse> getBulkShippingLabels(List<Long> orderIds);

    com.example.PawConnect.dto.response.BatchOrderStatusResponse batchUpdateOrderStatus(
            com.example.PawConnect.dto.request.admin.BatchOrderStatusRequest request,
            Long adminUserId
    );

    void expireOverduePendingOrders();

    OrderResponse expireOrder(Long orderId);
}
