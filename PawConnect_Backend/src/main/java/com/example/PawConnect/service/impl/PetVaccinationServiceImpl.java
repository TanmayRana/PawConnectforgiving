package com.example.PawConnect.service.impl;

import com.example.PawConnect.dto.request.pet.CreateVaccinationRequest;
import com.example.PawConnect.dto.request.pet.UpdateVaccinationRequest;
import com.example.PawConnect.dto.response.PetVaccinationResponse;
import com.example.PawConnect.exception.BusinessRuleException;
import com.example.PawConnect.exception.ResourceNotFoundException;
import com.example.PawConnect.mapper.PetVaccinationMapper;
import com.example.PawConnect.model.Pet;
import com.example.PawConnect.model.PetStatus;
import com.example.PawConnect.model.PetVaccination;
import com.example.PawConnect.repository.PetVaccinationRepository;
import com.example.PawConnect.response.PageResponse;
import com.example.PawConnect.service.AuthorizationService;
import com.example.PawConnect.service.PetVaccinationService;
import com.example.PawConnect.util.PaginationUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class PetVaccinationServiceImpl implements PetVaccinationService {

    private static final Set<String> ALLOWED_SORTS = Set.of(
            "id", "vaccineName", "vaccinationDate", "nextDueDate", "createdAt"
    );

    private final AuthorizationService authorizationService;
    private final PetVaccinationRepository petVaccinationRepository;
    private final PetVaccinationMapper petVaccinationMapper;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PetVaccinationResponse> getVaccinationsForPet(Long petId, int page, int size, String sort) {
        Pet pet = authorizationService.getPetAndRequireOwner(petId);
        if (pet.getStatus() == PetStatus.INACTIVE) {
            throw new ResourceNotFoundException("Pet not found with id: " + petId);
        }

        Pageable pageable = PaginationUtils.createPageRequest(page, size, sort, ALLOWED_SORTS, "vaccinationDate");
        Page<PetVaccination> vaccinations = petVaccinationRepository.findByPetId(petId, pageable);
        return PageResponse.from(vaccinations.map(petVaccinationMapper::toResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public PetVaccinationResponse getVaccinationById(Long petId, Long vaccinationId) {
        Pet pet = authorizationService.getPetAndRequireOwner(petId);
        if (pet.getStatus() == PetStatus.INACTIVE) {
            throw new ResourceNotFoundException("Pet not found with id: " + petId);
        }

        PetVaccination vaccination = petVaccinationRepository.findByIdAndPetId(vaccinationId, petId)
                .orElseThrow(() -> new ResourceNotFoundException("Vaccination record not found with id: " + vaccinationId + " for pet: " + petId));

        return petVaccinationMapper.toResponse(vaccination);
    }

    @Override
    @Transactional
    public PetVaccinationResponse createVaccination(Long petId, CreateVaccinationRequest request) {
        Pet pet = authorizationService.getPetAndRequireOwner(petId);
        if (pet.getStatus() == PetStatus.INACTIVE) {
            throw new ResourceNotFoundException("Pet not found with id: " + petId);
        }

        validateVaccinationDates(request.getVaccinationDate(), request.getNextDueDate());

        PetVaccination vaccination = PetVaccination.builder()
                .pet(pet)
                .vaccineName(request.getVaccineName().trim())
                .vaccinationDate(request.getVaccinationDate())
                .nextDueDate(request.getNextDueDate())
                .certificateUrl(request.getCertificateUrl() != null ? request.getCertificateUrl().trim() : null)
                .administeredBy(request.getAdministeredBy() != null ? request.getAdministeredBy().trim() : null)
                .notes(request.getNotes())
                .build();

        PetVaccination saved = petVaccinationRepository.save(vaccination);
        return petVaccinationMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public PetVaccinationResponse updateVaccination(Long petId, Long vaccinationId, UpdateVaccinationRequest request) {
        Pet pet = authorizationService.getPetAndRequireOwner(petId);
        if (pet.getStatus() == PetStatus.INACTIVE) {
            throw new ResourceNotFoundException("Pet not found with id: " + petId);
        }

        PetVaccination vaccination = petVaccinationRepository.findByIdAndPetId(vaccinationId, petId)
                .orElseThrow(() -> new ResourceNotFoundException("Vaccination record not found with id: " + vaccinationId + " for pet: " + petId));

        validateVaccinationDates(request.getVaccinationDate(), request.getNextDueDate());

        vaccination.setVaccineName(request.getVaccineName().trim());
        vaccination.setVaccinationDate(request.getVaccinationDate());
        vaccination.setNextDueDate(request.getNextDueDate());
        vaccination.setCertificateUrl(request.getCertificateUrl() != null ? request.getCertificateUrl().trim() : null);
        vaccination.setAdministeredBy(request.getAdministeredBy() != null ? request.getAdministeredBy().trim() : null);
        vaccination.setNotes(request.getNotes());

        PetVaccination saved = petVaccinationRepository.save(vaccination);
        return petVaccinationMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteVaccination(Long petId, Long vaccinationId) {
        Pet pet = authorizationService.getPetAndRequireOwner(petId);
        if (pet.getStatus() == PetStatus.INACTIVE) {
            throw new ResourceNotFoundException("Pet not found with id: " + petId);
        }

        PetVaccination vaccination = petVaccinationRepository.findByIdAndPetId(vaccinationId, petId)
                .orElseThrow(() -> new ResourceNotFoundException("Vaccination record not found with id: " + vaccinationId + " for pet: " + petId));

        petVaccinationRepository.delete(vaccination);
    }

    private void validateVaccinationDates(java.time.LocalDate vaccinationDate, java.time.LocalDate nextDueDate) {
        if (nextDueDate != null && nextDueDate.isBefore(vaccinationDate)) {
            throw new BusinessRuleException("Next due date cannot precede vaccination date");
        }
    }
}
