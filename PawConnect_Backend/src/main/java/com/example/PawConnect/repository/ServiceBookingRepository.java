package com.example.PawConnect.repository;

import com.example.PawConnect.model.BookingStatus;
import com.example.PawConnect.model.ServiceBooking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceBookingRepository extends JpaRepository<ServiceBooking, Long>, JpaSpecificationExecutor<ServiceBooking> {

    Optional<ServiceBooking> findByBookingNo(String bookingNo);

    List<ServiceBooking> findByPetId(Long petId);

    Page<ServiceBooking> findByPetId(Long petId, Pageable pageable);

    List<ServiceBooking> findByProviderId(Long providerId);

    Page<ServiceBooking> findByProviderId(Long providerId, Pageable pageable);

    Page<ServiceBooking> findByProviderIdAndStatus(Long providerId, BookingStatus status, Pageable pageable);

    List<ServiceBooking> findByProviderIdAndBookingDate(Long providerId, LocalDate bookingDate);

    @Query("SELECT b FROM ServiceBooking b WHERE b.pet.owner.id = :ownerId")
    Page<ServiceBooking> findByPetOwnerId(@Param("ownerId") Long ownerId, Pageable pageable);

    @Query("SELECT b FROM ServiceBooking b WHERE b.pet.owner.id = :ownerId")
    List<ServiceBooking> findAllByPetOwnerId(@Param("ownerId") Long ownerId);

    @Query("SELECT b FROM ServiceBooking b WHERE b.pet.owner.id = :ownerId AND b.status = :status")
    Page<ServiceBooking> findByPetOwnerIdAndStatus(@Param("ownerId") Long ownerId, @Param("status") BookingStatus status, Pageable pageable);

    @Query("SELECT b FROM ServiceBooking b WHERE b.id = :id AND b.pet.owner.id = :ownerId")
    Optional<ServiceBooking> findByIdAndPetOwnerId(@Param("id") Long id, @Param("ownerId") Long ownerId);

    Optional<ServiceBooking> findByIdAndProviderId(Long id, Long providerId);

    List<ServiceBooking> findByBookingDateAndStatus(LocalDate bookingDate, BookingStatus status);

    // Overlap query to detect conflicts for active service bookings
    @Query("SELECT b FROM ServiceBooking b WHERE b.provider.id = :providerId " +
           "AND b.bookingDate = :date " +
           "AND b.status NOT IN (com.example.PawConnect.model.BookingStatus.CANCELLED, com.example.PawConnect.model.BookingStatus.NO_SHOW) " +
           "AND b.startTime < :reqEnd AND b.endTime > :reqStart")
    List<ServiceBooking> findOverlappingBookings(
            @Param("providerId") Long providerId,
            @Param("date") LocalDate date,
            @Param("reqStart") LocalTime reqStart,
            @Param("reqEnd") LocalTime reqEnd
    );

    @Query("SELECT b.id FROM ServiceBooking b WHERE LOWER(b.bookingNo) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<Long> findIdsByBookingNoLike(@Param("q") String q);

    List<ServiceBooking> findByStatusAndPaymentExpiresAtBefore(BookingStatus status, java.time.Instant now);
}
