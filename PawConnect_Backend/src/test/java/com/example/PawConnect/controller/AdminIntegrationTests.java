package com.example.PawConnect.controller;

import com.example.PawConnect.config.RequestIdFilter;
import com.example.PawConnect.dto.request.admin.*;
import com.example.PawConnect.model.*;
import com.example.PawConnect.repository.*;
import com.example.PawConnect.security.JwtService;
import com.example.PawConnect.service.impl.DevEmailServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
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
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
class AdminIntegrationTests {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private FilterChainProxy springSecurityFilterChain;

    @Autowired
    private RequestIdFilter requestIdFilter;

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private VeterinarianRepository veterinarianRepository;

    @Autowired
    private ServiceProviderRepository serviceProviderRepository;

    @Autowired
    private PetRepository petRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private ServiceBookingRepository serviceBookingRepository;

    @Autowired
    private ServiceCategoryRepository serviceCategoryRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private PaymentOrderRepository paymentOrderRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private PlatformSettingRepository platformSettingRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private BroadcastAnnouncementRepository broadcastAnnouncementRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private DevEmailServiceImpl devEmailService;

    @Autowired
    private PendingUserPasswordRepository pendingUserPasswordRepository;

    @Autowired
    private JwtService jwtService;

    private User adminUser;
    private String adminToken;

    private User regularUser;
    private String regularToken;

    private Role adminRole;
    private Role petOwnerRole;
    private Role vetRole;
    private Role providerRole;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .addFilters(requestIdFilter, springSecurityFilterChain)
                .build();

        cleanup();

        adminRole = roleRepository.findByRoleCode("ADMIN").orElseGet(() ->
                roleRepository.save(Role.builder().roleCode("ADMIN").roleName("Admin").build()));
        petOwnerRole = roleRepository.findByRoleCode("PET_OWNER").orElseGet(() ->
                roleRepository.save(Role.builder().roleCode("PET_OWNER").roleName("Pet Owner").build()));
        vetRole = roleRepository.findByRoleCode("VETERINARIAN").orElseGet(() ->
                roleRepository.save(Role.builder().roleCode("VETERINARIAN").roleName("Veterinarian").build()));
        providerRole = roleRepository.findByRoleCode("SERVICE_PROVIDER").orElseGet(() ->
                roleRepository.save(Role.builder().roleCode("SERVICE_PROVIDER").roleName("Service Provider").build()));

        adminUser = userRepository.save(User.builder()
                .firstName("Super")
                .lastName("Admin")
                .email("admin@test.com")
                .phone("+911234567890")
                .passwordHash(passwordEncoder.encode("AdminPass123!"))
                .status(UserStatus.ACTIVE)
                .tokenVersion(1)
                .build());
        userRoleRepository.save(UserRole.builder().user(adminUser).role(adminRole).build());
        adminToken = jwtService.generateAccessToken(adminUser, List.of("ROLE_ADMIN"));

