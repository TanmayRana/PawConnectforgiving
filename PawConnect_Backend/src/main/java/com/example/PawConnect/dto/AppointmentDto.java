package com.example.PawConnect.dto;

import com.example.PawConnect.model.AppointmentStatus;
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
public class AppointmentDto {
    private Long id;
    private String appointmentNo;
    private Long petId;
    private Long veterinarianId;
    private LocalDate appointmentDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String reason;
    private BigDecimal consultationFee;
    private Long paymentId;
    private AppointmentStatus status;
    private String notes;
}
