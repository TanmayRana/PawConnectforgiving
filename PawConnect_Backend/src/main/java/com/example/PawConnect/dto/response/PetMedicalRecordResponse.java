package com.example.PawConnect.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PetMedicalRecordResponse {

    private Long id;
    private Long petId;
    private String petName;
    private Long veterinarianId;
    private String veterinarianName;
    private Boolean isVeterinarianVerified;
    private String recordType;
    private String diagnosis;
    private String treatment;
    private String medicines;
    private LocalDate recordDate;
    private String attachmentUrl;
    private String notes;
    private LocalDateTime createdAt;
}
