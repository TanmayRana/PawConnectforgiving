package com.example.PawConnect.service.impl;

import com.example.PawConnect.dto.response.admin.DashboardSummaryResponse;
import com.example.PawConnect.model.*;
import com.example.PawConnect.repository.*;
import com.example.PawConnect.service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminDashboardServiceImpl implements AdminDashboardService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final VeterinarianRepository veterinarianRepository;
    private final ServiceProviderRepository serviceProviderRepository;
    private final AppointmentRepository appointmentRepository;
    private final ServiceBookingRepository serviceBookingRepository;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final ProductRepository productRepository;
    private final ReportRepository reportRepository;

    @Override
    @Transactional(readOnly = true)
    public DashboardSummaryResponse getDashboardSummary() {
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByStatus(UserStatus.ACTIVE);
        long petOwnerCount = userRoleRepository.countByRoleCode("PET_OWNER");
        long vetCount = userRoleRepository.countByRoleCode("VETERINARIAN");
        long serviceProviderCount = userRoleRepository.countByRoleCode("SERVICE_PROVIDER");

        long pendingVetVerifications = veterinarianRepository.countByVerificationStatus(VeterinarianVerificationStatus.PENDING);
        long pendingProviderVerifications = serviceProviderRepository.countByVerificationStatus(ServiceProviderVerificationStatus.PENDING);
        long activeVets = veterinarianRepository.countByIsActiveTrueAndVerificationStatus(VeterinarianVerificationStatus.APPROVED);
        long activeProviders = serviceProviderRepository.countByIsActiveTrueAndVerificationStatus(ServiceProviderVerificationStatus.APPROVED);

        long totalAppointments = appointmentRepository.count();
        long totalServiceBookings = serviceBookingRepository.count();
        long totalOrders = orderRepository.count();

        BigDecimal totalPaidRevenue = paymentRepository.calculateTotalSuccessfulRevenue();
        long pendingPaymentCount = paymentRepository.countByStatus(PaymentStatus.PENDING);
        long failedPaymentCount = paymentRepository.countByStatus(PaymentStatus.FAILED);

        long activeProductCount = productRepository.countByIsActiveTrueAndStatus(ProductStatus.ACTIVE);
        long lowStockProductCount = productRepository.countByIsActiveTrueAndStockQuantityLessThanEqual(5);

        long openReportCount = reportRepository.countByStatusIn(List.of(ReportStatus.OPEN, ReportStatus.UNDER_REVIEW));

        return DashboardSummaryResponse.builder()
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .petOwnerCount(petOwnerCount)
                .vetCount(vetCount)
                .serviceProviderCount(serviceProviderCount)
                .pendingVetVerifications(pendingVetVerifications)
                .pendingProviderVerifications(pendingProviderVerifications)
                .activeVets(activeVets)
                .activeProviders(activeProviders)
                .totalAppointments(totalAppointments)
                .totalServiceBookings(totalServiceBookings)
                .totalOrders(totalOrders)
                .totalPaidRevenue(totalPaidRevenue != null ? totalPaidRevenue : BigDecimal.ZERO)
                .pendingPaymentCount(pendingPaymentCount)
                .failedPaymentCount(failedPaymentCount)
                .activeProductCount(activeProductCount)
                .lowStockProductCount(lowStockProductCount)
                .openReportCount(openReportCount)
                .build();
    }
}
