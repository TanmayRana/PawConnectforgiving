package com.example.PawConnect.mapper;

import com.example.PawConnect.dto.response.PetVaccinationResponse;
import com.example.PawConnect.model.PetVaccination;
import org.springframework.stereotype.Component;

@Component
public class PetVaccinationMapper {

    public PetVaccinationResponse toResponse(PetVaccination vaccination) {
        if (vaccination == null) {
            return null;
        }

        Long petId = null;
        String petName = null;
        if (vaccination.getPet() != null) {
            petId = vaccination.getPet().getId();
            petName = vaccination.getPet().getName();
        }

        return PetVaccinationResponse.builder()
                .id(vaccination.getId())
                .petId(petId)
                .petName(petName)
                .vaccineName(vaccination.getVaccineName())
                .vaccinationDate(vaccination.getVaccinationDate())
                .nextDueDate(vaccination.getNextDueDate())
                .certificateUrl(vaccination.getCertificateUrl())
                .administeredBy(vaccination.getAdministeredBy())
                .notes(vaccination.getNotes())
                .createdAt(vaccination.getCreatedAt())
                .build();
    }
}
