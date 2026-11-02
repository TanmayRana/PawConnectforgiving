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
public class DashboardSummaryResponse {

    private Long totalUsers;
    private Long activeUsers;
    private Long petOwnerCount;
    private Long vetCount;
    private Long serviceProviderCount;
    private Long pendingVetVerifications;
    private Long pendingProviderVerifications;
    private Long activeVets;
    private Long activeProviders;
    private Long totalAppointments;
    private Long totalServiceBookings;
    private Long totalOrders;
    private BigDecimal totalPaidRevenue;
    private Long pendingPaymentCount;
    private Long failedPaymentCount;
    private Long activeProductCount;
    private Long lowStockProductCount;
    private Long openReportCount;
}
