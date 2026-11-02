package com.example.PawConnect.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "payment_orders", indexes = {
    @Index(name = "idx_payment_orders_razorpay_order_id", columnList = "razorpay_order_id", unique = true),
    @Index(name = "idx_payment_orders_razorpay_payment_id", columnList = "razorpay_payment_id"),
    @Index(name = "idx_payment_orders_user_id", columnList = "user_id"),
    @Index(name = "idx_payment_orders_product_id", columnList = "product_id"),
    @Index(name = "idx_payment_orders_order_id", columnList = "order_id"),
    @Index(name = "idx_payment_orders_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
@EntityListeners(AuditingEntityListener.class)
public class PaymentOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "razorpay_order_id", length = 100, unique = true, nullable = false)
    private String razorpayOrderId;

    @Column(name = "razorpay_payment_id", length = 100)
    private String razorpayPaymentId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "product_id")
    private Long productId;

    @Column(name = "order_id")
    private Long orderId;

    @Column(name = "booking_id")
    private Long bookingId;

    @Column(name = "booking_type", length = 50)
    private String bookingType;

    @Column(name = "amount_in_paise", nullable = false)
    private Long amountInPaise;

    @Builder.Default
    @Column(name = "currency", length = 10, nullable = false)
    private String currency = "INR";

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    private PaymentStatus status;

    @Builder.Default
    @Column(name = "signature_verified", nullable = false)
    private boolean signatureVerified = false;

    @Column(name = "failure_reason", length = 255)
    private String failureReason;

    @Column(name = "payment_expires_at")
    private java.time.Instant paymentExpiresAt;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
