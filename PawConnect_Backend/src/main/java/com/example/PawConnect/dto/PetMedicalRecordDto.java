package com.example.PawConnect.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PetMedicalRecordDto {
    private Long id;
    private Long petId;
    private Long veterinarianId;
    private String recordType;
    private String diagnosis;
    private String treatment;
    private String medicines;
    private LocalDate recordDate;
    private String attachmentUrl;
    private String notes;
}
