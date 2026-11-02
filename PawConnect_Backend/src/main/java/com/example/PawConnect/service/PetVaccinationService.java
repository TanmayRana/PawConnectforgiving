package com.example.PawConnect.service;

import com.example.PawConnect.dto.request.pet.CreateVaccinationRequest;
import com.example.PawConnect.dto.request.pet.UpdateVaccinationRequest;
import com.example.PawConnect.dto.response.PetVaccinationResponse;
import com.example.PawConnect.response.PageResponse;

public interface PetVaccinationService {

    PageResponse<PetVaccinationResponse> getVaccinationsForPet(Long petId, int page, int size, String sort);

    PetVaccinationResponse getVaccinationById(Long petId, Long vaccinationId);

    PetVaccinationResponse createVaccination(Long petId, CreateVaccinationRequest request);

    PetVaccinationResponse updateVaccination(Long petId, Long vaccinationId, UpdateVaccinationRequest request);

    void deleteVaccination(Long petId, Long vaccinationId);
}
