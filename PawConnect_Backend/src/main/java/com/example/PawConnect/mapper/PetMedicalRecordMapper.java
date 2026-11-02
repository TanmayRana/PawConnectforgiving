package com.example.PawConnect.mapper;

import com.example.PawConnect.dto.response.PetMedicalRecordResponse;
import com.example.PawConnect.model.PetMedicalRecord;
import org.springframework.stereotype.Component;

@Component
public class PetMedicalRecordMapper {

    public PetMedicalRecordResponse toResponse(PetMedicalRecord record) {
        if (record == null) {
            return null;
        }

        Long petId = null;
        String petName = null;
        if (record.getPet() != null) {
            petId = record.getPet().getId();
            petName = record.getPet().getName();
        }

        Long vetId = null;
        String vetName = null;
        boolean isVetVerified = false;
        if (record.getVeterinarian() != null) {
            vetId = record.getVeterinarian().getId();
            isVetVerified = true;
            if (record.getVeterinarian().getUser() != null) {
                String first = record.getVeterinarian().getUser().getFirstName() != null ? record.getVeterinarian().getUser().getFirstName() : "";
                String last = record.getVeterinarian().getUser().getLastName() != null ? record.getVeterinarian().getUser().getLastName() : "";
                vetName = ("Dr. " + first + " " + last).trim();
            }
        }

        return PetMedicalRecordResponse.builder()
                .id(record.getId())
                .petId(petId)
                .petName(petName)
                .veterinarianId(vetId)
                .veterinarianName(vetName)
                .isVeterinarianVerified(isVetVerified)
                .recordType(record.getRecordType())
                .diagnosis(record.getDiagnosis())
                .treatment(record.getTreatment())
                .medicines(record.getMedicines())
                .recordDate(record.getRecordDate())
                .attachmentUrl(record.getAttachmentUrl())
                .notes(record.getNotes())
                .createdAt(record.getCreatedAt())
                .build();
    }
}
