package com.example.PawConnect.service;

import com.example.PawConnect.dto.request.admin.ReportResolutionRequest;
import com.example.PawConnect.dto.request.admin.ReviewModerationRequest;
import com.example.PawConnect.dto.response.admin.ReportResponse;
import com.example.PawConnect.dto.response.admin.ReviewResponse;
import com.example.PawConnect.model.ReportStatus;
import com.example.PawConnect.model.ReportType;
import com.example.PawConnect.model.ReviewStatus;
import com.example.PawConnect.response.PageResponse;
import org.springframework.data.domain.Pageable;

public interface AdminModerationService {

    PageResponse<ReviewResponse> getReviews(
            ReviewStatus status,
            Long userId,
            Pageable pageable
    );

    ReviewResponse getReviewById(Long reviewId);

    ReviewResponse moderateReview(Long reviewId, ReviewModerationRequest request);

    PageResponse<ReportResponse> getReports(
            ReportStatus status,
            ReportType reportType,
            Long reportedById,
            Pageable pageable
    );

    ReportResponse getReportById(Long reportId);

    ReportResponse resolveReport(Long reportId, ReportResolutionRequest request);
}
