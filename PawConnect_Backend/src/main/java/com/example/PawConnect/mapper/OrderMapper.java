package com.example.PawConnect.mapper;

import com.example.PawConnect.dto.response.OrderItemResponse;
import com.example.PawConnect.dto.response.OrderResponse;
import com.example.PawConnect.dto.response.OrderStatusHistoryResponse;
import com.example.PawConnect.model.Order;
import com.example.PawConnect.model.OrderItem;
import com.example.PawConnect.model.OrderStatusHistory;
import com.example.PawConnect.model.User;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
public class OrderMapper {

    public OrderItemResponse toItemResponse(OrderItem item) {
        if (item == null) {
            return null;
        }

        Long productId = item.getProduct() != null ? item.getProduct().getId() : null;
        String productName = item.getProductName() != null
                ? item.getProductName()
                : (item.getProduct() != null ? item.getProduct().getName() : "Product");
        String productSku = item.getProductSku() != null
                ? item.getProductSku()
                : (item.getProduct() != null ? item.getProduct().getSku() : null);

        String productImageUrl = item.getProductImageUrl();
        if (productImageUrl == null && item.getProduct() != null) {
            try {
                if (item.getProduct().getImages() != null && !item.getProduct().getImages().isEmpty()) {
                    productImageUrl = item.getProduct().getImages().stream()
                            .filter(img -> Boolean.TRUE.equals(img.getIsPrimary()))
                            .map(com.example.PawConnect.model.ProductImage::getImageUrl)
                            .findFirst()
                            .orElseGet(() -> item.getProduct().getImages().get(0).getImageUrl());
                }
            } catch (Exception ignored) {
                // Ignore lazy initialization exceptions gracefully if entity is detached
            }
        }

        return OrderItemResponse.builder()
                .id(item.getId())
                .productId(productId)
                .productName(productName)
                .productSku(productSku)
                .productImageUrl(productImageUrl)
                .imageUrl(productImageUrl)
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .lineTotal(item.getLineTotal())
                .build();
    }

    public OrderStatusHistoryResponse toStatusHistoryResponse(OrderStatusHistory history) {
        if (history == null) {
            return null;
        }

        String changedByName = "System";
        if (history.getChangedBy() != null) {
            User user = history.getChangedBy();
            changedByName = (user.getFirstName() + " " + (user.getLastName() != null ? user.getLastName() : "")).trim();
        }

        return OrderStatusHistoryResponse.builder()
                .id(history.getId())
                .status(history.getStatus())
                .changedByName(changedByName)
                .remarks(history.getRemarks())
                .changedAt(history.getChangedAt())
                .build();
    }

