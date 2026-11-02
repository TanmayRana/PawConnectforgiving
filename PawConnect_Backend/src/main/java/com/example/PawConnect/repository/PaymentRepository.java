package com.example.PawConnect.repository;

import com.example.PawConnect.model.Payment;
import com.example.PawConnect.model.PaymentFor;
import com.example.PawConnect.model.PaymentStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long>, JpaSpecificationExecutor<Payment> {

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = com.example.PawConnect.model.PaymentStatus.SUCCESS")
    BigDecimal calculateTotalSuccessfulRevenue();

    long countByStatus(PaymentStatus status);

    Optional<Payment> findByPaymentReference(String paymentReference);

    Optional<Payment> findByGatewayOrderId(String gatewayOrderId);

    Optional<Payment> findByGatewayPaymentId(String gatewayPaymentId);

    List<Payment> findByUserId(Long userId);

    Page<Payment> findByUserId(Long userId, Pageable pageable);

    List<Payment> findByPaymentForAndReferenceId(PaymentFor paymentFor, Long referenceId);

    Optional<Payment> findFirstByPaymentForAndReferenceIdOrderByIdDesc(PaymentFor paymentFor, Long referenceId);

    Optional<Payment> findByPaymentForAndReferenceIdAndStatus(PaymentFor paymentFor, Long referenceId, PaymentStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Payment p WHERE p.id = :id")
    Optional<Payment> findByIdForUpdate(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Payment p WHERE p.gatewayOrderId = :orderId")
    Optional<Payment> findByGatewayOrderIdForUpdate(@Param("orderId") String orderId);
}

