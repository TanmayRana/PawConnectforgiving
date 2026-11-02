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
public class CreateMedicalRecordRequest {

    private Long veterinarianId;

    @NotBlank(message = "Record type is required")
    @Size(max = 100, message = "Record type must not exceed 100 characters")
    private String recordType;

    private String diagnosis;

    private String treatment;

    private String medicines;

    @NotNull(message = "Record date is required")
    @PastOrPresent(message = "Record date cannot be in the future")
    private LocalDate recordDate;

    @Size(max = 500, message = "Attachment URL must not exceed 500 characters")
    private String attachmentUrl;

    private String notes;
}
