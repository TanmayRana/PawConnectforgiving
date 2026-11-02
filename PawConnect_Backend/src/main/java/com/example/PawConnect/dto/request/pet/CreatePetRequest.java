package com.example.PawConnect.dto.request.pet;

import com.example.PawConnect.model.PetGender;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreatePetRequest {

    @NotBlank(message = "Pet name is required")
    @Size(min = 1, max = 100, message = "Pet name must not exceed 100 characters")
    private String name;

    @NotBlank(message = "Species is required")
    @Size(max = 50, message = "Species must not exceed 50 characters")
    private String species;

    @Size(max = 100, message = "Breed must not exceed 100 characters")
    private String breed;

    @PastOrPresent(message = "Date of birth cannot be in the future")
    private LocalDate dateOfBirth;

    @NotNull(message = "Pet gender is required")
    private PetGender gender;

    @Positive(message = "Weight must be positive")
    @DecimalMin(value = "0.01", message = "Weight must be at least 0.01 kg")
    private BigDecimal weight;

    @Size(max = 500, message = "Photo URL cannot exceed 500 characters")
    private String photoUrl;

    private String notes;

    @Size(max = 100, message = "Microchip number cannot exceed 100 characters")
    private String microchipNumber;

    @Size(max = 100, message = "Microchip ID cannot exceed 100 characters")
    private String microchipId;
}
