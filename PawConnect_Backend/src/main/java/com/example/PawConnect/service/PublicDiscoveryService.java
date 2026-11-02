package com.example.PawConnect.service;

import com.example.PawConnect.dto.request.CreateReviewRequest;
import com.example.PawConnect.dto.response.PublicReviewResponse;
import com.example.PawConnect.dto.response.PublicServiceProviderResponse;
import com.example.PawConnect.dto.response.PublicVeterinarianResponse;
import com.example.PawConnect.model.ProviderType;
import com.example.PawConnect.response.PageResponse;
import org.springframework.data.domain.Pageable;

public interface PublicDiscoveryService {
    PageResponse<PublicVeterinarianResponse> getVeterinarians(String search, String specialization, Pageable pageable);
    PublicVeterinarianResponse getVeterinarianById(Long id);
    PageResponse<PublicServiceProviderResponse> getServiceProviders(String search, ProviderType providerType, Pageable pageable);
    PublicServiceProviderResponse getServiceProviderById(Long id);
    PageResponse<PublicReviewResponse> getReviews(Long veterinarianId, Long providerId, Long productId, Pageable pageable);
    PublicReviewResponse submitReview(CreateReviewRequest request);
}
