package com.example.PawConnect.dto.response;

import com.example.PawConnect.model.AppointmentStatus;
import com.example.PawConnect.model.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppointmentResponse {

    private Long id;
    private String appointmentNo;

    // Pet details
    private Long petId;
    private String petName;
    private String species;
    private String breed;
    private String petPhotoUrl;

    // Owner details
    private Long ownerId;
    private String ownerName;
    private String ownerPhone;

    // Veterinarian details
    private Long veterinarianId;
    private String veterinarianName;
    private String clinicName;
    private String specialization;

    // Schedule & details
    private LocalDate appointmentDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String reason;
    private BigDecimal consultationFee;
    private AppointmentStatus status;
    private PaymentStatus paymentStatus;
    private String notes;
    private java.time.Instant paymentExpiresAt;
    private Long remainingPaymentSeconds;
    private Boolean canRetryPayment;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
