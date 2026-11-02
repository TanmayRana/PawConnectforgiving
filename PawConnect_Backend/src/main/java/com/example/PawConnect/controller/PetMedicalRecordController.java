package com.example.PawConnect.controller;

import com.example.PawConnect.dto.request.pet.CreateMedicalRecordRequest;
import com.example.PawConnect.dto.request.pet.UpdateMedicalRecordRequest;
import com.example.PawConnect.dto.response.PetMedicalRecordResponse;
import com.example.PawConnect.response.ApiResponse;
import com.example.PawConnect.response.PageResponse;
import com.example.PawConnect.service.PetMedicalRecordService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/me/pets/{petId}/medical-records")
@RequiredArgsConstructor
@Tag(name = "Customer Pet Medical Records", description = "Customer self-service pet medical records management")
@PreAuthorize("isAuthenticated()")
public class PetMedicalRecordController {

    private final PetMedicalRecordService petMedicalRecordService;

    @GetMapping
    @Operation(summary = "List medical records for a pet with pagination")
    public ResponseEntity<ApiResponse<PageResponse<PetMedicalRecordResponse>>> getMedicalRecords(
            @PathVariable Long petId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "recordDate,desc") String sort
    ) {
        PageResponse<PetMedicalRecordResponse> response = petMedicalRecordService.getMedicalRecordsForPet(petId, page, size, sort);
        return ResponseEntity.ok(ApiResponse.ok(response, "Medical records retrieved successfully"));
    }

    @PostMapping
    @Operation(summary = "Add a new customer-entered medical record for a pet")
    public ResponseEntity<ApiResponse<PetMedicalRecordResponse>> createMedicalRecord(
            @PathVariable Long petId,
            @Valid @RequestBody CreateMedicalRecordRequest request
    ) {
        PetMedicalRecordResponse response = petMedicalRecordService.createMedicalRecord(petId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Medical record created successfully"));
    }

    @GetMapping("/{recordId}")
    @Operation(summary = "Get medical record details by ID")
    public ResponseEntity<ApiResponse<PetMedicalRecordResponse>> getMedicalRecordById(
            @PathVariable Long petId,
            @PathVariable Long recordId
    ) {
        PetMedicalRecordResponse response = petMedicalRecordService.getMedicalRecordById(petId, recordId);
        return ResponseEntity.ok(ApiResponse.ok(response, "Medical record retrieved successfully"));
    }

    @PutMapping("/{recordId}")
    @Operation(summary = "Update customer-entered medical record by ID")
    public ResponseEntity<ApiResponse<PetMedicalRecordResponse>> updateMedicalRecord(
            @PathVariable Long petId,
            @PathVariable Long recordId,
            @Valid @RequestBody UpdateMedicalRecordRequest request
    ) {
        PetMedicalRecordResponse response = petMedicalRecordService.updateMedicalRecord(petId, recordId, request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Medical record updated successfully"));
    }

    @DeleteMapping("/{recordId}")
    @Operation(summary = "Delete customer-entered medical record by ID")
    public ResponseEntity<ApiResponse<Void>> deleteMedicalRecord(
            @PathVariable Long petId,
            @PathVariable Long recordId
    ) {
        petMedicalRecordService.deleteMedicalRecord(petId, recordId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Medical record deleted successfully"));
    }
}
