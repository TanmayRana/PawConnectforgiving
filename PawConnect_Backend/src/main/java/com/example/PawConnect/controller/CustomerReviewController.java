package com.example.PawConnect.controller;

import com.example.PawConnect.dto.request.CreateReviewRequest;
import com.example.PawConnect.dto.response.PublicReviewResponse;
import com.example.PawConnect.response.ApiResponse;
import com.example.PawConnect.service.PublicDiscoveryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class CustomerReviewController {

    private final PublicDiscoveryService publicDiscoveryService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PublicReviewResponse>> submitReview(
            @Valid @RequestBody CreateReviewRequest request
    ) {
        PublicReviewResponse review = publicDiscoveryService.submitReview(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(review, "Review submitted successfully"));
    }
}
