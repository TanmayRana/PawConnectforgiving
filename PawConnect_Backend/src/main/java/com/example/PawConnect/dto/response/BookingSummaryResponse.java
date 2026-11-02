package com.example.PawConnect.dto.response;

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
public class BookingSummaryResponse {

    private Long id;
    private String bookingType; // "VETERINARY" or "SERVICE"
    private String referenceNo; // appointmentNo or bookingNo

    // Pet details
    private Long petId;
    private String petName;
    private String species;
    private String breed;
    private String petPhotoUrl;

    // Provider details
    private Long providerId; // veterinarianId or providerId
    private String providerName; // veterinarian name or business name
    private String providerType; // "VETERINARIAN" or ProviderType
    private String providerPhone;
    private String providerImageUrl;

    // Location details
    private String clinicOrBusinessName;
    private String locationAddress;
    private BigDecimal latitude;
    private BigDecimal longitude;

    // Service or reason
    private Long serviceId; // null for vet appointment
    private String serviceOrReason; // reason or serviceName

    // Schedule & details
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;

    private BigDecimal amount;
    private String status;
    private String paymentStatus;
    private String notes;

    private java.time.Instant paymentExpiresAt;
    private Long remainingPaymentSeconds;
    private Boolean canRetryPayment;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
