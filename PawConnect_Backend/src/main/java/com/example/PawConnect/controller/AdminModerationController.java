package com.example.PawConnect.controller;

import com.example.PawConnect.dto.request.admin.ReportResolutionRequest;
import com.example.PawConnect.dto.request.admin.ReviewModerationRequest;
import com.example.PawConnect.dto.response.admin.ReportResponse;
import com.example.PawConnect.dto.response.admin.ReviewResponse;
import com.example.PawConnect.model.ReportStatus;
import com.example.PawConnect.model.ReportType;
import com.example.PawConnect.model.ReviewStatus;
import com.example.PawConnect.response.ApiResponse;
import com.example.PawConnect.response.PageResponse;
import com.example.PawConnect.service.AdminModerationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminModerationController {

    private final AdminModerationService adminModerationService;

    // Reviews Moderation
    @GetMapping("/reviews")
    public ResponseEntity<ApiResponse<PageResponse<ReviewResponse>>> getReviews(
            @RequestParam(required = false) ReviewStatus status,
            @RequestParam(required = false) Long userId,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        PageResponse<ReviewResponse> reviews = adminModerationService.getReviews(status, userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(reviews));
    }

    @GetMapping("/reviews/{reviewId}")
    public ResponseEntity<ApiResponse<ReviewResponse>> getReviewById(@PathVariable Long reviewId) {
        ReviewResponse review = adminModerationService.getReviewById(reviewId);
        return ResponseEntity.ok(ApiResponse.success(review));
    }

    @PatchMapping("/reviews/{reviewId}/status")
    public ResponseEntity<ApiResponse<ReviewResponse>> moderateReview(
            @PathVariable Long reviewId,
            @Valid @RequestBody ReviewModerationRequest request
    ) {
        ReviewResponse review = adminModerationService.moderateReview(reviewId, request);
        return ResponseEntity.ok(ApiResponse.success(review));
    }

    // Reports Moderation
    @GetMapping("/reports")
    public ResponseEntity<ApiResponse<PageResponse<ReportResponse>>> getReports(
            @RequestParam(required = false) ReportStatus status,
            @RequestParam(required = false) ReportType reportType,
            @RequestParam(required = false) Long reportedById,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        PageResponse<ReportResponse> reports = adminModerationService.getReports(status, reportType, reportedById, pageable);
        return ResponseEntity.ok(ApiResponse.success(reports));
    }

    @GetMapping("/reports/{reportId}")
    public ResponseEntity<ApiResponse<ReportResponse>> getReportById(@PathVariable Long reportId) {
        ReportResponse report = adminModerationService.getReportById(reportId);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @PatchMapping("/reports/{reportId}/status")
    public ResponseEntity<ApiResponse<ReportResponse>> resolveReport(
            @PathVariable Long reportId,
            @Valid @RequestBody ReportResolutionRequest request
    ) {
        ReportResponse report = adminModerationService.resolveReport(reportId, request);
        return ResponseEntity.ok(ApiResponse.success(report));
    }
}
