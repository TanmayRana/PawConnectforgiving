package com.example.PawConnect.controller;

import com.example.PawConnect.dto.request.pet.CreatePetRequest;
import com.example.PawConnect.dto.request.pet.UpdatePetRequest;
import com.example.PawConnect.dto.response.PetResponse;
import com.example.PawConnect.response.ApiResponse;
import com.example.PawConnect.response.PageResponse;
import com.example.PawConnect.service.PetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/me/pets")
@RequiredArgsConstructor
@Tag(name = "Customer Pets", description = "Customer self-service pet profile management")
@PreAuthorize("isAuthenticated()")
public class PetController {

    private final PetService petService;

    @GetMapping
    @Operation(summary = "List current user's active pets with pagination")
    public ResponseEntity<ApiResponse<PageResponse<PetResponse>>> getPets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort
    ) {
        PageResponse<PetResponse> response = petService.getCurrentUserPets(page, size, sort);
        return ResponseEntity.ok(ApiResponse.ok(response, "Pets retrieved successfully"));
    }

    @PostMapping
    @Operation(summary = "Create a new pet profile for current user")
    public ResponseEntity<ApiResponse<PetResponse>> createPet(@Valid @RequestBody CreatePetRequest request) {
        PetResponse response = petService.createPet(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Pet created successfully"));
    }

    @GetMapping("/{petId}")
    @Operation(summary = "Get pet profile details by ID")
    public ResponseEntity<ApiResponse<PetResponse>> getPetById(@PathVariable Long petId) {
        PetResponse response = petService.getPetById(petId);
        return ResponseEntity.ok(ApiResponse.ok(response, "Pet retrieved successfully"));
    }

    @PutMapping("/{petId}")
    @Operation(summary = "Update pet profile by ID")
    public ResponseEntity<ApiResponse<PetResponse>> updatePet(
            @PathVariable Long petId,
            @Valid @RequestBody UpdatePetRequest request
    ) {
        PetResponse response = petService.updatePet(petId, request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Pet updated successfully"));
    }

    @DeleteMapping("/{petId}")
    @Operation(summary = "Soft delete pet profile (preserves historical records)")
    public ResponseEntity<ApiResponse<Void>> deletePet(@PathVariable Long petId) {
        petService.deletePet(petId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Pet deleted successfully"));
    }
}
