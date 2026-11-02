package com.example.PawConnect.controller;

import com.example.PawConnect.dto.request.payment.AdminRefundPaymentRequest;
import com.example.PawConnect.dto.response.admin.AdminPaymentRecordResponse;
import com.example.PawConnect.dto.response.admin.AdminPaymentSummaryResponse;
import com.example.PawConnect.model.PaymentStatus;
import com.example.PawConnect.response.ApiResponse;
import com.example.PawConnect.response.PageResponse;
import com.example.PawConnect.service.AdminPaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/admin/payments")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Payments", description = "Admin financial ledger, transaction tracking, summary KPIs, and refunds")
public class AdminPaymentController {

    private final AdminPaymentService adminPaymentService;

    public AdminPaymentController(AdminPaymentService adminPaymentService) {
        this.adminPaymentService = adminPaymentService;
    }

    @GetMapping
    @Operation(summary = "Get paginated, filtered transaction history for the admin ledger")
    public ResponseEntity<ApiResponse<PageResponse<AdminPaymentRecordResponse>>> getPayments(
            @RequestParam(required = false) PaymentStatus status,
            @RequestParam(required = false) String paymentFor,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        PageResponse<AdminPaymentRecordResponse> payments = adminPaymentService.getPayments(
                status, paymentFor, search, startDate, endDate, pageable
        );
        return ResponseEntity.ok(ApiResponse.success(payments));
    }

    @GetMapping("/summary")
    @Operation(summary = "Get KPI summary metrics for revenue, volume, and payment states")
    public ResponseEntity<ApiResponse<AdminPaymentSummaryResponse>> getPaymentSummary() {
        AdminPaymentSummaryResponse summary = adminPaymentService.getPaymentSummary();
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get detailed audit view of a single payment transaction")
    public ResponseEntity<ApiResponse<AdminPaymentRecordResponse>> getPaymentById(@PathVariable Long id) {
        AdminPaymentRecordResponse payment = adminPaymentService.getPaymentById(id);
        return ResponseEntity.ok(ApiResponse.success(payment));
    }

    @PostMapping("/{razorpayOrderId}/refund")
    @Operation(summary = "Execute an immediate gateway refund for a paid order")
    public ResponseEntity<ApiResponse<AdminPaymentRecordResponse>> refundPayment(
            @PathVariable String razorpayOrderId,
            @RequestBody(required = false) AdminRefundPaymentRequest request,
            @RequestParam(required = false) String reason
    ) {
        String finalReason = (request != null && request.getReason() != null && !request.getReason().isBlank())
                ? request.getReason()
                : (reason != null && !reason.isBlank() ? reason : "Administrative refund executed via Admin Console");

        AdminPaymentRecordResponse refunded = adminPaymentService.refundPaymentByAdmin(razorpayOrderId, finalReason);
        return ResponseEntity.ok(ApiResponse.ok(refunded, "Payment successfully refunded"));
    }
}
