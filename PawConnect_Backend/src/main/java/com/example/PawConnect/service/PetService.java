package com.example.PawConnect.service;

import com.example.PawConnect.dto.request.pet.CreatePetRequest;
import com.example.PawConnect.dto.request.pet.UpdatePetRequest;
import com.example.PawConnect.dto.response.PetResponse;
import com.example.PawConnect.response.PageResponse;

public interface PetService {

    PageResponse<PetResponse> getCurrentUserPets(int page, int size, String sort);

    PetResponse getPetById(Long petId);

    PetResponse createPet(CreatePetRequest request);

    PetResponse updatePet(Long petId, UpdatePetRequest request);

    void deletePet(Long petId);
}