        regularUser = userRepository.save(User.builder()
                .firstName("Regular")
                .lastName("User")
                .email("regular@test.com")
                .phone("+919876543210")
                .passwordHash(passwordEncoder.encode("UserPass123!"))
                .status(UserStatus.ACTIVE)
                .tokenVersion(1)
                .build());
        userRoleRepository.save(UserRole.builder().user(regularUser).role(petOwnerRole).build());
        regularToken = jwtService.generateAccessToken(regularUser, List.of("ROLE_PET_OWNER"));
    }

    @AfterEach
    void tearDown() {
        cleanup();
    }

    private void verifyProviderEmail(String email) throws Exception {
        mockMvc.perform(post("/api/admin/service-providers/email-otp")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\"}"))
                .andExpect(status().isOk());

        String body = devEmailService.getLastBody();
        assertNotNull(body);
        String marker = "Code: ";
        int start = body.indexOf(marker);
        assertTrue(start >= 0, "Provider email must include the OTP");
        String otp = body.substring(start + marker.length());
        int lineEnd = otp.indexOf('\n');
        if (lineEnd >= 0) {
            otp = otp.substring(0, lineEnd);
        }
        otp = otp.replace("\r", "").trim();

        mockMvc.perform(post("/api/admin/service-providers/email-otp/verify")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"otp\":\"" + otp + "\"}"))
                .andExpect(status().isOk());
    }

    private void verifyVeterinarianEmail(String email) throws Exception {
        mockMvc.perform(post("/api/admin/veterinarians/email-otp")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\"}"))
                .andExpect(status().isOk());

        String body = devEmailService.getLastBody();
        assertNotNull(body);
        String marker = "Code: ";
        int start = body.indexOf(marker);
        assertTrue(start >= 0, "Veterinarian email must include the OTP");
        String otp = body.substring(start + marker.length());
        int lineEnd = otp.indexOf('\n');
        if (lineEnd >= 0) {
            otp = otp.substring(0, lineEnd);
        }
        otp = otp.replace("\r", "").trim();

        mockMvc.perform(post("/api/admin/veterinarians/email-otp/verify")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"otp\":\"" + otp + "\"}"))
                .andExpect(status().isOk());
    }

    private String emailPasswordTo(String email) throws Exception {
        mockMvc.perform(post("/api/admin/users/password-email")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("Password emailed")));

        String body = devEmailService.getLastBody();
        assertNotNull(body);
        String marker = "Password: ";
        int start = body.indexOf(marker);
        assertTrue(start >= 0, "Password email must include the generated password");
        String value = body.substring(start + marker.length());
        int lineEnd = value.indexOf('\n');
        if (lineEnd >= 0) {
            value = value.substring(0, lineEnd);
        }
        return value.replace("\r", "").trim();
    }

    private void cleanup() {
        pendingUserPasswordRepository.deleteAll();
        devEmailService.reset();
        auditLogRepository.deleteAll();
        reportRepository.deleteAll();
        reviewRepository.deleteAll();
        paymentRepository.deleteAll();
        paymentOrderRepository.deleteAll();
        appointmentRepository.deleteAll();
        serviceBookingRepository.deleteAll();
        serviceRepository.deleteAll();
        serviceCategoryRepository.deleteAll();
        veterinarianRepository.deleteAll();
        serviceProviderRepository.deleteAll();
        petRepository.deleteAll();
        userRoleRepository.deleteAll();
        notificationRepository.deleteAll();
        broadcastAnnouncementRepository.deleteAll();
        userRepository.deleteAll();
        platformSettingRepository.deleteAll();
    }

    // =========================================================================
    // 1. Role Authorization Controls
    // =========================================================================

    @Test
    @DisplayName("Non-ADMIN and unauthenticated callers are rejected with 401 or 403 on admin endpoints")
    void testAdminEndpointsAccessControl() throws Exception {
        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));

        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + regularToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));

        mockMvc.perform(get("/api/admin/dashboard/summary")
                        .header("Authorization", "Bearer " + regularToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    // =========================================================================
    // 2. Administrative User Management
    // =========================================================================

    @Test
    @DisplayName("Admin can list, filter, inspect and update user status with audit logging")
    void testAdminUserManagement() throws Exception {
        // List users
        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("search", "regular")
                        .param("status", "ACTIVE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].email").value("regular@test.com"))
                .andExpect(jsonPath("$.data.content[0].passwordHash").doesNotExist())
                .andExpect(jsonPath("$.data.content[0].tokenVersion").doesNotExist());

        // Get single user
        mockMvc.perform(get("/api/admin/users/{userId}", regularUser.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("regular@test.com"));

        // Update status to BLOCKED
        UpdateUserStatusRequest statusReq = UpdateUserStatusRequest.builder()
                .status(UserStatus.BLOCKED)
                .reason("Suspicious activities detected")
                .build();

        mockMvc.perform(patch("/api/admin/users/{userId}/status", regularUser.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("BLOCKED"));

        // Verify audit log created
        List<AuditLog> logs = auditLogRepository.findAll();
        assertFalse(logs.isEmpty());
        assertTrue(logs.stream().anyMatch(l -> "USER_STATUS_UPDATED".equals(l.getAction())));
    }

    @Test
    @DisplayName("Admin cannot deactivate the last active administrator")
    void testLastActiveAdminProtection() throws Exception {
        UpdateUserStatusRequest deactiveReq = UpdateUserStatusRequest.builder()
                .status(UserStatus.INACTIVE)
                .reason("Self-deactivation attempt")
                .build();

        mockMvc.perform(patch("/api/admin/users/{userId}/status", adminUser.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(deactiveReq)))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.code").value("BUSINESS_RULE_VIOLATION"))
                .andExpect(jsonPath("$.message", containsString("Cannot deactivate or block the last active administrator")));
    }

    @Test
    @DisplayName("Admin can create new user with valid roles")
    void testAdminCreateUser() throws Exception {
        String issuedPassword = emailPasswordTo("newcustomer@test.com");

        CreateUserRequest createReq = CreateUserRequest.builder()
                .firstName("New")
                .lastName("Customer")
                .email("newcustomer@test.com")
                .phone("+911122334455")
                .password("WrongPass123!")
                .status(UserStatus.ACTIVE)
                .roleCodes(List.of("PET_OWNER"))
                .build();

        mockMvc.perform(post("/api/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.message", containsString("does not match")));

        createReq.setPassword(issuedPassword);

        mockMvc.perform(post("/api/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.email").value("newcustomer@test.com"))
                .andExpect(jsonPath("$.data.roles", hasItem("PET_OWNER")));
    }

    // =========================================================================
    // 3. Professional Administration (Veterinarian & Service Provider)
    // =========================================================================

    @Test
    @DisplayName("Admin can manage veterinarian verification and active status")
    void testVeterinarianAdministration() throws Exception {
        User vetUser = userRepository.save(User.builder()
                .firstName("Dr. John")
                .lastName("Doe")
                .email("dr.john@test.com")
                .phone("+917788990011")
                .passwordHash(passwordEncoder.encode("VetPass123!"))
                .status(UserStatus.ACTIVE)
                .build());
        userRoleRepository.save(UserRole.builder().user(vetUser).role(vetRole).build());

        Veterinarian vet = veterinarianRepository.save(Veterinarian.builder()
                .user(vetUser)
                .specialization("Canine Surgery")
                .licenseNumber("VET-LIC-1001")
                .clinicName("Pet Care Clinic")
                .consultationFee(new BigDecimal("500.00"))
                .verificationStatus(VeterinarianVerificationStatus.PENDING)
                .isActive(false)
                .build());

        // List veterinarians
        mockMvc.perform(get("/api/admin/veterinarians")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("verificationStatus", "PENDING"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].licenseNumber").value("VET-LIC-1001"));

        // Approve verification
        VerificationRequest approveReq = VerificationRequest.builder()
                .approved(true)
                .build();

        mockMvc.perform(patch("/api/admin/veterinarians/{id}/verification", vet.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(approveReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.verificationStatus").value("APPROVED"));

        // Toggle active status
        UpdateEntityStatusRequest statusReq = UpdateEntityStatusRequest.builder()
                .isActive(true)
                .reason("Profile verified and ready for bookings")
                .build();

        mockMvc.perform(patch("/api/admin/veterinarians/{id}/status", vet.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isActive").value(true));

        // Verify audit logs
        List<AuditLog> logs = auditLogRepository.findAll();
        assertTrue(logs.stream().anyMatch(l -> "PROFESSIONAL_VERIFICATION_UPDATED".equals(l.getAction())));
        assertTrue(logs.stream().anyMatch(l -> "PROFESSIONAL_STATUS_UPDATED".equals(l.getAction())));
    }

    @Test
    @DisplayName("Admin can manage service provider verification and status")
    void testServiceProviderAdministration() throws Exception {
        User provUser = userRepository.save(User.builder()
                .firstName("Pro")
                .lastName("Groomer")
                .email("groomer@test.com")
                .phone("+918899001122")
                .passwordHash(passwordEncoder.encode("GroomerPass123!"))
                .status(UserStatus.ACTIVE)
                .build());
        userRoleRepository.save(UserRole.builder().user(provUser).role(providerRole).build());

        ServiceProvider provider = serviceProviderRepository.save(ServiceProvider.builder()
                .user(provUser)
                .providerType(ProviderType.GROOMER)
                .businessName("Furry Spa")
                .phone("+918899001122")
                .address("123 Pet St")
                .verificationStatus(ServiceProviderVerificationStatus.PENDING)
                .isActive(false)
                .build());

        // Reject verification with reason
        VerificationRequest rejectReq = VerificationRequest.builder()
                .approved(false)
                .rejectionReason("Invalid business registration document")
                .build();

        mockMvc.perform(patch("/api/admin/service-providers/{id}/verification", provider.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rejectReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.verificationStatus").value("REJECTED"));
    }

    // =========================================================================
    // 4. Booking & Payment Oversight
    // =========================================================================

    @Test
    @DisplayName("Admin can list and inspect appointments, service bookings, and payments")
    void testBookingAndPaymentOversight() throws Exception {
        Pet pet = petRepository.save(Pet.builder()
                .owner(regularUser)
                .name("Buddy")
                .species("DOG")
                .breed("Golden Retriever")
                .gender(PetGender.MALE)
                .dateOfBirth(LocalDate.now().minusYears(2))
                .status(PetStatus.ACTIVE)
                .build());

        User vetUser = userRepository.save(User.builder()
                .firstName("Dr. Vet")
                .lastName("Smith")
                .email("dr.vet@test.com")
                .passwordHash(passwordEncoder.encode("VetPass123!"))
                .status(UserStatus.ACTIVE)
                .build());
        Veterinarian vet = veterinarianRepository.save(Veterinarian.builder()
                .user(vetUser)
                .licenseNumber("VET-LIC-2002")
                .consultationFee(new BigDecimal("400.00"))
                .verificationStatus(VeterinarianVerificationStatus.APPROVED)
                .isActive(true)
                .build());

        Appointment appt = appointmentRepository.save(Appointment.builder()
                .appointmentNo("APPT-20261010-001")
                .pet(pet)
                .veterinarian(vet)
                .appointmentDate(LocalDate.now().plusDays(2))
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(10, 30))
                .consultationFee(new BigDecimal("400.00"))
                .status(AppointmentStatus.CONFIRMED)
                .reason("Routine checkup")
                .build());

        paymentOrderRepository.save(PaymentOrder.builder()
                .userId(regularUser.getId())
                .bookingId(appt.getId())
                .bookingType("VETERINARY")
                .amountInPaise(40000L)
                .currency("INR")
                .status(PaymentStatus.SUCCESS)
                .razorpayOrderId("order_rzp_mock123")
                .razorpayPaymentId("pay_rzp_mock123")
                .signatureVerified(true)
                .build());

        paymentRepository.save(Payment.builder()
                .paymentReference("PAY-APPT-001")
                .user(regularUser)
                .paymentFor(PaymentFor.APPOINTMENT)
                .referenceId(appt.getId())
                .amount(new BigDecimal("400.00"))
                .currency("INR")
                .status(PaymentStatus.SUCCESS)
                .gatewayProvider("RAZORPAY")
                .gatewayOrderId("order_rzp_mock123")
                .gatewayPaymentId("pay_rzp_mock123")
                .build());

        // Admin appointments list
        mockMvc.perform(get("/api/admin/appointments")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("status", "CONFIRMED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].appointmentNo").value("APPT-20261010-001"))
                .andExpect(jsonPath("$.data.content[0].petName").value("Buddy"));

        // Admin appointment detail
        mockMvc.perform(get("/api/admin/appointments/{id}", appt.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.appointmentNo").value("APPT-20261010-001"));

        // Admin payments list
        mockMvc.perform(get("/api/admin/payments")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("status", "SUCCESS"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].paymentReference").value("PAY-APPT-001"))
                .andExpect(jsonPath("$.data.content[0].razorpayPaymentId").value("pay_rzp_mock123"))
                .andExpect(jsonPath("$.data.content[0].gatewayPaymentId").value("pay_rzp_mock123"));
    }

    // =========================================================================
    // 5. Review & Report Moderation
    // =========================================================================

    @Test
    @DisplayName("Admin can moderate reviews and resolve user reports")
    void testReviewAndReportModeration() throws Exception {
        Review review = reviewRepository.save(Review.builder()
                .user(regularUser)
                .rating(1)
                .reviewText("Spam comment with abusive words")
                .status(ReviewStatus.REPORTED)
                .build());

        Report report = reportRepository.save(Report.builder()
                .reportedBy(regularUser)
                .reportType(ReportType.REVIEW)
                .targetType("REVIEW")
                .targetId(review.getId())
                .reason("Inappropriate language")
                .status(ReportStatus.OPEN)
                .build());

        // List reviews
        mockMvc.perform(get("/api/admin/reviews")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("status", "REPORTED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].id").value(review.getId()));

        // Moderate review to HIDDEN
        ReviewModerationRequest modReq = ReviewModerationRequest.builder()
                .status(ReviewStatus.HIDDEN)
                .moderationNote("Contains inappropriate language")
                .build();

        mockMvc.perform(patch("/api/admin/reviews/{id}/status", review.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(modReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("HIDDEN"));

        // Resolve report
        ReportResolutionRequest resReq = ReportResolutionRequest.builder()
                .status(ReportStatus.RESOLVED)
                .resolutionNote("Review has been hidden according to community guidelines")
                .build();

        mockMvc.perform(patch("/api/admin/reports/{id}/status", report.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("RESOLVED"))
                .andExpect(jsonPath("$.data.resolutionNote").value("Review has been hidden according to community guidelines"));

        // Verify audit logs for moderation
        List<AuditLog> logs = auditLogRepository.findAll();
        assertTrue(logs.stream().anyMatch(l -> "REVIEW_MODERATED".equals(l.getAction())));
        assertTrue(logs.stream().anyMatch(l -> "REPORT_RESOLVED".equals(l.getAction())));
    }

    // =========================================================================
    // 6. Platform Settings
    // =========================================================================

    @Test
    @DisplayName("Admin can read and update platform settings with strict validation and protection")
    void testPlatformSettingsManagement() throws Exception {
        platformSettingRepository.save(PlatformSetting.builder()
                .settingKey("tax_rate")
                .settingValue("5.00")
                .description("GST Percentage")
                .build());

        // Get setting
        mockMvc.perform(get("/api/admin/settings/{key}", "tax_rate")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.settingKey").value("tax_rate"))
                .andExpect(jsonPath("$.data.settingValue").value("5.00"));

        // Update setting successfully
        PlatformSettingRequest updateReq = PlatformSettingRequest.builder()
                .settingKey("tax_rate")
                .settingValue("18.00")
                .description("Updated GST Rate")
                .build();

        mockMvc.perform(put("/api/admin/settings/{key}", "tax_rate")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.settingValue").value("18.00"));

        // Attempt unsupported key
        PlatformSettingRequest invalidKeyReq = PlatformSettingRequest.builder()
                .settingKey("unknown_setting")
                .settingValue("some_value")
                .build();

        mockMvc.perform(put("/api/admin/settings/{key}", "unknown_setting")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidKeyReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"));

        // Attempt restricted credential injection
        PlatformSettingRequest hackReq = PlatformSettingRequest.builder()
                .settingKey("jwt_secret_override")
                .settingValue("injected_key")
                .build();

        mockMvc.perform(put("/api/admin/settings/{key}", "jwt_secret_override")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(hackReq)))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.code").value("BUSINESS_RULE_VIOLATION"));
    }

    // =========================================================================
    // 7. Audit Log APIs
    // =========================================================================

    @Test
    @DisplayName("Admin can list and view audit logs with filters")
    void testAuditLogAPIs() throws Exception {
        auditLogRepository.save(AuditLog.builder()
                .user(adminUser)
                .action("USER_STATUS_UPDATED")
                .module("USER_MANAGEMENT")
                .entityType("USER")
                .entityId(regularUser.getId())
                .oldData("{\"status\":\"ACTIVE\"}")
                .newData("{\"status\":\"BLOCKED\"}")
                .ipAddress("127.0.0.1")
                .userAgent("MockMvc-Client")
                .build());

        mockMvc.perform(get("/api/admin/audit-logs")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("module", "USER_MANAGEMENT"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].action").value("USER_STATUS_UPDATED"))
                .andExpect(jsonPath("$.data.content[0].module").value("USER_MANAGEMENT"))
                .andExpect(jsonPath("$.data.content[0].userEmail").value("admin@test.com"));
    }

    // =========================================================================
    // 8. Administrative Dashboard & Summary Reports
    // =========================================================================

    @Test
    @DisplayName("Admin dashboard summary calculates accurate database metrics")
    void testAdminDashboardSummary() throws Exception {
        paymentRepository.save(Payment.builder()
                .paymentReference("PAY-DASH-001")
                .user(regularUser)
                .paymentFor(PaymentFor.ORDER)
                .referenceId(101L)
                .amount(new BigDecimal("1500.00"))
                .currency("INR")
                .status(PaymentStatus.SUCCESS)
                .build());

        paymentRepository.save(Payment.builder()
                .paymentReference("PAY-DASH-002")
                .user(regularUser)
                .paymentFor(PaymentFor.ORDER)
                .referenceId(102L)
                .amount(new BigDecimal("500.00"))
                .currency("INR")
                .status(PaymentStatus.FAILED)
                .build());

        mockMvc.perform(get("/api/admin/dashboard/summary")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalUsers").value(2))
                .andExpect(jsonPath("$.data.activeUsers").value(2))
                .andExpect(jsonPath("$.data.petOwnerCount").value(1))
                .andExpect(jsonPath("$.data.totalPaidRevenue").value(1500.00))
                .andExpect(jsonPath("$.data.failedPaymentCount").value(1));
    }

    @Test
    @DisplayName("Platform setting value validation rejects invalid values and ranges")
    void testPlatformSettingValueValidationErrors() throws Exception {
        // Negative tax rate
        PlatformSettingRequest negTaxReq = PlatformSettingRequest.builder()
                .settingKey("tax_rate")
                .settingValue("-5.00")
                .build();

        mockMvc.perform(put("/api/admin/settings/{key}", "tax_rate")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(negTaxReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"));

        // Invalid currency
        PlatformSettingRequest badCurrencyReq = PlatformSettingRequest.builder()
                .settingKey("platform_currency")
                .settingValue("INVALID_CURRENCY")
                .build();

        mockMvc.perform(put("/api/admin/settings/{key}", "platform_currency")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badCurrencyReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"));
    }

    @Test
    @DisplayName("Admin user creation rejects unsupported external roles like SUPER_ADMIN or VENDOR")
    void testUnsupportedRoleAssignmentRejected() throws Exception {
        String issuedPassword = emailPasswordTo("badrole@test.com");
        CreateUserRequest req = CreateUserRequest.builder()
                .firstName("Bad")
                .lastName("Role")
                .email("badrole@test.com")
                .phone("+919988776655")
                .password(issuedPassword)
                .status(UserStatus.ACTIVE)
                .roleCodes(List.of("SUPER_ADMIN"))
                .build();

        mockMvc.perform(post("/api/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.code").value("BUSINESS_RULE_VIOLATION"));
    }

    @Test
    @DisplayName("Non-admin users cannot access audit log endpoints")
    void testAuditLogNonAdminAccessDenied() throws Exception {
        mockMvc.perform(get("/api/admin/audit-logs")
                        .header("Authorization", "Bearer " + regularToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    @DisplayName("Admin can filter and inspect service bookings")
    void testServiceBookingOversightAndFiltering() throws Exception {
        Pet pet = petRepository.save(Pet.builder()
                .owner(regularUser)
                .name("Max")
                .species("DOG")
                .gender(PetGender.MALE)
                .dateOfBirth(LocalDate.now().minusYears(1))
                .status(PetStatus.ACTIVE)
                .build());

        User provUser = userRepository.save(User.builder()
                .firstName("Grooming")
                .lastName("Pro")
                .email("pro@test.com")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .status(UserStatus.ACTIVE)
                .build());

        ServiceProvider provider = serviceProviderRepository.save(ServiceProvider.builder()
                .user(provUser)
                .providerType(ProviderType.GROOMER)
                .businessName("Max Grooming")
                .phone("+918877665544")
                .verificationStatus(ServiceProviderVerificationStatus.APPROVED)
                .isActive(true)
                .build());

        ServiceCategory cat = serviceCategoryRepository.save(ServiceCategory.builder()
                .name("Grooming Services")
                .serviceType(ServiceType.GROOMING)
                .isActive(true)
                .build());

        Service service = serviceRepository.save(Service.builder()
                .provider(provider)
                .category(cat)
                .name("Full Groom")
                .price(new BigDecimal("800.00"))
                .durationMinutes(60)
                .isActive(true)
                .build());

        ServiceBooking booking = serviceBookingRepository.save(ServiceBooking.builder()
                .bookingNo("SB-20261010-001")
                .pet(pet)
                .provider(provider)
                .service(service)
                .bookingDate(LocalDate.now().plusDays(3))
                .startTime(LocalTime.of(14, 0))
                .endTime(LocalTime.of(15, 0))
                .price(new BigDecimal("800.00"))
                .status(BookingStatus.CONFIRMED)
                .build());

        // List service bookings
        mockMvc.perform(get("/api/admin/service-bookings")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("status", "CONFIRMED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].bookingNo").value("SB-20261010-001"))
                .andExpect(jsonPath("$.data.content[0].businessName").value("Max Grooming"));

        // Detail lookup
        mockMvc.perform(get("/api/admin/service-bookings/{id}", booking.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.bookingNo").value("SB-20261010-001"));
    }

    @Test
    @DisplayName("Admin can successfully register a new veterinarian with user account and profile")
    void testAdminCanRegisterVeterinarian() throws Exception {
        AdminCreateVeterinarianRequest req = AdminCreateVeterinarianRequest.builder()
                .firstName("Arun")
                .lastName("Verma")
                .email("dr.arun.verma@testpawconnect.com")
                .phone("+919876543219")
                .password("SecureVetPass123!")
                .specialization("Canine Orthopedics")
                .qualification("BVSc & AH, MVSc Surgery")
                .licenseNumber("VET-IND-2026-99881")
                .experienceYears(12)
                .clinicName("Apex Animal Surgical Centre")
                .clinicAddress("14 Bannerghatta Road, Bengaluru")
                .consultationFee(new BigDecimal("750.00"))
                .bio("Board-certified veterinary surgeon specializing in hip dysplasia and cruciate ligament repairs.")
                .isActive(true)
                .build();

        verifyVeterinarianEmail("dr.arun.verma@testpawconnect.com");

        mockMvc.perform(post("/api/admin/veterinarians")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value("SUCCESS"))
                .andExpect(jsonPath("$.data.userFullName").value("Arun Verma"))
                .andExpect(jsonPath("$.data.clinicName").value("Apex Animal Surgical Centre"))
                .andExpect(jsonPath("$.data.specialization").value("Canine Orthopedics"))
                .andExpect(jsonPath("$.data.licenseNumber").value("VET-IND-2026-99881"))
                .andExpect(jsonPath("$.data.consultationFee").value(750.00))
                .andExpect(jsonPath("$.data.password").doesNotExist())
                .andExpect(jsonPath("$.data.passwordHash").doesNotExist());

        // Verify database persistence
        User savedUser = userRepository.findByEmail("dr.arun.verma@testpawconnect.com").orElse(null);
        assertNotNull(savedUser);
        assertTrue(passwordEncoder.matches("SecureVetPass123!", savedUser.getPasswordHash()));

        // Verify VETERINARIAN role assignment
        List<UserRole> userRoles = userRoleRepository.findByUserIdWithRole(savedUser.getId());
        boolean hasVetRole = userRoles.stream()
                .anyMatch(ur -> "VETERINARIAN".equalsIgnoreCase(ur.getRole().getRoleCode()));
        assertTrue(hasVetRole);

        // Verify Veterinarian profile
        Veterinarian vetProfile = veterinarianRepository.findByUserId(savedUser.getId()).orElse(null);
        assertNotNull(vetProfile);
        assertEquals("VET-IND-2026-99881", vetProfile.getLicenseNumber());
        assertEquals("Canine Orthopedics", vetProfile.getSpecialization());
    }

    @Test
    @DisplayName("Admin registering veterinarian rejects duplicate email and license number")
    void testAdminRegisterVeterinarianDuplicatesRejected() throws Exception {
        AdminCreateVeterinarianRequest req = AdminCreateVeterinarianRequest.builder()
                .firstName("Meera")
                .lastName("Nair")
                .email("dr.meera@testpawconnect.com")
                .phone("+919876543218")
                .password("SecureVetPass123!")
                .specialization("Feline Medicine")
                .qualification("BVSc")
                .licenseNumber("VET-IND-2026-77881")
                .consultationFee(new BigDecimal("500.00"))
                .build();

        // First registration succeeds
        verifyVeterinarianEmail("dr.meera@testpawconnect.com");
        mockMvc.perform(post("/api/admin/veterinarians")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        // Second registration with duplicate email fails
        mockMvc.perform(post("/api/admin/veterinarians")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("DUPLICATE_RESOURCE"));

        // Registration with duplicate license number fails
        req.setEmail("dr.meera.alt@testpawconnect.com");
        mockMvc.perform(post("/api/admin/veterinarians")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("DUPLICATE_RESOURCE"));
    }

    @Test
    @DisplayName("Admin can register a service provider with provider profile and role")
    void testAdminCanRegisterServiceProvider() throws Exception {
        AdminCreateServiceProviderRequest req = AdminCreateServiceProviderRequest.builder()
                .firstName("Siddharth")
                .lastName("Roy")
                .email("sid.roy@testpawconnect.com")
                .phone("+919876543217")
                .password("SecureProvider123!")
                .providerType(ProviderType.GROOMER)
                .businessName("The Canine Styling Lounge")
                .description("Award-winning pet spa and fear-free grooming salon.")
                .businessPhone("+919876543217")
                .address("45 Indiranagar 100ft Road, Bengaluru")
                .experienceYears(8)
                .isActive(true)
                .build();

        verifyProviderEmail("sid.roy@testpawconnect.com");

        mockMvc.perform(post("/api/admin/service-providers")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value("SUCCESS"))
                .andExpect(jsonPath("$.data.businessName").value("The Canine Styling Lounge"))
                .andExpect(jsonPath("$.data.providerType").value("GROOMER"))
                .andExpect(jsonPath("$.data.userFullName").value("Siddharth Roy"))
                .andExpect(jsonPath("$.data.password").doesNotExist())
                .andExpect(jsonPath("$.data.passwordHash").doesNotExist());

        // Verify database persistence
        User savedUser = userRepository.findByEmail("sid.roy@testpawconnect.com").orElse(null);
        assertNotNull(savedUser);
        assertTrue(passwordEncoder.matches("SecureProvider123!", savedUser.getPasswordHash()));

        // Verify SERVICE_PROVIDER role assignment
        List<UserRole> userRoles = userRoleRepository.findByUserIdWithRole(savedUser.getId());
        boolean hasProviderRole = userRoles.stream()
                .anyMatch(ur -> "SERVICE_PROVIDER".equalsIgnoreCase(ur.getRole().getRoleCode()));
        assertTrue(hasProviderRole);

        // Verify ServiceProvider profile
        ServiceProvider profile = serviceProviderRepository.findByUserId(savedUser.getId()).orElse(null);
        assertNotNull(profile);
        assertEquals("The Canine Styling Lounge", profile.getBusinessName());
        assertEquals(ProviderType.GROOMER, profile.getProviderType());
    }

    @Test
    @DisplayName("Non-admin users are strictly forbidden from professional registration endpoints")
    void testNonAdminForbiddenFromRegisteringProfessionals() throws Exception {
        AdminCreateVeterinarianRequest vetReq = AdminCreateVeterinarianRequest.builder()
                .firstName("Test")
                .lastName("Vet")
                .email("unauthorized.vet@testpawconnect.com")
                .specialization("General")
                .qualification("BVSc")
                .licenseNumber("LIC-TEST-001")
                .consultationFee(new BigDecimal("500.00"))
                .build();

        mockMvc.perform(post("/api/admin/veterinarians")
                        .header("Authorization", "Bearer " + regularToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(vetReq)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));

        AdminCreateServiceProviderRequest provReq = AdminCreateServiceProviderRequest.builder()
                .firstName("Test")
                .lastName("Provider")
                .email("unauthorized.provider@testpawconnect.com")
                .providerType(ProviderType.TRAINER)
                .businessName("Test Academy")
                .businessPhone("+919876543210")
                .build();

        mockMvc.perform(post("/api/admin/service-providers")
                        .header("Authorization", "Bearer " + regularToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(provReq)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    @DisplayName("Public discovery endpoints are accessible without authentication")
    void testPublicDiscoveryEndpointsAccessibleWithoutAuth() throws Exception {
        mockMvc.perform(get("/api/public/veterinarians"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isArray());

        mockMvc.perform(get("/api/public/service-providers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isArray());

        mockMvc.perform(get("/api/public/reviews"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isArray());
    }

    @Test
    @DisplayName("Admin can get service providers with pagination, flexible filters, and sort aliases")
    void testAdminGetServiceProviders() throws Exception {
        // Standard call
        mockMvc.perform(get("/api/admin/service-providers")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("size", "100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isArray());

        // Case-insensitive status filter and 'all'
        mockMvc.perform(get("/api/admin/service-providers")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("verificationStatus", "pending"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isArray());

        mockMvc.perform(get("/api/admin/service-providers")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("verificationStatus", "all"))
                .andExpect(status().isOk());

        // Flexible providerType filter (grooming, training, all)
        mockMvc.perform(get("/api/admin/service-providers")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("providerType", "grooming"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/admin/service-providers")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("providerType", "training"))
                .andExpect(status().isOk());

        // Sort aliases (name, provider, status, unknown field)
        mockMvc.perform(get("/api/admin/service-providers")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("sort", "provider,asc"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/admin/service-providers")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("sort", "unknownCustomField,desc"))
                .andExpect(status().isOk());
    }

    // =========================================================================
    // Broadcast Announcement & Fan-Out Notifications
    // =========================================================================

    @Test
    @DisplayName("Admin can compose and dispatch platform broadcasts, verify fan-out delivery, resend, and delete")
    void testAdminBroadcastNotifications() throws Exception {
        // 1. Unauthenticated or non-admin cannot access broadcast endpoint
        mockMvc.perform(get("/api/admin/notifications"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/admin/notifications")
                        .header("Authorization", "Bearer " + regularToken))
                .andExpect(status().isForbidden());

        // 2. Admin creates broadcast announcement
        CreateBroadcastRequest request = CreateBroadcastRequest.builder()
                .title("Scheduled Maintenance")
                .message("Platform upgrade at 2 AM")
                .targetAudience("ALL")
                .build();

        String createJson = objectMapper.writeValueAsString(request);

        String createResponseStr = mockMvc.perform(post("/api/admin/notifications")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("Scheduled Maintenance"))
                .andExpect(jsonPath("$.data.targetAudience").value("ALL"))
                .andExpect(jsonPath("$.data.audience").value("all"))
                .andExpect(jsonPath("$.data.dispatchStatus").value("SENT"))
                .andExpect(jsonPath("$.data.status").value("sent"))
                .andExpect(jsonPath("$.data.recipientCount", greaterThanOrEqualTo(1)))
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long broadcastId = objectMapper.readTree(createResponseStr).path("data").path("id").asLong();
        assertTrue(broadcastId > 0, "Broadcast ID must be generated");

        // 3. Admin lists broadcasts
        mockMvc.perform(get("/api/admin/notifications")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data.content[0].title").value("Scheduled Maintenance"))
                .andExpect(jsonPath("$.data.content[0].dispatchStatus").value("SENT"))
                .andExpect(jsonPath("$.data.content[0].recipientCount", greaterThanOrEqualTo(1)));

        // 4. Targeted user (regularUser / Pet Owner) receives the broadcast in their personal notification feed
        mockMvc.perform(get("/api/me/notifications")
                        .header("Authorization", "Bearer " + regularToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data.content[0].title").value("Scheduled Maintenance"))
                .andExpect(jsonPath("$.data.content[0].message").value("Platform upgrade at 2 AM"))
                .andExpect(jsonPath("$.data.content[0].referenceType").value("BROADCAST"))
                .andExpect(jsonPath("$.data.content[0].referenceId").value(broadcastId));

        // 5. Admin can resend broadcast
        mockMvc.perform(post("/api/admin/notifications/" + broadcastId + "/resend")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.dispatchStatus").value("SENT"));

        // 6. Admin can delete broadcast
        mockMvc.perform(delete("/api/admin/notifications/" + broadcastId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Verify broadcast is removed from admin table
        mockMvc.perform(get("/api/admin/notifications")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(0)));
    }
}
