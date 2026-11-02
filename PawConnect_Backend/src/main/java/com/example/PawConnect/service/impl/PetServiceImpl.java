package com.example.PawConnect.service.impl;

import com.example.PawConnect.dto.request.pet.CreatePetRequest;
import com.example.PawConnect.dto.request.pet.UpdatePetRequest;
import com.example.PawConnect.dto.response.PetResponse;
import com.example.PawConnect.exception.ResourceNotFoundException;
import com.example.PawConnect.mapper.PetMapper;
import com.example.PawConnect.model.Pet;
import com.example.PawConnect.model.PetStatus;
import com.example.PawConnect.model.User;
import com.example.PawConnect.repository.PetRepository;
import com.example.PawConnect.response.PageResponse;
import com.example.PawConnect.service.AuthorizationService;
import com.example.PawConnect.service.CurrentUserService;
import com.example.PawConnect.service.PetService;
import com.example.PawConnect.util.PaginationUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class PetServiceImpl implements PetService {

    private static final Set<String> ALLOWED_SORTS = Set.of(
            "id", "name", "species", "breed", "dateOfBirth", "weight", "createdAt", "updatedAt"
    );

    private final CurrentUserService currentUserService;
    private final AuthorizationService authorizationService;
    private final PetRepository petRepository;
    private final PetMapper petMapper;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PetResponse> getCurrentUserPets(int page, int size, String sort) {
        Long currentUserId = currentUserService.getCurrentUserId();
        Pageable pageable = PaginationUtils.createPageRequest(page, size, sort, ALLOWED_SORTS, "createdAt");
        Page<Pet> pets = petRepository.findByOwnerIdAndStatus(currentUserId, PetStatus.ACTIVE, pageable);
        return PageResponse.from(pets.map(petMapper::toResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public PetResponse getPetById(Long petId) {
        Pet pet = authorizationService.getPetAndRequireOwner(petId);
        if (pet.getStatus() == PetStatus.INACTIVE) {
            throw new ResourceNotFoundException("Pet not found with id: " + petId);
        }
        return petMapper.toResponse(pet);
    }

    @Override
    @Transactional
    public PetResponse createPet(CreatePetRequest request) {
        User owner = currentUserService.getCurrentUser();

        String chip = request.getMicrochipNumber() != null && !request.getMicrochipNumber().isBlank()
                ? request.getMicrochipNumber().trim()
                : (request.getMicrochipId() != null && !request.getMicrochipId().isBlank() ? request.getMicrochipId().trim() : null);

        Pet pet = Pet.builder()
                .owner(owner)
                .name(request.getName().trim())
                .species(request.getSpecies().trim())
                .breed(request.getBreed() != null ? request.getBreed().trim() : null)
                .dateOfBirth(request.getDateOfBirth())
                .gender(request.getGender())
                .weight(request.getWeight())
                .photoUrl(request.getPhotoUrl())
                .notes(request.getNotes())
                .microchipNumber(chip)
                .status(PetStatus.ACTIVE)
                .build();

        Pet savedPet = petRepository.save(pet);
        return petMapper.toResponse(savedPet);
    }

    @Override
    @Transactional
    public PetResponse updatePet(Long petId, UpdatePetRequest request) {
        Pet pet = authorizationService.getPetAndRequireOwner(petId);
        if (pet.getStatus() == PetStatus.INACTIVE) {
            throw new ResourceNotFoundException("Pet not found with id: " + petId);
        }

        pet.setName(request.getName().trim());
        pet.setSpecies(request.getSpecies().trim());
        pet.setBreed(request.getBreed() != null ? request.getBreed().trim() : null);
        pet.setDateOfBirth(request.getDateOfBirth());
        if (request.getGender() != null) {
            pet.setGender(request.getGender());
        }
        pet.setWeight(request.getWeight());
        pet.setPhotoUrl(request.getPhotoUrl());
        pet.setNotes(request.getNotes());
        String chip = request.getMicrochipNumber() != null
                ? request.getMicrochipNumber().trim()
                : (request.getMicrochipId() != null ? request.getMicrochipId().trim() : null);
        if (chip != null || request.getMicrochipNumber() != null || request.getMicrochipId() != null) {
            pet.setMicrochipNumber(chip != null && !chip.isBlank() ? chip : null);
        }
        if (request.getStatus() != null) {
            pet.setStatus(request.getStatus());
        }

        Pet savedPet = petRepository.save(pet);
        return petMapper.toResponse(savedPet);
    }

    @Override
    @Transactional
    public void deletePet(Long petId) {
        Pet pet = authorizationService.getPetAndRequireOwner(petId);
        // Soft delete preserves all historical medical and appointment records
        pet.setStatus(PetStatus.INACTIVE);
        petRepository.save(pet);
    }
}
