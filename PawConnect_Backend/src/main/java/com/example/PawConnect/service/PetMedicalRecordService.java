package com.example.PawConnect.service;

import com.example.PawConnect.dto.request.pet.CreateMedicalRecordRequest;
import com.example.PawConnect.dto.request.pet.UpdateMedicalRecordRequest;
import com.example.PawConnect.dto.response.PetMedicalRecordResponse;
import com.example.PawConnect.response.PageResponse;

public interface PetMedicalRecordService {

    PageResponse<PetMedicalRecordResponse> getMedicalRecordsForPet(Long petId, int page, int size, String sort);

    PetMedicalRecordResponse getMedicalRecordById(Long petId, Long recordId);

    PetMedicalRecordResponse createMedicalRecord(Long petId, CreateMedicalRecordRequest request);

    PetMedicalRecordResponse updateMedicalRecord(Long petId, Long recordId, UpdateMedicalRecordRequest request);

    void deleteMedicalRecord(Long petId, Long recordId);
}
