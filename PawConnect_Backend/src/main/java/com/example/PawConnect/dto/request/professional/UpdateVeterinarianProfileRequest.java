package com.example.PawConnect.dto.request.professional;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateVeterinarianProfileRequest {

    @NotBlank(message = "Specialization is required")
    @Size(max = 150, message = "Specialization cannot exceed 150 characters")
    private String specialization;

    @NotBlank(message = "Qualification is required")
    @Size(max = 255, message = "Qualification cannot exceed 255 characters")
    private String qualification;

    @NotBlank(message = "License number is required")
    @Size(max = 100, message = "License number cannot exceed 100 characters")
    private String licenseNumber;

    @PositiveOrZero(message = "Experience years must be zero or positive")
    private Integer experienceYears;

    @Size(max = 200, message = "Clinic name cannot exceed 200 characters")
    private String clinicName;

    private String clinicAddress;

    @DecimalMin(value = "-90.0", message = "Latitude must be between -90 and 90")
    @DecimalMax(value = "90.0", message = "Latitude must be between -90 and 90")
    private BigDecimal clinicLatitude;

    @DecimalMin(value = "-180.0", message = "Longitude must be between -180 and 180")
    @DecimalMax(value = "180.0", message = "Longitude must be between -180 and 180")
    private BigDecimal clinicLongitude;

    @NotNull(message = "Consultation fee is required")
    @DecimalMin(value = "0.00", message = "Consultation fee cannot be negative")
    private BigDecimal consultationFee;

    private String bio;
}
