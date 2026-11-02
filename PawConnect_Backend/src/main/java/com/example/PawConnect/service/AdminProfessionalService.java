package com.example.PawConnect.service;

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
import com.example.PawConnect.response.PageResponse;
import org.springframework.data.domain.Pageable;

public interface AdminProfessionalService {

    void requestVeterinarianEmailOtp(IssueUserPasswordRequest request);

    void verifyVeterinarianEmailOtp(VerifyOtpRequest request);

    AdminVeterinarianResponse createVeterinarian(AdminCreateVeterinarianRequest request);

    PageResponse<AdminVeterinarianResponse> getVeterinarians(
            VeterinarianVerificationStatus verificationStatus,
            Boolean isActive,
            String search,
            Pageable pageable
    );

    AdminVeterinarianResponse getVeterinarianById(Long veterinarianId);

    AdminVeterinarianResponse updateVeterinarianVerification(Long veterinarianId, VerificationRequest request);

    AdminVeterinarianResponse updateVeterinarianStatus(Long veterinarianId, UpdateEntityStatusRequest request);

    void requestServiceProviderEmailOtp(IssueUserPasswordRequest request);

    void verifyServiceProviderEmailOtp(VerifyOtpRequest request);

    AdminServiceProviderResponse createServiceProvider(AdminCreateServiceProviderRequest request);

    PageResponse<AdminServiceProviderResponse> getServiceProviders(
            ServiceProviderVerificationStatus verificationStatus,
            Boolean isActive,
            ProviderType providerType,
            String search,
            Pageable pageable
    );

    AdminServiceProviderResponse getServiceProviderById(Long providerId);

    AdminServiceProviderResponse updateServiceProviderVerification(Long providerId, VerificationRequest request);

    AdminServiceProviderResponse updateServiceProviderStatus(Long providerId, UpdateEntityStatusRequest request);
}
