package com.example.PawConnect.controller;

import com.example.PawConnect.dto.request.admin.AdminCreateServiceProviderRequest;
import com.example.PawConnect.dto.request.admin.AdminCreateVeterinarianRequest;
import com.example.PawConnect.dto.request.admin.IssueUserPasswordRequest;
import com.example.PawConnect.dto.request.auth.VerifyOtpRequest;
import com.example.PawConnect.dto.request.admin.UpdateEntityStatusRequest;
import com.example.PawConnect.dto.request.admin.VerificationRequest;
import com.example.PawConnect.dto.response.admin.AdminServiceProviderResponse;
import com.example.PawConnect.dto.response.admin.AdminVeterinarianResponse;
import com.example.PawConnect.model.ProviderType;
import com.example.PawConnect.model.ServiceProviderVerificationStatus;
import com.example.PawConnect.model.VeterinarianVerificationStatus;
import com.example.PawConnect.response.ApiResponse;
import com.example.PawConnect.response.PageResponse;
import com.example.PawConnect.service.AdminProfessionalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminProfessionalController {

    private final AdminProfessionalService adminProfessionalService;

    // Veterinarians
    @PostMapping("/veterinarians/email-otp")
    public ResponseEntity<ApiResponse<Void>> requestVeterinarianEmailOtp(
            @Valid @RequestBody IssueUserPasswordRequest request
    ) {
        adminProfessionalService.requestVeterinarianEmailOtp(request);
        return ResponseEntity.ok(ApiResponse.ok(null, "Verification code emailed. Enter it to continue."));
    }

    @PostMapping("/veterinarians/email-otp/verify")
    public ResponseEntity<ApiResponse<Void>> verifyVeterinarianEmailOtp(
            @Valid @RequestBody VerifyOtpRequest request
    ) {
        adminProfessionalService.verifyVeterinarianEmailOtp(request);
        return ResponseEntity.ok(ApiResponse.ok(null, "Email verified. You can register the veterinarian."));
    }

    @PostMapping("/veterinarians")
    public ResponseEntity<ApiResponse<AdminVeterinarianResponse>> createVeterinarian(
            @Valid @RequestBody AdminCreateVeterinarianRequest request
    ) {
        AdminVeterinarianResponse vet = adminProfessionalService.createVeterinarian(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(vet, "Veterinarian registered successfully"));
    }

    @GetMapping("/veterinarians")
    public ResponseEntity<ApiResponse<PageResponse<AdminVeterinarianResponse>>> getVeterinarians(
            @RequestParam(required = false) String verificationStatus,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        VeterinarianVerificationStatus status = parseVetVerificationStatus(verificationStatus);
        PageResponse<AdminVeterinarianResponse> vets = adminProfessionalService.getVeterinarians(
                status, isActive, search, pageable
        );
        return ResponseEntity.ok(ApiResponse.success(vets));
    }

    @GetMapping("/veterinarians/{veterinarianId}")
    public ResponseEntity<ApiResponse<AdminVeterinarianResponse>> getVeterinarianById(
            @PathVariable Long veterinarianId
    ) {
        AdminVeterinarianResponse vet = adminProfessionalService.getVeterinarianById(veterinarianId);
        return ResponseEntity.ok(ApiResponse.success(vet));
    }

    @PatchMapping("/veterinarians/{veterinarianId}/verification")
    public ResponseEntity<ApiResponse<AdminVeterinarianResponse>> updateVeterinarianVerification(
            @PathVariable Long veterinarianId,
            @Valid @RequestBody VerificationRequest request
    ) {
        AdminVeterinarianResponse vet = adminProfessionalService.updateVeterinarianVerification(veterinarianId, request);
        return ResponseEntity.ok(ApiResponse.success(vet));
    }

    @PatchMapping("/veterinarians/{veterinarianId}/status")
    public ResponseEntity<ApiResponse<AdminVeterinarianResponse>> updateVeterinarianStatus(
            @PathVariable Long veterinarianId,
            @Valid @RequestBody UpdateEntityStatusRequest request
    ) {
        AdminVeterinarianResponse vet = adminProfessionalService.updateVeterinarianStatus(veterinarianId, request);
        return ResponseEntity.ok(ApiResponse.success(vet));
    }

    // Service Providers
    @PostMapping("/service-providers/email-otp")
    public ResponseEntity<ApiResponse<Void>> requestServiceProviderEmailOtp(
            @Valid @RequestBody IssueUserPasswordRequest request
    ) {
        adminProfessionalService.requestServiceProviderEmailOtp(request);
        return ResponseEntity.ok(ApiResponse.ok(null, "Verification code emailed. Enter it to continue."));
    }

    @PostMapping("/service-providers/email-otp/verify")
    public ResponseEntity<ApiResponse<Void>> verifyServiceProviderEmailOtp(
            @Valid @RequestBody VerifyOtpRequest request
    ) {
        adminProfessionalService.verifyServiceProviderEmailOtp(request);
        return ResponseEntity.ok(ApiResponse.ok(null, "Email verified. You can register the service provider."));
    }

    @PostMapping("/service-providers")
    public ResponseEntity<ApiResponse<AdminServiceProviderResponse>> createServiceProvider(
            @Valid @RequestBody AdminCreateServiceProviderRequest request
    ) {
        AdminServiceProviderResponse provider = adminProfessionalService.createServiceProvider(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(provider, "Service provider registered successfully"));
    }

    @GetMapping("/service-providers")
    public ResponseEntity<ApiResponse<PageResponse<AdminServiceProviderResponse>>> getServiceProviders(
            @RequestParam(required = false) String verificationStatus,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) String providerType,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        ServiceProviderVerificationStatus status = parseProviderVerificationStatus(verificationStatus);
        ProviderType type = parseProviderType(providerType);
        PageResponse<AdminServiceProviderResponse> providers = adminProfessionalService.getServiceProviders(
                status, isActive, type, search, pageable
        );
        return ResponseEntity.ok(ApiResponse.success(providers));
    }

    private VeterinarianVerificationStatus parseVetVerificationStatus(String status) {
        if (status == null || status.isBlank() || "all".equalsIgnoreCase(status.trim())) {
            return null;
        }
        String clean = status.trim().toUpperCase();
        if ("VERIFIED".equals(clean)) return VeterinarianVerificationStatus.APPROVED;
        try {
            return VeterinarianVerificationStatus.valueOf(clean);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private ServiceProviderVerificationStatus parseProviderVerificationStatus(String status) {
        if (status == null || status.isBlank() || "all".equalsIgnoreCase(status.trim())) {
            return null;
        }
        String clean = status.trim().toUpperCase();
        if ("VERIFIED".equals(clean)) return ServiceProviderVerificationStatus.APPROVED;
        try {
            return ServiceProviderVerificationStatus.valueOf(clean);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private ProviderType parseProviderType(String type) {
        if (type == null || type.isBlank() || "all".equalsIgnoreCase(type.trim())) {
            return null;
        }
        String clean = type.trim().toUpperCase();
        if ("GROOMING".equals(clean) || "GROOMER".equals(clean)) return ProviderType.GROOMER;
        if ("TRAINING".equals(clean) || "TRAINER".equals(clean)) return ProviderType.TRAINER;
        try {
            return ProviderType.valueOf(clean);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    @GetMapping("/service-providers/{providerId}")
    public ResponseEntity<ApiResponse<AdminServiceProviderResponse>> getServiceProviderById(
            @PathVariable Long providerId
    ) {
        AdminServiceProviderResponse provider = adminProfessionalService.getServiceProviderById(providerId);
        return ResponseEntity.ok(ApiResponse.success(provider));
    }

    @PatchMapping("/service-providers/{providerId}/verification")
    public ResponseEntity<ApiResponse<AdminServiceProviderResponse>> updateServiceProviderVerification(
            @PathVariable Long providerId,
            @Valid @RequestBody VerificationRequest request
    ) {
        AdminServiceProviderResponse provider = adminProfessionalService.updateServiceProviderVerification(providerId, request);
        return ResponseEntity.ok(ApiResponse.success(provider));
    }

    @PatchMapping("/service-providers/{providerId}/status")
    public ResponseEntity<ApiResponse<AdminServiceProviderResponse>> updateServiceProviderStatus(
            @PathVariable Long providerId,
            @Valid @RequestBody UpdateEntityStatusRequest request
    ) {
        AdminServiceProviderResponse provider = adminProfessionalService.updateServiceProviderStatus(providerId, request);
        return ResponseEntity.ok(ApiResponse.success(provider));
    }
}
