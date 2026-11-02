package com.example.PawConnect.repository;

import com.example.PawConnect.model.Appointment;
import com.example.PawConnect.model.AppointmentStatus;
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
public interface AppointmentRepository extends JpaRepository<Appointment, Long>, JpaSpecificationExecutor<Appointment> {

    Optional<Appointment> findByAppointmentNo(String appointmentNo);

    List<Appointment> findByPetId(Long petId);

    Page<Appointment> findByPetId(Long petId, Pageable pageable);

    List<Appointment> findByVeterinarianId(Long veterinarianId);

    Page<Appointment> findByVeterinarianId(Long veterinarianId, Pageable pageable);

    Page<Appointment> findByVeterinarianIdAndStatus(Long veterinarianId, AppointmentStatus status, Pageable pageable);

    List<Appointment> findByVeterinarianIdAndAppointmentDate(Long veterinarianId, LocalDate appointmentDate);

    @Query("SELECT a FROM Appointment a WHERE a.pet.owner.id = :ownerId")
    Page<Appointment> findByPetOwnerId(@Param("ownerId") Long ownerId, Pageable pageable);

    @Query("SELECT a FROM Appointment a WHERE a.pet.owner.id = :ownerId")
    List<Appointment> findAllByPetOwnerId(@Param("ownerId") Long ownerId);

    @Query("SELECT a FROM Appointment a WHERE a.pet.owner.id = :ownerId AND a.status = :status")
    Page<Appointment> findByPetOwnerIdAndStatus(@Param("ownerId") Long ownerId, @Param("status") AppointmentStatus status, Pageable pageable);

    @Query("SELECT a FROM Appointment a WHERE a.id = :id AND a.pet.owner.id = :ownerId")
    Optional<Appointment> findByIdAndPetOwnerId(@Param("id") Long id, @Param("ownerId") Long ownerId);

    Optional<Appointment> findByIdAndVeterinarianId(Long id, Long veterinarianId);

    List<Appointment> findByAppointmentDateAndStatus(LocalDate appointmentDate, AppointmentStatus status);

    // Overlap query to detect conflicts for active/confirmed appointments
    @Query("SELECT a FROM Appointment a WHERE a.veterinarian.id = :vetId " +
           "AND a.appointmentDate = :date " +
           "AND a.status NOT IN (com.example.PawConnect.model.AppointmentStatus.CANCELLED, com.example.PawConnect.model.AppointmentStatus.NO_SHOW) " +
           "AND a.startTime < :reqEnd AND a.endTime > :reqStart")
    List<Appointment> findOverlappingAppointments(
            @Param("vetId") Long vetId,
            @Param("date") LocalDate date,
            @Param("reqStart") LocalTime reqStart,
            @Param("reqEnd") LocalTime reqEnd
    );

    @Query("SELECT a.id FROM Appointment a WHERE LOWER(a.appointmentNo) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<Long> findIdsByAppointmentNoLike(@Param("q") String q);

    List<Appointment> findByStatusAndPaymentExpiresAtBefore(AppointmentStatus status, java.time.Instant now);
}
