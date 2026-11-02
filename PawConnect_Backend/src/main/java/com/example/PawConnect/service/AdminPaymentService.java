package com.example.PawConnect.service;

import com.example.PawConnect.dto.response.admin.AdminPaymentRecordResponse;
import com.example.PawConnect.dto.response.admin.AdminPaymentSummaryResponse;
import com.example.PawConnect.model.PaymentStatus;
import com.example.PawConnect.response.PageResponse;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;

public interface AdminPaymentService {

    PageResponse<AdminPaymentRecordResponse> getPayments(
            PaymentStatus status,
            String paymentFor,
            String search,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Pageable pageable
    );

    AdminPaymentSummaryResponse getPaymentSummary();

    AdminPaymentRecordResponse getPaymentById(Long id);

    AdminPaymentRecordResponse refundPaymentByAdmin(String razorpayOrderId, String reason);
}