    public OrderResponse toResponse(Order order) {
        if (order == null) {
            return null;
        }

        Long userId = null;
        String customerName = order.getDeliveryRecipientName();
        String customerEmail = null;
        String customerPhone = order.getDeliveryPhone();
        if (order.getUser() != null) {
            userId = order.getUser().getId();
            try {
                String first = order.getUser().getFirstName() != null ? order.getUser().getFirstName() : "";
                String last = order.getUser().getLastName() != null ? order.getUser().getLastName() : "";
                String full = (first + " " + last).trim();
                if (!full.isBlank()) {
                    customerName = full;
                }
                customerEmail = order.getUser().getEmail();
                if (order.getUser().getPhone() != null && !order.getUser().getPhone().isBlank()) {
                    customerPhone = order.getUser().getPhone();
                }
            } catch (Exception ignored) {
                // Graceful fallback to snapshot fields on order
            }
        }

        Long addressId = order.getAddress() != null ? order.getAddress().getId() : null;

        List<OrderItemResponse> itemResponses = Collections.emptyList();
        try {
            if (order.getOrderItems() != null) {
                itemResponses = order.getOrderItems().stream().map(this::toItemResponse).toList();
            }
        } catch (Exception ignored) {
            itemResponses = Collections.emptyList();
        }

        List<OrderStatusHistoryResponse> historyResponses = Collections.emptyList();
        try {
            if (order.getStatusHistories() != null) {
                historyResponses = order.getStatusHistories().stream().map(this::toStatusHistoryResponse).toList();
            }
        } catch (Exception ignored) {
            historyResponses = Collections.emptyList();
        }

        int totalItemCount = itemResponses.size();
        int totalQuantity = itemResponses.stream().mapToInt(it -> it.getQuantity() != null ? it.getQuantity() : 0).sum();

        java.time.Instant expiresAt = order.getPaymentExpiresAt();
        Long remainingSeconds = null;
        boolean canRetry = false;
        if (expiresAt != null) {
            remainingSeconds = Math.max(0L, java.time.Duration.between(java.time.Instant.now(), expiresAt).getSeconds());
            canRetry = (order.getPaymentStatus() == com.example.PawConnect.model.PaymentStatus.PENDING
                    || order.getPaymentStatus() == com.example.PawConnect.model.PaymentStatus.FAILED
                    || order.getPaymentStatus() == com.example.PawConnect.model.PaymentStatus.CREATED)
                    && order.getOrderStatus() == com.example.PawConnect.model.OrderStatus.PENDING
                    && java.time.Instant.now().isBefore(expiresAt);
        }

        return OrderResponse.builder()
                .id(order.getId())
                .orderNo(order.getOrderNo())
                .userId(userId)
                .customerName(customerName)
                .customerEmail(customerEmail)
                .customerPhone(customerPhone)
                .addressId(addressId)
                // Delivery address snapshot
                .deliveryRecipientName(order.getDeliveryRecipientName())
                .deliveryPhone(order.getDeliveryPhone())
                .deliveryAddressLine1(order.getDeliveryAddressLine1())
                .deliveryAddressLine2(order.getDeliveryAddressLine2())
                .deliveryCity(order.getDeliveryCity())
                .deliveryState(order.getDeliveryState())
                .deliveryPostalCode(order.getDeliveryPostalCode())
                .deliveryCountry(order.getDeliveryCountry())
                .deliveryLatitude(order.getDeliveryLatitude())
                .deliveryLongitude(order.getDeliveryLongitude())
                // Resolved aliases
                .recipientName(order.getDeliveryRecipientName())
                .phone(order.getDeliveryPhone())
                .addressLine1(order.getDeliveryAddressLine1())
                .addressLine2(order.getDeliveryAddressLine2())
                .city(order.getDeliveryCity())
                .state(order.getDeliveryState())
                .postalCode(order.getDeliveryPostalCode())
                .country(order.getDeliveryCountry())
                .latitude(order.getDeliveryLatitude())
                .longitude(order.getDeliveryLongitude())
                // Logistics & Dispatch
                .courierPartner(order.getCourierPartner())
                .trackingNumber(order.getTrackingNumber())
                .awbNumber(order.getTrackingNumber())
                .trackingUrl(order.getTrackingUrl())
                .shippingLabelNumber(order.getShippingLabelNumber())
                .invoiceNumber(order.getInvoiceNumber())
                .packageWeightKg(order.getPackageWeightKg())
                .packageDimensions(order.getPackageDimensions())
                .packedAt(order.getPackedAt())
                .shippedAt(order.getShippedAt())
                .estimatedDeliveryDate(order.getEstimatedDeliveryDate())
                .deliveredAt(order.getDeliveredAt())
                .dispatchNotes(order.getDispatchNotes())
                .subtotal(order.getSubtotal())
                .shippingFee(order.getShippingFee())
                .taxAmount(order.getTaxAmount())
                .discountAmount(order.getDiscountAmount())
                .promoCode(order.getPromoCode())
                .totalAmount(order.getTotalAmount())
                .paymentStatus(order.getPaymentStatus())
                .orderStatus(order.getOrderStatus())
                .placedAt(order.getPlacedAt())
                .paymentExpiresAt(expiresAt)
                .remainingPaymentSeconds(remainingSeconds)
                .canRetryPayment(canRetry)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .totalItemCount(totalItemCount)
                .totalQuantity(totalQuantity)
                .items(itemResponses)
                .statusHistories(historyResponses)
                .build();
    }
}
