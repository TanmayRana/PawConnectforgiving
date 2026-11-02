package com.example.PawConnect.repository;

import com.example.PawConnect.model.Order;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {
    @Override
    @EntityGraph(attributePaths = {"user", "address"})
    Optional<Order> findById(Long id);

    Optional<Order> findByOrderNo(String orderNo);
    List<Order> findByUserId(Long userId);
    Page<Order> findByUserId(Long userId, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT o FROM Order o WHERE o.id = :id")
    Optional<Order> findByIdForUpdate(@Param("id") Long id);

    @Query("SELECT o.id FROM Order o WHERE LOWER(o.orderNo) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<Long> findIdsByOrderNoLike(@Param("q") String q);

    List<Order> findByOrderStatusAndPaymentStatusInAndPaymentExpiresAtBefore(
            com.example.PawConnect.model.OrderStatus orderStatus,
            java.util.Collection<com.example.PawConnect.model.PaymentStatus> paymentStatuses,
            java.time.Instant now
    );

    @EntityGraph(attributePaths = {"orderItems", "orderItems.product", "address", "user"})
    List<Order> findByUserIdAndOrderStatus(Long userId, com.example.PawConnect.model.OrderStatus orderStatus);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.user.id = :userId AND UPPER(TRIM(o.promoCode)) = UPPER(TRIM(:promoCode)) AND o.orderStatus != :excludedStatus")
    long countUserPromoCodeUsage(
            @Param("userId") Long userId,
            @Param("promoCode") String promoCode,
            @Param("excludedStatus") com.example.PawConnect.model.OrderStatus excludedStatus
    );
}
