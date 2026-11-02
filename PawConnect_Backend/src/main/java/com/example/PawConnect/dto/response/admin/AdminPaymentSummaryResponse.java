package com.example.PawConnect.dto.response.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminPaymentSummaryResponse {

    private BigDecimal totalRevenue;
    private long totalTransactions;
    private long successfulCount;
    private long pendingCount;
    private long failedCount;
    private long refundedCount;
    private BigDecimal totalRefundedAmount;
}
