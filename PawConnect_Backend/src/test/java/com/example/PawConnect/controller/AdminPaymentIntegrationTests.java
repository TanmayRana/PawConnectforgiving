package com.example.PawConnect.controller;

import com.example.PawConnect.config.RequestIdFilter;
import com.example.PawConnect.dto.request.payment.AdminRefundPaymentRequest;
import com.example.PawConnect.model.*;
import com.example.PawConnect.repository.*;
import com.example.PawConnect.security.JwtService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.FilterChainProxy;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
class AdminPaymentIntegrationTests {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private FilterChainProxy springSecurityFilterChain;

    @Autowired
    private RequestIdFilter requestIdFilter;

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private PaymentOrderRepository paymentOrderRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private User adminUser;
    private String adminAuthHeader;

    private User customerUser;
    private String customerAuthHeader;

    private PaymentOrder paidOrder;
    private PaymentOrder pendingOrder;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .addFilter(requestIdFilter)
                .addFilter(springSecurityFilterChain)
                .build();

        cleanup();

        Role adminRole = roleRepository.findByRoleCode("ADMIN").orElseGet(() ->
                roleRepository.save(Role.builder().roleCode("ADMIN").roleName("Admin").build()));
        Role customerRole = roleRepository.findByRoleCode("PET_OWNER").orElseGet(() ->
                roleRepository.save(Role.builder().roleCode("PET_OWNER").roleName("Pet Owner").build()));

        long suffix = System.currentTimeMillis() % 100000000;

        adminUser = userRepository.save(User.builder()
                .firstName("Ledger")
                .lastName("Admin")
                .email("ledger_admin_" + suffix + "@test.com")
                .phone("9" + String.format("%09d", suffix))
                .passwordHash(passwordEncoder.encode("AdminPass123!"))
                .status(UserStatus.ACTIVE)
                .tokenVersion(1)
                .build());
        userRoleRepository.save(UserRole.builder().user(adminUser).role(adminRole).build());
        adminAuthHeader = "Bearer " + jwtService.generateAccessToken(adminUser, List.of("ROLE_ADMIN"));

        customerUser = userRepository.save(User.builder()
                .firstName("Sayan")
                .lastName("Customer")
                .email("sayan_customer_" + suffix + "@test.com")
                .phone("8" + String.format("%09d", suffix))
                .passwordHash(passwordEncoder.encode("CustPass123!"))
                .status(UserStatus.ACTIVE)
                .tokenVersion(1)
                .build());
        userRoleRepository.save(UserRole.builder().user(customerUser).role(customerRole).build());
        customerAuthHeader = "Bearer " + jwtService.generateAccessToken(customerUser, List.of("ROLE_PET_OWNER"));

        // Seed test payment orders
        paidOrder = paymentOrderRepository.save(PaymentOrder.builder()
                .userId(customerUser.getId())
                .orderId(101L)
                .amountInPaise(149900L)
                .currency("INR")
                .status(PaymentStatus.PAID)
                .razorpayOrderId("order_test_admin_ledger_001")
                .razorpayPaymentId("pay_test_admin_ledger_001")
                .signatureVerified(true)
                .build());

        paymentRepository.save(Payment.builder()
                .user(customerUser)
                .gatewayOrderId(paidOrder.getRazorpayOrderId())
                .gatewayPaymentId(paidOrder.getRazorpayPaymentId())
                .paymentFor(PaymentFor.ORDER)
                .referenceId(101L)
                .paymentMethod("UPI")
                .amount(new BigDecimal("1499.00"))
                .status(PaymentStatus.PAID)
                .paymentReference("PAY-LEDGER-001")
                .build());

        pendingOrder = paymentOrderRepository.save(PaymentOrder.builder()
                .userId(customerUser.getId())
                .bookingId(202L)
                .bookingType("VETERINARY")
                .amountInPaise(75000L)
                .currency("INR")
                .status(PaymentStatus.PENDING)
                .razorpayOrderId("order_test_admin_ledger_002")
                .signatureVerified(false)
                .build());
    }

    @AfterEach
    void tearDown() {
        cleanup();
    }

    private void cleanup() {
        paymentRepository.deleteAll();
        paymentOrderRepository.deleteAll();
        orderRepository.deleteAll();
        auditLogRepository.deleteAll();
        userRoleRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("GET /api/admin/payments should return paginated transactions for admin")
    void getPayments_returnsPaginatedList() throws Exception {
        mockMvc.perform(get("/api/admin/payments")
                        .header("Authorization", adminAuthHeader)
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content", hasSize(2)))
                .andExpect(jsonPath("$.data.totalElements").value(2))
                .andExpect(jsonPath("$.data.content[0].customerName").value("Sayan Customer"));
    }

    @Test
    @DisplayName("GET /api/admin/payments with status filter should filter appropriately")
    void getPayments_filteredByStatus() throws Exception {
        mockMvc.perform(get("/api/admin/payments")
                        .header("Authorization", adminAuthHeader)
                        .param("status", "PAID"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].razorpayOrderId").value("order_test_admin_ledger_001"))
                .andExpect(jsonPath("$.data.content[0].status").value("PAID"));
    }

    @Test
    @DisplayName("GET /api/admin/payments/summary should return accurate KPI metrics")
    void getPaymentSummary_returnsCorrectMetrics() throws Exception {
        mockMvc.perform(get("/api/admin/payments/summary")
                        .header("Authorization", adminAuthHeader))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalTransactions").value(2))
                .andExpect(jsonPath("$.data.successfulCount").value(1))
                .andExpect(jsonPath("$.data.pendingCount").value(1))
                .andExpect(jsonPath("$.data.totalRevenue").value(1499.00));
    }

    @Test
    @DisplayName("GET /api/admin/payments/{id} should return full transaction detail")
    void getPaymentById_returnsAuditDetails() throws Exception {
        mockMvc.perform(get("/api/admin/payments/{id}", paidOrder.getId())
                        .header("Authorization", adminAuthHeader))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(paidOrder.getId()))
                .andExpect(jsonPath("$.data.razorpayOrderId").value("order_test_admin_ledger_001"))
                .andExpect(jsonPath("$.data.signatureVerified").value(true))
                .andExpect(jsonPath("$.data.paymentMethod").value("UPI"));
    }

    @Test
    @DisplayName("POST /api/admin/payments/{razorpayOrderId}/refund executes admin refund and records audit log")
    void refundPayment_asAdmin_success() throws Exception {
        AdminRefundPaymentRequest request = new AdminRefundPaymentRequest();
        request.setReason("Admin granted customer refund request");

        mockMvc.perform(post("/api/admin/payments/{razorpayOrderId}/refund", paidOrder.getRazorpayOrderId())
                        .header("Authorization", adminAuthHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("REFUNDED"))
                .andExpect(jsonPath("$.data.refundReason", containsString("Admin granted customer refund request")));

        // Verify AuditLog was recorded
        boolean auditRecorded = auditLogRepository.findAll().stream()
                .anyMatch(log -> "PAYMENT".equalsIgnoreCase(log.getModule()) && "ADMIN_REFUND".equalsIgnoreCase(log.getAction()));
        assertTrue(auditRecorded, "An audit log record must be stored for admin payment refunds");
    }

    @Test
    @DisplayName("Regular user without ADMIN role should be forbidden from accessing admin payments")
    void regularUser_forbidden() throws Exception {
        mockMvc.perform(get("/api/admin/payments")
                        .header("Authorization", customerAuthHeader))
                .andExpect(status().isForbidden());
    }
}
