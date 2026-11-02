package com.example.PawConnect.dto.request.pet;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateVaccinationRequest {

    @NotBlank(message = "Vaccine name is required")
    @Size(max = 150, message = "Vaccine name must not exceed 150 characters")
    private String vaccineName;

    @NotNull(message = "Vaccination date is required")
    @PastOrPresent(message = "Vaccination date cannot be in the future")
    private LocalDate vaccinationDate;

    private LocalDate nextDueDate;

    @Size(max = 500, message = "Certificate URL must not exceed 500 characters")
    private String certificateUrl;

    @Size(max = 150, message = "Administered by must not exceed 150 characters")
    private String administeredBy;

    private String notes;
}
