package com.example.PawConnect.controller;

import com.example.PawConnect.dto.request.pet.CreateVaccinationRequest;
import com.example.PawConnect.dto.request.pet.UpdateVaccinationRequest;
import com.example.PawConnect.dto.response.PetVaccinationResponse;
import com.example.PawConnect.response.ApiResponse;
import com.example.PawConnect.response.PageResponse;
import com.example.PawConnect.service.PetVaccinationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/me/pets/{petId}/vaccinations")
@RequiredArgsConstructor
@Tag(name = "Customer Pet Vaccinations", description = "Customer self-service pet vaccination records management")
@PreAuthorize("isAuthenticated()")
public class PetVaccinationController {

    private final PetVaccinationService petVaccinationService;

    @GetMapping
    @Operation(summary = "List vaccination records for a pet with pagination")
    public ResponseEntity<ApiResponse<PageResponse<PetVaccinationResponse>>> getVaccinations(
            @PathVariable Long petId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "vaccinationDate,desc") String sort
    ) {
        PageResponse<PetVaccinationResponse> response = petVaccinationService.getVaccinationsForPet(petId, page, size, sort);
        return ResponseEntity.ok(ApiResponse.ok(response, "Vaccinations retrieved successfully"));
    }

    @PostMapping
    @Operation(summary = "Add a new vaccination record for a pet")
    public ResponseEntity<ApiResponse<PetVaccinationResponse>> createVaccination(
            @PathVariable Long petId,
            @Valid @RequestBody CreateVaccinationRequest request
    ) {
        PetVaccinationResponse response = petVaccinationService.createVaccination(petId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Vaccination record created successfully"));
    }

    @GetMapping("/{vaccinationId}")
    @Operation(summary = "Get vaccination record details by ID")
    public ResponseEntity<ApiResponse<PetVaccinationResponse>> getVaccinationById(
            @PathVariable Long petId,
            @PathVariable Long vaccinationId
    ) {
        PetVaccinationResponse response = petVaccinationService.getVaccinationById(petId, vaccinationId);
        return ResponseEntity.ok(ApiResponse.ok(response, "Vaccination record retrieved successfully"));
    }

    @PutMapping("/{vaccinationId}")
    @Operation(summary = "Update vaccination record by ID")
    public ResponseEntity<ApiResponse<PetVaccinationResponse>> updateVaccination(
            @PathVariable Long petId,
            @PathVariable Long vaccinationId,
            @Valid @RequestBody UpdateVaccinationRequest request
    ) {
        PetVaccinationResponse response = petVaccinationService.updateVaccination(petId, vaccinationId, request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Vaccination record updated successfully"));
    }

    @DeleteMapping("/{vaccinationId}")
    @Operation(summary = "Delete vaccination record by ID")
    public ResponseEntity<ApiResponse<Void>> deleteVaccination(
            @PathVariable Long petId,
            @PathVariable Long vaccinationId
    ) {
        petVaccinationService.deleteVaccination(petId, vaccinationId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Vaccination record deleted successfully"));
    }
}
