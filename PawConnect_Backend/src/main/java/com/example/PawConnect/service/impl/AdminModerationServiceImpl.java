package com.example.PawConnect.service.impl;

import com.example.PawConnect.dto.request.admin.ReportResolutionRequest;
import com.example.PawConnect.dto.request.admin.ReviewModerationRequest;
import com.example.PawConnect.dto.response.admin.ReportResponse;
import com.example.PawConnect.dto.response.admin.ReviewResponse;
import com.example.PawConnect.exception.ResourceNotFoundException;
import com.example.PawConnect.model.*;
import com.example.PawConnect.repository.ReportRepository;
import com.example.PawConnect.repository.ReviewRepository;
import com.example.PawConnect.response.PageResponse;
import com.example.PawConnect.service.AdminModerationService;
import com.example.PawConnect.service.AuditLogService;
import com.example.PawConnect.service.CurrentUserService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminModerationServiceImpl implements AdminModerationService {

    private final ReviewRepository reviewRepository;
    private final ReportRepository reportRepository;
    private final CurrentUserService currentUserService;
    private final AuditLogService auditLogService;

    private static final Set<String> ALLOWED_REVIEW_SORTS = Set.of("id", "rating", "createdAt", "status");
    private static final Set<String> ALLOWED_REPORT_SORTS = Set.of("id", "createdAt", "status", "reportType");
    private static final int MAX_PAGE_SIZE = 100;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReviewResponse> getReviews(ReviewStatus status, Long userId, Pageable pageable) {
        Pageable sanitized = sanitizePageable(pageable, ALLOWED_REVIEW_SORTS);

        Specification<Review> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (userId != null) {
                predicates.add(cb.equal(root.get("user").get("id"), userId));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Review> page = reviewRepository.findAll(spec, sanitized);
        return PageResponse.from(page.map(this::mapReview));
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewResponse getReviewById(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + reviewId));
        return mapReview(review);
    }

    @Override
    @Transactional
    public ReviewResponse moderateReview(Long reviewId, ReviewModerationRequest request) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + reviewId));

        ReviewStatus oldStatus = review.getStatus();
        review.setStatus(request.getStatus());
        Review saved = reviewRepository.save(review);

        // Audit log
        String oldSnapshot = "{\"status\":\"" + oldStatus + "\"}";
        String newSnapshot = "{\"status\":\"" + request.getStatus() + "\",\"note\":\"" + (request.getModerationNote() != null ? request.getModerationNote() : "") + "\"}";
        auditLogService.logAction(
                "REVIEW_MODERATED",
                "MODERATION",
                "REVIEW",
                reviewId,
                oldSnapshot,
                newSnapshot
        );

        log.info("Admin moderated review {} to status {}", reviewId, request.getStatus());
        return mapReview(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReportResponse> getReports(ReportStatus status, ReportType reportType, Long reportedById, Pageable pageable) {
        Pageable sanitized = sanitizePageable(pageable, ALLOWED_REPORT_SORTS);

        Specification<Report> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (reportType != null) {
                predicates.add(cb.equal(root.get("reportType"), reportType));
            }
            if (reportedById != null) {
                predicates.add(cb.equal(root.get("reportedBy").get("id"), reportedById));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Report> page = reportRepository.findAll(spec, sanitized);
        return PageResponse.from(page.map(this::mapReport));
    }

    @Override
    @Transactional(readOnly = true)
    public ReportResponse getReportById(Long reportId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found with id: " + reportId));
        return mapReport(report);
    }

    @Override
    @Transactional
    public ReportResponse resolveReport(Long reportId, ReportResolutionRequest request) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found with id: " + reportId));

        ReportStatus oldStatus = report.getStatus();
        report.setStatus(request.getStatus());
        report.setResolutionNote(request.getResolutionNote());

        if (request.getStatus() == ReportStatus.RESOLVED || request.getStatus() == ReportStatus.REJECTED) {
            report.setResolvedAt(LocalDateTime.now());
        }

        try {
            User admin = currentUserService.getCurrentUser();
            report.setAssignedTo(admin);
        } catch (Exception e) {
            log.debug("Current user could not be attached as assignedTo for report: {}", e.getMessage());
        }

        Report saved = reportRepository.save(report);

        // Audit log
        String oldSnapshot = "{\"status\":\"" + oldStatus + "\"}";
        String newSnapshot = "{\"status\":\"" + request.getStatus() + "\",\"resolutionNote\":\"" + request.getResolutionNote() + "\"}";
        auditLogService.logAction(
                "REPORT_RESOLVED",
                "MODERATION",
                "REPORT",
                reportId,
                oldSnapshot,
                newSnapshot
        );

        log.info("Admin resolved report {} with status {}", reportId, request.getStatus());
        return mapReport(saved);
    }

    private ReviewResponse mapReview(Review r) {
        Long userId = r.getUser() != null ? r.getUser().getId() : null;
        String userName = null;
        String userEmail = null;
        if (r.getUser() != null) {
            userEmail = r.getUser().getEmail();
            String f = r.getUser().getFirstName() != null ? r.getUser().getFirstName() : "";
            String l = r.getUser().getLastName() != null ? r.getUser().getLastName() : "";
            userName = (f + " " + l).trim();
        }

        return ReviewResponse.builder()
                .id(r.getId())
                .userId(userId)
                .userName(userName)
                .userEmail(userEmail)
                .appointmentId(r.getAppointment() != null ? r.getAppointment().getId() : null)
                .serviceBookingId(r.getServiceBooking() != null ? r.getServiceBooking().getId() : null)
                .orderItemId(r.getOrderItem() != null ? r.getOrderItem().getId() : null)
                .rating(r.getRating())
                .reviewText(r.getReviewText())
                .status(r.getStatus())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }

    private ReportResponse mapReport(Report rep) {
        Long repById = rep.getReportedBy() != null ? rep.getReportedBy().getId() : null;
        String repByName = null;
        String repByEmail = null;
        if (rep.getReportedBy() != null) {
            repByEmail = rep.getReportedBy().getEmail();
            String f = rep.getReportedBy().getFirstName() != null ? rep.getReportedBy().getFirstName() : "";
            String l = rep.getReportedBy().getLastName() != null ? rep.getReportedBy().getLastName() : "";
            repByName = (f + " " + l).trim();
        }

        Long assId = rep.getAssignedTo() != null ? rep.getAssignedTo().getId() : null;
        String assName = null;
        if (rep.getAssignedTo() != null) {
            String f = rep.getAssignedTo().getFirstName() != null ? rep.getAssignedTo().getFirstName() : "";
            String l = rep.getAssignedTo().getLastName() != null ? rep.getAssignedTo().getLastName() : "";
            assName = (f + " " + l).trim();
        }

        return ReportResponse.builder()
                .id(rep.getId())
                .reportedById(repById)
                .reportedByName(repByName)
                .reportedByEmail(repByEmail)
                .reportType(rep.getReportType())
                .targetType(rep.getTargetType())
                .targetId(rep.getTargetId())
                .reason(rep.getReason())
                .description(rep.getDescription())
                .status(rep.getStatus())
                .assignedToId(assId)
                .assignedToName(assName)
                .resolutionNote(rep.getResolutionNote())
                .resolvedAt(rep.getResolvedAt())
                .createdAt(rep.getCreatedAt())
                .build();
    }

    private Pageable sanitizePageable(Pageable pageable, Set<String> allowedSorts) {
        int page = Math.max(0, pageable.getPageNumber());
        int size = Math.min(MAX_PAGE_SIZE, Math.max(1, pageable.getPageSize()));

        List<Sort.Order> validOrders = new ArrayList<>();
        for (Sort.Order order : pageable.getSort()) {
            if (!allowedSorts.contains(order.getProperty())) {
                throw new IllegalArgumentException(String.format(
                        "Invalid sort field '%s'. Allowed sort fields are: %s",
                        order.getProperty(), allowedSorts
                ));
            }
            validOrders.add(order);
        }

        Sort sort = validOrders.isEmpty()
                ? Sort.by(Sort.Direction.DESC, "createdAt")
                : Sort.by(validOrders);

        return PageRequest.of(page, size, sort);
    }
}
