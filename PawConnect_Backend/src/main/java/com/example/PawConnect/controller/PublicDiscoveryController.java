package com.example.PawConnect.controller;

import com.example.PawConnect.dto.response.PublicReviewResponse;
import com.example.PawConnect.dto.response.PublicServiceProviderResponse;
import com.example.PawConnect.dto.response.PublicVeterinarianResponse;
import com.example.PawConnect.model.ProviderType;
import com.example.PawConnect.response.ApiResponse;
import com.example.PawConnect.response.PageResponse;
import com.example.PawConnect.service.PublicDiscoveryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicDiscoveryController {

    private final PublicDiscoveryService publicDiscoveryService;

    @GetMapping("/veterinarians")
    public ResponseEntity<ApiResponse<PageResponse<PublicVeterinarianResponse>>> getVeterinarians(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String specialization,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        PageResponse<PublicVeterinarianResponse> vets = publicDiscoveryService.getVeterinarians(search, specialization, pageable);
        return ResponseEntity.ok(ApiResponse.success(vets));
    }

    @GetMapping("/veterinarians/{id}")
    public ResponseEntity<ApiResponse<PublicVeterinarianResponse>> getVeterinarianById(@PathVariable Long id) {
        PublicVeterinarianResponse vet = publicDiscoveryService.getVeterinarianById(id);
        return ResponseEntity.ok(ApiResponse.success(vet));
    }

    @GetMapping("/service-providers")
    public ResponseEntity<ApiResponse<PageResponse<PublicServiceProviderResponse>>> getServiceProviders(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) ProviderType providerType,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        PageResponse<PublicServiceProviderResponse> providers = publicDiscoveryService.getServiceProviders(search, providerType, pageable);
        return ResponseEntity.ok(ApiResponse.success(providers));
    }

    @GetMapping("/service-providers/{id}")
    public ResponseEntity<ApiResponse<PublicServiceProviderResponse>> getServiceProviderById(@PathVariable Long id) {
        PublicServiceProviderResponse provider = publicDiscoveryService.getServiceProviderById(id);
        return ResponseEntity.ok(ApiResponse.success(provider));
    }

    @GetMapping("/reviews")
    public ResponseEntity<ApiResponse<PageResponse<PublicReviewResponse>>> getReviews(
            @RequestParam(required = false) Long veterinarianId,
            @RequestParam(required = false) Long providerId,
            @RequestParam(required = false) Long productId,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        PageResponse<PublicReviewResponse> reviews = publicDiscoveryService.getReviews(veterinarianId, providerId, productId, pageable);
        return ResponseEntity.ok(ApiResponse.success(reviews));
    }
}
