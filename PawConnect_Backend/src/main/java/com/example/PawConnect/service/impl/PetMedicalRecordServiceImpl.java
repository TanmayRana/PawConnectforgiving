package com.example.PawConnect.service.impl;

import com.example.PawConnect.dto.request.pet.CreateMedicalRecordRequest;
import com.example.PawConnect.dto.request.pet.UpdateMedicalRecordRequest;
import com.example.PawConnect.dto.response.PetMedicalRecordResponse;
import com.example.PawConnect.exception.ForbiddenException;
import com.example.PawConnect.exception.ResourceNotFoundException;
import com.example.PawConnect.mapper.PetMedicalRecordMapper;
import com.example.PawConnect.model.Pet;
import com.example.PawConnect.model.PetMedicalRecord;
import com.example.PawConnect.model.PetStatus;
import com.example.PawConnect.repository.PetMedicalRecordRepository;
import com.example.PawConnect.response.PageResponse;
import com.example.PawConnect.service.AuthorizationService;
import com.example.PawConnect.service.PetMedicalRecordService;
import com.example.PawConnect.util.PaginationUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class PetMedicalRecordServiceImpl implements PetMedicalRecordService {

    private static final Set<String> ALLOWED_SORTS = Set.of(
            "id", "recordType", "recordDate", "createdAt"
    );

    private final AuthorizationService authorizationService;
    private final PetMedicalRecordRepository petMedicalRecordRepository;
    private final PetMedicalRecordMapper petMedicalRecordMapper;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PetMedicalRecordResponse> getMedicalRecordsForPet(Long petId, int page, int size, String sort) {
        Pet pet = authorizationService.getPetAndRequireOwner(petId);
        if (pet.getStatus() == PetStatus.INACTIVE) {
            throw new ResourceNotFoundException("Pet not found with id: " + petId);
        }

        Pageable pageable = PaginationUtils.createPageRequest(page, size, sort, ALLOWED_SORTS, "recordDate");
        Page<PetMedicalRecord> records = petMedicalRecordRepository.findByPetId(petId, pageable);
        return PageResponse.from(records.map(petMedicalRecordMapper::toResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public PetMedicalRecordResponse getMedicalRecordById(Long petId, Long recordId) {
        Pet pet = authorizationService.getPetAndRequireOwner(petId);
        if (pet.getStatus() == PetStatus.INACTIVE) {
            throw new ResourceNotFoundException("Pet not found with id: " + petId);
        }

        PetMedicalRecord record = petMedicalRecordRepository.findByIdAndPetId(recordId, petId)
                .orElseThrow(() -> new ResourceNotFoundException("Medical record not found with id: " + recordId + " for pet: " + petId));

        return petMedicalRecordMapper.toResponse(record);
    }

    @Override
    @Transactional
    public PetMedicalRecordResponse createMedicalRecord(Long petId, CreateMedicalRecordRequest request) {
        Pet pet = authorizationService.getPetAndRequireOwner(petId);
        if (pet.getStatus() == PetStatus.INACTIVE) {
            throw new ResourceNotFoundException("Pet not found with id: " + petId);
        }

        // Customer-entered records must not impersonate veterinarian attribution
        PetMedicalRecord record = PetMedicalRecord.builder()
                .pet(pet)
                .veterinarian(null)
                .recordType(request.getRecordType().trim())
                .diagnosis(request.getDiagnosis())
                .treatment(request.getTreatment())
                .medicines(request.getMedicines())
                .recordDate(request.getRecordDate())
                .attachmentUrl(request.getAttachmentUrl() != null ? request.getAttachmentUrl().trim() : null)
                .notes(request.getNotes())
                .build();

        PetMedicalRecord saved = petMedicalRecordRepository.save(record);
        return petMedicalRecordMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public PetMedicalRecordResponse updateMedicalRecord(Long petId, Long recordId, UpdateMedicalRecordRequest request) {
        Pet pet = authorizationService.getPetAndRequireOwner(petId);
        if (pet.getStatus() == PetStatus.INACTIVE) {
            throw new ResourceNotFoundException("Pet not found with id: " + petId);
        }

        PetMedicalRecord record = petMedicalRecordRepository.findByIdAndPetId(recordId, petId)
                .orElseThrow(() -> new ResourceNotFoundException("Medical record not found with id: " + recordId + " for pet: " + petId));

        // Business rule: Customers cannot modify records professionally authored by a veterinarian
        if (record.getVeterinarian() != null) {
            throw new ForbiddenException("Cannot modify a medical record authored by a veterinarian");
        }

        record.setRecordType(request.getRecordType().trim());
        record.setDiagnosis(request.getDiagnosis());
        record.setTreatment(request.getTreatment());
        record.setMedicines(request.getMedicines());
        record.setRecordDate(request.getRecordDate());
        record.setAttachmentUrl(request.getAttachmentUrl() != null ? request.getAttachmentUrl().trim() : null);
        record.setNotes(request.getNotes());

        PetMedicalRecord saved = petMedicalRecordRepository.save(record);
        return petMedicalRecordMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteMedicalRecord(Long petId, Long recordId) {
        Pet pet = authorizationService.getPetAndRequireOwner(petId);
        if (pet.getStatus() == PetStatus.INACTIVE) {
            throw new ResourceNotFoundException("Pet not found with id: " + petId);
        }

        PetMedicalRecord record = petMedicalRecordRepository.findByIdAndPetId(recordId, petId)
                .orElseThrow(() -> new ResourceNotFoundException("Medical record not found with id: " + recordId + " for pet: " + petId));

        // Business rule: Customers cannot delete records professionally authored by a veterinarian
        if (record.getVeterinarian() != null) {
            throw new ForbiddenException("Cannot delete a medical record authored by a veterinarian");
        }

        petMedicalRecordRepository.delete(record);
    }
}
