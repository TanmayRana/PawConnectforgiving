package com.example.PawConnect.dto.response;

import com.example.PawConnect.model.PetGender;
import com.example.PawConnect.model.PetStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PetResponse {

    private Long id;
    private Long ownerId;
    private String ownerName;
    private String name;
    private String species;
    private String breed;
    private LocalDate dateOfBirth;
    private String age;
    private PetGender gender;
    private BigDecimal weight;
    private String photoUrl;
    private String notes;
    private String microchipNumber;
    private String microchipId;
    private PetStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
