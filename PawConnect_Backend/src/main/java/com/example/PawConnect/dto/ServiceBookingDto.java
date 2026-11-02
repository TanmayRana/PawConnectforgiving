package com.example.PawConnect.dto;

import com.example.PawConnect.model.BookingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceBookingDto {
    private Long id;
    private String bookingNo;
    private Long petId;
    private Long providerId;
    private Long serviceId;
    private LocalDate bookingDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private BigDecimal price;
    private Long paymentId;
    private BookingStatus status;
    private String notes;
}
