package com.example.PawConnect.dto.request.booking;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateBookingRequest {

    @NotBlank(message = "Booking type is required (VETERINARY or SERVICE)")
    private String bookingType;

    @NotNull(message = "Pet ID is required")
    private Long petId;

    @NotNull(message = "Booking date is required")
    @FutureOrPresent(message = "Booking date must be today or in the future")
    private LocalDate date;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    private LocalTime endTime;

    // Required for VETERINARY
    private Long veterinarianId;
    private String reason;

    // Required for SERVICE
    private Long providerId;
    private Long serviceId;
    private String notes;
}
