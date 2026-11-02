package com.example.PawConnect.repository;

import com.example.PawConnect.model.PaymentOrder;
import com.example.PawConnect.model.PaymentStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentOrderRepository extends JpaRepository<PaymentOrder, Long>, JpaSpecificationExecutor<PaymentOrder> {

    Optional<PaymentOrder> findByRazorpayOrderId(String razorpayOrderId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT po FROM PaymentOrder po WHERE po.razorpayOrderId = :razorpayOrderId")
    Optional<PaymentOrder> findByRazorpayOrderIdForUpdate(@Param("razorpayOrderId") String razorpayOrderId);

    Optional<PaymentOrder> findByRazorpayPaymentId(String razorpayPaymentId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT po FROM PaymentOrder po WHERE po.razorpayPaymentId = :paymentId")
    Optional<PaymentOrder> findByRazorpayPaymentIdForUpdate(@Param("paymentId") String paymentId);

    List<PaymentOrder> findByUserId(Long userId);

    List<PaymentOrder> findAllByOrderId(Long orderId);

    Optional<PaymentOrder> findTopByOrderIdOrderByCreatedAtDesc(Long orderId);

    Optional<PaymentOrder> findByOrderIdAndStatus(Long orderId, PaymentStatus status);

    Optional<PaymentOrder> findByBookingIdAndBookingType(Long bookingId, String bookingType);

    Optional<PaymentOrder> findTopByBookingIdAndBookingTypeOrderByCreatedAtDesc(Long bookingId, String bookingType);

    Optional<PaymentOrder> findTopByBookingIdOrderByCreatedAtDesc(Long bookingId);
}
