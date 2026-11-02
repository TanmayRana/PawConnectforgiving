package com.example.PawConnect.controller;

import com.example.PawConnect.config.RequestIdFilter;
import com.example.PawConnect.dto.request.payment.VerifyPaymentRequest;
import com.example.PawConnect.model.*;
import com.example.PawConnect.repository.*;
import com.example.PawConnect.security.JwtService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.FilterChainProxy;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HexFormat;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
class PaymentIntegrationTests {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private FilterChainProxy springSecurityFilterChain;

    @Autowired
    private RequestIdFilter requestIdFilter;

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());

    @Value("${application.razorpay.key-secret:sampleKeySecret456}")
    private String keySecret;

    @Value("${application.razorpay.webhook-secret:sampleWebhookSecret789}")
    private String webhookSecret;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private PetRepository petRepository;

    @Autowired
    private VeterinarianRepository veterinarianRepository;

    @Autowired
    private ServiceProviderRepository serviceProviderRepository;

    @Autowired
    private ServiceCategoryRepository serviceCategoryRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private ServiceBookingRepository serviceBookingRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private OrderStatusHistoryRepository orderStatusHistoryRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    // Test data
    private User customerAlice;
    private String aliceToken;

    private User customerBob;
    private String bobToken;

    private User vetUserCharlie;
    private Veterinarian vetCharlie;
    private String vetCharlieToken;

    private User providerUserEvan;
    private ServiceProvider providerEvan;

    private Pet aliceDog;
    private Service groomingService;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .addFilters(requestIdFilter, springSecurityFilterChain)
                .build();

        cleanupDatabase();

        Role petOwnerRole = getOrCreateRole("PET_OWNER", "Pet Owner");
        Role vetRole = getOrCreateRole("VETERINARIAN", "Veterinarian");
        Role providerRole = getOrCreateRole("SERVICE_PROVIDER", "Service Provider");

        // Customer Alice
        customerAlice = createUser("alice_pay@test.com", "Alice", "Smith", "+1111111111");
        assignRole(customerAlice, petOwnerRole);
        aliceToken = jwtService.generateAccessToken(customerAlice, List.of("ROLE_PET_OWNER"));

        // Customer Bob
        customerBob = createUser("bob_pay@test.com", "Bob", "Jones", "+1222222222");
        assignRole(customerBob, petOwnerRole);
        bobToken = jwtService.generateAccessToken(customerBob, List.of("ROLE_PET_OWNER"));

        // Vet Charlie
        vetUserCharlie = createUser("vet_charlie_pay@test.com", "Charlie", "Vet", "+1333333333");
        assignRole(vetUserCharlie, vetRole);
        vetCharlieToken = jwtService.generateAccessToken(vetUserCharlie, List.of("ROLE_VETERINARIAN"));

        vetCharlie = veterinarianRepository.save(Veterinarian.builder()
                .user(vetUserCharlie)
                .specialization("General Practice")
                .licenseNumber("LIC-PAY-1001")
                .clinicName("Charlie Animal Clinic")
                .consultationFee(BigDecimal.valueOf(150.00))
                .verificationStatus(VeterinarianVerificationStatus.APPROVED)
                .isActive(true)
                .build());

        // Provider Evan
        providerUserEvan = createUser("provider_evan_pay@test.com", "Evan", "Groomer", "+1555555555");
        assignRole(providerUserEvan, providerRole);

        providerEvan = serviceProviderRepository.save(ServiceProvider.builder()
                .user(providerUserEvan)
                .providerType(ProviderType.GROOMER)
                .businessName("Evan's Pet Grooming")
                .phone("+1555555555")
                .verificationStatus(ServiceProviderVerificationStatus.APPROVED)
                .isActive(true)
                .build());

        // Pets
        aliceDog = petRepository.save(Pet.builder()
                .owner(customerAlice)
                .name("Max")
                .species("Dog")
                .breed("Golden Retriever")
                .gender(PetGender.MALE)
                .status(PetStatus.ACTIVE)
                .build());

        petRepository.save(Pet.builder()
                .owner(customerBob)
                .name("Luna")
                .species("Cat")
                .breed("Persian")
                .gender(PetGender.FEMALE)
                .status(PetStatus.ACTIVE)
                .build());

        // Service
        ServiceCategory category = serviceCategoryRepository.save(ServiceCategory.builder()
                .name("Grooming")
                .serviceType(ServiceType.GROOMING)
                .description("Grooming services")
                .isActive(true)
                .build());

        groomingService = serviceRepository.save(Service.builder()
                .provider(providerEvan)
                .category(category)
                .name("Deluxe Bath")
                .price(BigDecimal.valueOf(80.00))
                .durationMinutes(60)
                .isActive(true)
                .build());
    }

    @AfterEach
    void tearDown() {
        cleanupDatabase();
    }

    private void cleanupDatabase() {
        notificationRepository.deleteAll();
        orderStatusHistoryRepository.deleteAll();
        orderItemRepository.deleteAll();
        orderRepository.deleteAll();
        cartItemRepository.deleteAll();
        cartRepository.deleteAll();
        appointmentRepository.deleteAll();
        serviceBookingRepository.deleteAll();
        paymentRepository.deleteAll();
        serviceRepository.deleteAll();
        serviceCategoryRepository.deleteAll();
        veterinarianRepository.deleteAll();
        serviceProviderRepository.deleteAll();
        petRepository.deleteAll();
        userRoleRepository.deleteAll();
        userRepository.deleteAll();
    }

    private Role getOrCreateRole(String code, String name) {
        return roleRepository.findByRoleCode(code).orElseGet(() ->
                roleRepository.save(Role.builder()
                        .roleCode(code)
                        .roleName(name)
                        .description(name + " description")
                        .build()));
    }

    private User createUser(String email, String first, String last, String phone) {
        return userRepository.save(User.builder()
                .firstName(first)
                .lastName(last)
                .email(email)
                .phone(phone)
                .passwordHash(passwordEncoder.encode("Password123!"))
                .status(UserStatus.ACTIVE)
                .tokenVersion(1)
                .build());
    }

    private void assignRole(User user, Role role) {
        userRoleRepository.save(UserRole.builder().user(user).role(role).build());
    }

    private String calculateHmac(String data, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec keySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(keySpec);
        return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
    }

    // =========================================================================
    // 1. Authorization Tests
    // =========================================================================

    @Test
    void testAnonymousAccessDeniedToPaymentEndpoints() throws Exception {
        mockMvc.perform(post("/api/me/bookings/1/payments/order"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code", is("UNAUTHORIZED")));

        mockMvc.perform(post("/api/payments/razorpay/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/me/bookings/1/payment"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testCustomerCannotCreatePaymentForAnotherCustomersBooking() throws Exception {
        Appointment apt = appointmentRepository.save(Appointment.builder()
                .appointmentNo("APT-ALICE-1")
                .pet(aliceDog)
                .veterinarian(vetCharlie)
                .appointmentDate(LocalDate.now().plusDays(3))
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(10, 30))
                .consultationFee(BigDecimal.valueOf(150.00))
                .status(AppointmentStatus.CONFIRMED)
                .build());

        // Bob attempts to initiate payment for Alice's confirmed appointment
        mockMvc.perform(post("/api/me/bookings/" + apt.getId() + "/payments/order")
                        .header("Authorization", "Bearer " + bobToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code", is("FORBIDDEN")));
    }

    @Test
    void testVeterinarianCannotCreatePaymentOnBehalfOfCustomer() throws Exception {
        Appointment apt = appointmentRepository.save(Appointment.builder()
                .appointmentNo("APT-ALICE-2")
                .pet(aliceDog)
                .veterinarian(vetCharlie)
                .appointmentDate(LocalDate.now().plusDays(3))
                .startTime(LocalTime.of(11, 0))
                .endTime(LocalTime.of(11, 30))
                .consultationFee(BigDecimal.valueOf(150.00))
                .status(AppointmentStatus.CONFIRMED)
                .build());

        mockMvc.perform(post("/api/me/bookings/" + apt.getId() + "/payments/order")
                        .header("Authorization", "Bearer " + vetCharlieToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    // =========================================================================
    // 2. Order Creation Tests
    // =========================================================================

    @Test
    void testCreatePaymentOrderForConfirmedAppointmentSuccess() throws Exception {
        Appointment apt = appointmentRepository.save(Appointment.builder()
                .appointmentNo("APT-CONFIRMED-1")
                .pet(aliceDog)
                .veterinarian(vetCharlie)
                .appointmentDate(LocalDate.now().plusDays(4))
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(10, 30))
                .consultationFee(BigDecimal.valueOf(150.00))
                .status(AppointmentStatus.CONFIRMED)
                .build());

        mockMvc.perform(post("/api/me/bookings/" + apt.getId() + "/payments/order")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.razorpayOrderId", notNullValue()))
                .andExpect(jsonPath("$.data.amount", is(150.00)))
                .andExpect(jsonPath("$.data.amountInPaise", is(15000)))
                .andExpect(jsonPath("$.data.currency", is("INR")))
                .andExpect(jsonPath("$.data.customerName", is("Alice Smith")))
                .andExpect(jsonPath("$.data.bookingType", is("VETERINARY")));

        // Verify local payment record created in PENDING status
        List<Payment> payments = paymentRepository.findByPaymentForAndReferenceId(PaymentFor.APPOINTMENT, apt.getId());
        assertEquals(1, payments.size());
        assertEquals(PaymentStatus.PENDING, payments.get(0).getStatus());
        assertEquals(0, BigDecimal.valueOf(150.00).compareTo(payments.get(0).getAmount()));
    }

    @Test
    void testCreatePaymentOrderForConfirmedServiceBookingSuccess() throws Exception {
        ServiceBooking booking = serviceBookingRepository.save(ServiceBooking.builder()
                .bookingNo("SB-CONFIRMED-1")
                .pet(aliceDog)
                .provider(providerEvan)
                .service(groomingService)
                .bookingDate(LocalDate.now().plusDays(5))
                .startTime(LocalTime.of(14, 0))
                .endTime(LocalTime.of(15, 0))
                .price(BigDecimal.valueOf(80.00))
                .status(BookingStatus.CONFIRMED)
                .build());

        mockMvc.perform(post("/api/me/service-bookings/" + booking.getId() + "/payments/order")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.amount", is(80.00)))
                .andExpect(jsonPath("$.data.amountInPaise", is(8000)))
                .andExpect(jsonPath("$.data.currency", is("INR")))
                .andExpect(jsonPath("$.data.bookingType", is("SERVICE")));

        List<Payment> payments = paymentRepository.findByPaymentForAndReferenceId(PaymentFor.SERVICE_BOOKING, booking.getId());
        assertEquals(1, payments.size());
        assertEquals(PaymentStatus.PENDING, payments.get(0).getStatus());
    }

    @Test
    void testCreatePaymentOrderForPendingBookingRejected() throws Exception {
        Appointment apt = appointmentRepository.save(Appointment.builder()
                .appointmentNo("APT-PENDING-1")
                .pet(aliceDog)
                .veterinarian(vetCharlie)
                .appointmentDate(LocalDate.now().plusDays(2))
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(10, 30))
                .consultationFee(BigDecimal.valueOf(150.00))
                .status(AppointmentStatus.PENDING) // NOT confirmed yet
                .build());

        mockMvc.perform(post("/api/me/bookings/" + apt.getId() + "/payments/order")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.code", is("BUSINESS_RULE_VIOLATION")));
    }

    @Test
    void testCreatePaymentOrderForCancelledBookingRejected() throws Exception {
        Appointment apt = appointmentRepository.save(Appointment.builder()
                .appointmentNo("APT-CANCELLED-1")
                .pet(aliceDog)
                .veterinarian(vetCharlie)
                .appointmentDate(LocalDate.now().plusDays(2))
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(10, 30))
                .consultationFee(BigDecimal.valueOf(150.00))
                .status(AppointmentStatus.CANCELLED)
                .build());

        mockMvc.perform(post("/api/me/bookings/" + apt.getId() + "/payments/order")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.code", is("BUSINESS_RULE_VIOLATION")));
    }

    @Test
    void testCreatePaymentOrderAlreadyPaidBookingRejected() throws Exception {
        Appointment apt = appointmentRepository.save(Appointment.builder()
                .appointmentNo("APT-PAID-1")
                .pet(aliceDog)
                .veterinarian(vetCharlie)
                .appointmentDate(LocalDate.now().plusDays(2))
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(10, 30))
                .consultationFee(BigDecimal.valueOf(150.00))
                .status(AppointmentStatus.CONFIRMED)
                .build());

        paymentRepository.save(Payment.builder()
                .user(customerAlice)
                .paymentReference("PAY-ALREADY-SUCCESS")
                .paymentFor(PaymentFor.APPOINTMENT)
                .referenceId(apt.getId())
                .amount(BigDecimal.valueOf(150.00))
                .status(PaymentStatus.SUCCESS)
                .build());

        mockMvc.perform(post("/api/me/bookings/" + apt.getId() + "/payments/order")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.code", is("BUSINESS_RULE_VIOLATION")));
    }

    // =========================================================================
    // 3. Checkout Verification Tests
    // =========================================================================

    @Test
    void testVerifyCheckoutPaymentValidSignatureSuccess() throws Exception {
        String orderId = "order_test_123456789";
        String paymentId = "pay_test_987654321";

        Payment payment = paymentRepository.save(Payment.builder()
                .user(customerAlice)
                .paymentReference("PAY-VERIFY-1")
                .paymentFor(PaymentFor.APPOINTMENT)
                .referenceId(100L)
                .amount(BigDecimal.valueOf(150.00))
                .currency("INR")
                .status(PaymentStatus.PENDING)
                .gatewayProvider("RAZORPAY")
                .gatewayOrderId(orderId)
                .build());

        String validSignature = calculateHmac(orderId + "|" + paymentId, keySecret);

        VerifyPaymentRequest req = VerifyPaymentRequest.builder()
                .razorpayOrderId(orderId)
                .razorpayPaymentId(paymentId)
                .razorpaySignature(validSignature)
                .build();

        mockMvc.perform(post("/api/payments/razorpay/verify")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("SUCCESS")))
                .andExpect(jsonPath("$.data.gatewayPaymentId", is(paymentId)));

        Payment updated = paymentRepository.findById(payment.getId()).orElseThrow();
        assertEquals(PaymentStatus.SUCCESS, updated.getStatus());
        assertNotNull(updated.getPaidAt());
    }

    @Test
    void testVerifyCheckoutPaymentInvalidSignatureRejected() throws Exception {
        String orderId = "order_test_invalid_sig";
        String paymentId = "pay_test_invalid_sig";

        paymentRepository.save(Payment.builder()
                .user(customerAlice)
                .paymentReference("PAY-INV-SIG")
                .paymentFor(PaymentFor.APPOINTMENT)
                .referenceId(101L)
                .amount(BigDecimal.valueOf(150.00))
                .status(PaymentStatus.PENDING)
                .gatewayOrderId(orderId)
                .build());

        VerifyPaymentRequest req = VerifyPaymentRequest.builder()
                .razorpayOrderId(orderId)
                .razorpayPaymentId(paymentId)
                .razorpaySignature("invalid_forged_signature_12345")
                .build();

        mockMvc.perform(post("/api/payments/razorpay/verify")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is("PAYMENT_VERIFICATION_FAILED")));

        Payment intact = paymentRepository.findByGatewayOrderId(orderId).orElseThrow();
        assertEquals(PaymentStatus.PENDING, intact.getStatus(), "Local payment state must remain intact on failed verification");
    }

    @Test
    void testVerifyCheckoutPaymentMismatchedCustomerRejected() throws Exception {
        String orderId = "order_test_alice_order";
        String paymentId = "pay_test_alice_pay";

        paymentRepository.save(Payment.builder()
                .user(customerAlice)
                .paymentReference("PAY-ALICE-ONLY")
                .paymentFor(PaymentFor.APPOINTMENT)
                .referenceId(102L)
                .amount(BigDecimal.valueOf(150.00))
                .status(PaymentStatus.PENDING)
                .gatewayOrderId(orderId)
                .build());

        String signature = calculateHmac(orderId + "|" + paymentId, keySecret);

        VerifyPaymentRequest req = VerifyPaymentRequest.builder()
                .razorpayOrderId(orderId)
                .razorpayPaymentId(paymentId)
                .razorpaySignature(signature)
                .build();

        // Bob attempts to verify Alice's order
        mockMvc.perform(post("/api/payments/razorpay/verify")
                        .header("Authorization", "Bearer " + bobToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code", is("FORBIDDEN")));
    }

    @Test
    void testVerifyCheckoutPaymentDuplicateRequestHandledIdempotently() throws Exception {
        String orderId = "order_test_idempotent";
        String paymentId = "pay_test_idempotent";

        paymentRepository.save(Payment.builder()
                .user(customerAlice)
                .paymentReference("PAY-IDEMP-1")
                .paymentFor(PaymentFor.APPOINTMENT)
                .referenceId(103L)
                .amount(BigDecimal.valueOf(150.00))
                .status(PaymentStatus.PENDING)
                .gatewayOrderId(orderId)
                .build());

        String signature = calculateHmac(orderId + "|" + paymentId, keySecret);
        VerifyPaymentRequest req = VerifyPaymentRequest.builder()
                .razorpayOrderId(orderId)
                .razorpayPaymentId(paymentId)
                .razorpaySignature(signature)
                .build();

        // First verification -> SUCCESS
        mockMvc.perform(post("/api/payments/razorpay/verify")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("SUCCESS")));

        // Duplicate verification request -> still returns SUCCESS without error or duplicate records
        mockMvc.perform(post("/api/payments/razorpay/verify")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("SUCCESS")));
    }

    // =========================================================================
    // 4. Webhook Notification Tests
    // =========================================================================

    @Test
    void testWebhookPaymentCapturedReconciledSuccessfully() throws Exception {
        String orderId = "order_webhook_captured_1";
        String paymentId = "pay_webhook_captured_1";

        paymentRepository.save(Payment.builder()
                .user(customerAlice)
                .paymentReference("PAY-HOOK-1")
                .paymentFor(PaymentFor.APPOINTMENT)
                .referenceId(201L)
                .amount(BigDecimal.valueOf(150.00))
                .status(PaymentStatus.PENDING)
                .gatewayOrderId(orderId)
                .build());

        String payload = String.format("""
                {
                  "entity": "event",
                  "event": "payment.captured",
                  "payload": {
                    "payment": {
                      "entity": {
                        "id": "%s",
                        "order_id": "%s",
                        "amount": 15000,
                        "currency": "INR",
                        "status": "captured"
                      }
                    }
                  }
                }
                """, paymentId, orderId);

        String signature = calculateHmac(payload, webhookSecret);

        mockMvc.perform(post("/api/webhooks/razorpay")
                        .header("X-Razorpay-Signature", signature)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        Payment updated = paymentRepository.findByGatewayOrderId(orderId).orElseThrow();
        assertEquals(PaymentStatus.SUCCESS, updated.getStatus());
        assertEquals(paymentId, updated.getGatewayPaymentId());
    }

    @Test
    void testWebhookInvalidSignatureRejected() throws Exception {
        String payload = "{\"entity\":\"event\",\"event\":\"payment.captured\"}";

        mockMvc.perform(post("/api/webhooks/razorpay")
                        .header("X-Razorpay-Signature", "forged_webhook_signature")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is("PAYMENT_VERIFICATION_FAILED")));
    }

    @Test
    void testWebhookMissingSignatureHeaderRejected() throws Exception {
        String payload = "{\"entity\":\"event\",\"event\":\"payment.captured\"}";

        mockMvc.perform(post("/api/webhooks/razorpay")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is("PAYMENT_VERIFICATION_FAILED")));
    }

    @Test
    void testWebhookPaymentFailedDoesNotDowngradeAlreadySuccessfulPayment() throws Exception {
        String orderId = "order_webhook_success_locked";
        String paymentId = "pay_webhook_success_locked";

        paymentRepository.save(Payment.builder()
                .user(customerAlice)
                .paymentReference("PAY-HOOK-LOCKED")
                .paymentFor(PaymentFor.APPOINTMENT)
                .referenceId(202L)
                .amount(BigDecimal.valueOf(150.00))
                .status(PaymentStatus.SUCCESS) // Already success
                .gatewayOrderId(orderId)
                .gatewayPaymentId(paymentId)
                .build());

        String failurePayload = String.format("""
                {
                  "entity": "event",
                  "event": "payment.failed",
                  "payload": {
                    "payment": {
                      "entity": {
                        "id": "pay_failed_attempt",
                        "order_id": "%s",
                        "error_description": "Card was declined"
                      }
                    }
                  }
                }
                """, orderId);

        String signature = calculateHmac(failurePayload, webhookSecret);

        mockMvc.perform(post("/api/webhooks/razorpay")
                        .header("X-Razorpay-Signature", signature)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(failurePayload))
                .andExpect(status().isOk());

        Payment intact = paymentRepository.findByGatewayOrderId(orderId).orElseThrow();
        assertEquals(PaymentStatus.SUCCESS, intact.getStatus(), "Verified payment must NOT be downgraded by subsequent failure webhook");
    }

    @Test
    void testWebhookUnknownOrderHandledSafely() throws Exception {
        String payload = """
                {
                  "entity": "event",
                  "event": "payment.captured",
                  "payload": {
                    "payment": {
                      "entity": {
                        "id": "pay_unknown_order",
                        "order_id": "order_unknown_99999",
                        "amount": 10000
                      }
                    }
                  }
                }
                """;

        String signature = calculateHmac(payload, webhookSecret);

        mockMvc.perform(post("/api/webhooks/razorpay")
                        .header("X-Razorpay-Signature", signature)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    void testWebhookAppointmentPaymentCaptured_DispatchesNotificationAndLinksPayment() throws Exception {
        Appointment apt = appointmentRepository.save(Appointment.builder()
                .appointmentNo("APT-HOOK-NOTIF-1")
                .pet(aliceDog)
                .veterinarian(vetCharlie)
                .appointmentDate(LocalDate.now().plusDays(3))
                .startTime(LocalTime.of(11, 0))
                .endTime(LocalTime.of(11, 30))
                .consultationFee(BigDecimal.valueOf(150.00))
                .status(AppointmentStatus.CONFIRMED)
                .build());

        String orderId = "order_webhook_apt_notif_1";
        String paymentId = "pay_webhook_apt_notif_1";

        paymentRepository.save(Payment.builder()
                .user(customerAlice)
                .paymentReference("PAY-HOOK-APT-1")
                .paymentFor(PaymentFor.APPOINTMENT)
                .referenceId(apt.getId())
                .amount(BigDecimal.valueOf(150.00))
                .status(PaymentStatus.PENDING)
                .gatewayOrderId(orderId)
                .build());

        String payload = String.format("""
                {
                  "entity": "event",
                  "event": "payment.captured",
                  "payload": {
                    "payment": {
                      "entity": {
                        "id": "%s",
                        "order_id": "%s",
                        "amount": 15000,
                        "currency": "INR",
                        "status": "captured"
                      }
                    }
                  }
                }
                """, paymentId, orderId);

        String signature = calculateHmac(payload, webhookSecret);

        mockMvc.perform(post("/api/webhooks/razorpay")
                        .header("X-Razorpay-Signature", signature)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        Payment updated = paymentRepository.findByGatewayOrderId(orderId).orElseThrow();
        assertEquals(PaymentStatus.SUCCESS, updated.getStatus());

        Appointment reloadedApt = appointmentRepository.findById(apt.getId()).orElseThrow();
        assertNotNull(reloadedApt.getPayment());
        assertEquals(updated.getId(), reloadedApt.getPayment().getId());

        List<Notification> notifs = notificationRepository.findByUserId(customerAlice.getId());
        boolean hasPaymentSuccess = notifs.stream()
                .anyMatch(n -> n.getNotificationType() == NotificationType.PAYMENT_SUCCESS
                        && n.getTitle().contains("Appointment Payment Successful"));
        assertTrue(hasPaymentSuccess, "Customer must receive notification even if checkout was completed via webhook");
    }

    @Test
    void testWebhookServiceBookingPaymentCaptured_DispatchesNotificationAndLinksPayment() throws Exception {
        ServiceBooking booking = serviceBookingRepository.save(ServiceBooking.builder()
                .bookingNo("SB-HOOK-NOTIF-1")
                .pet(aliceDog)
                .provider(providerEvan)
                .service(groomingService)
                .bookingDate(LocalDate.now().plusDays(4))
                .startTime(LocalTime.of(15, 0))
                .endTime(LocalTime.of(16, 0))
                .price(BigDecimal.valueOf(80.00))
                .status(BookingStatus.CONFIRMED)
                .build());

        String orderId = "order_webhook_sb_notif_1";
        String paymentId = "pay_webhook_sb_notif_1";

        paymentRepository.save(Payment.builder()
                .user(customerAlice)
                .paymentReference("PAY-HOOK-SB-1")
                .paymentFor(PaymentFor.SERVICE_BOOKING)
                .referenceId(booking.getId())
                .amount(BigDecimal.valueOf(80.00))
                .status(PaymentStatus.PENDING)
                .gatewayOrderId(orderId)
                .build());

        String payload = String.format("""
                {
                  "entity": "event",
                  "event": "payment.captured",
                  "payload": {
                    "payment": {
                      "entity": {
                        "id": "%s",
                        "order_id": "%s",
                        "amount": 8000,
                        "currency": "INR",
                        "status": "captured"
                      }
                    }
                  }
                }
                """, paymentId, orderId);

        String signature = calculateHmac(payload, webhookSecret);

        mockMvc.perform(post("/api/webhooks/razorpay")
                        .header("X-Razorpay-Signature", signature)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        Payment updated = paymentRepository.findByGatewayOrderId(orderId).orElseThrow();
        assertEquals(PaymentStatus.SUCCESS, updated.getStatus());

        ServiceBooking reloadedBooking = serviceBookingRepository.findById(booking.getId()).orElseThrow();
        assertNotNull(reloadedBooking.getPayment());
        assertEquals(updated.getId(), reloadedBooking.getPayment().getId());

        List<Notification> notifs = notificationRepository.findByUserId(customerAlice.getId());
        boolean hasPaymentSuccess = notifs.stream()
                .anyMatch(n -> n.getNotificationType() == NotificationType.PAYMENT_SUCCESS
                        && n.getTitle().contains("Service Booking Payment Successful"));
        assertTrue(hasPaymentSuccess, "Customer must receive notification for service booking via webhook");
    }

    @Test
    void testWebhookRepeatedValidEventHandledIdempotently() throws Exception {
        String orderId = "order_webhook_repeated_1";
        String paymentId = "pay_webhook_repeated_1";

        paymentRepository.save(Payment.builder()
                .user(customerAlice)
                .paymentReference("PAY-HOOK-REP-1")
                .paymentFor(PaymentFor.APPOINTMENT)
                .referenceId(301L)
                .amount(BigDecimal.valueOf(150.00))
                .status(PaymentStatus.PENDING)
                .gatewayOrderId(orderId)
                .build());

        String payload = String.format("""
                {
                  "entity": "event",
                  "event": "payment.captured",
                  "payload": {
                    "payment": {
                      "entity": {
                        "id": "%s",
                        "order_id": "%s",
                        "amount": 15000,
                        "currency": "INR",
                        "status": "captured"
                      }
                    }
                  }
                }
                """, paymentId, orderId);

        String signature = calculateHmac(payload, webhookSecret);

        // First delivery
        mockMvc.perform(post("/api/webhooks/razorpay")
                        .header("X-Razorpay-Signature", signature)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        // Duplicate delivery
        mockMvc.perform(post("/api/webhooks/razorpay")
                        .header("X-Razorpay-Signature", signature)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        Payment updated = paymentRepository.findByGatewayOrderId(orderId).orElseThrow();
        assertEquals(PaymentStatus.SUCCESS, updated.getStatus());
    }

    // =========================================================================
    // 5. Payment Status Retrieval
    // =========================================================================

    @Test
    void testGetBookingPaymentStatusSuccess() throws Exception {
        Appointment apt = appointmentRepository.save(Appointment.builder()
                .appointmentNo("APT-STATUS-1")
                .pet(aliceDog)
                .veterinarian(vetCharlie)
                .appointmentDate(LocalDate.now().plusDays(3))
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(10, 30))
                .consultationFee(BigDecimal.valueOf(150.00))
                .status(AppointmentStatus.CONFIRMED)
                .build());

        paymentRepository.save(Payment.builder()
                .user(customerAlice)
                .paymentReference("PAY-STATUS-1")
                .paymentFor(PaymentFor.APPOINTMENT)
                .referenceId(apt.getId())
                .amount(BigDecimal.valueOf(150.00))
                .currency("INR")
                .status(PaymentStatus.SUCCESS)
                .gatewayOrderId("order_status_123")
                .build());

        mockMvc.perform(get("/api/me/bookings/" + apt.getId() + "/payment")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("SUCCESS")))
                .andExpect(jsonPath("$.data.amount", is(150.00)));

        // Bob cannot view Alice's payment status
        mockMvc.perform(get("/api/me/bookings/" + apt.getId() + "/payment")
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isForbidden());
    }

    // =========================================================================
    // 6. Concurrency Tests
    // =========================================================================

    @Test
    void testConcurrentCheckoutVerificationsIdempotency() throws Exception {
        String orderId = "order_concurrent_verify";
        String paymentId = "pay_concurrent_verify";

        Payment payment = paymentRepository.save(Payment.builder()
                .user(customerAlice)
                .paymentReference("PAY-CONC-1")
                .paymentFor(PaymentFor.APPOINTMENT)
                .referenceId(301L)
                .amount(BigDecimal.valueOf(150.00))
                .currency("INR")
                .status(PaymentStatus.PENDING)
                .gatewayOrderId(orderId)
                .build());

        String signature = calculateHmac(orderId + "|" + paymentId, keySecret);
        VerifyPaymentRequest req = VerifyPaymentRequest.builder()
                .razorpayOrderId(orderId)
                .razorpayPaymentId(paymentId)
                .razorpaySignature(signature)
                .build();

        int numThreads = 2;
        ExecutorService executor = Executors.newFixedThreadPool(numThreads);
        CountDownLatch readyLatch = new CountDownLatch(numThreads);
        CountDownLatch startLatch = new CountDownLatch(1);
        AtomicInteger successResponses = new AtomicInteger(0);

        Callable<Void> verifyTask = () -> {
            readyLatch.countDown();
            try {
                startLatch.await();
                mockMvc.perform(post("/api/payments/razorpay/verify")
                                .header("Authorization", "Bearer " + aliceToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(req)))
                        .andExpect(result -> {
                            if (result.getResponse().getStatus() == 200) {
                                successResponses.incrementAndGet();
                            }
                        });
            } catch (Exception ignored) {}
            return null;
        };

        Future<Void> f1 = executor.submit(verifyTask);
        Future<Void> f2 = executor.submit(verifyTask);

        readyLatch.await(5, TimeUnit.SECONDS);
        startLatch.countDown();

        f1.get(10, TimeUnit.SECONDS);
        f2.get(10, TimeUnit.SECONDS);
        executor.shutdown();

        assertEquals(2, successResponses.get(), "Both concurrent verification requests must return 200 OK");
        Payment finalPayment = paymentRepository.findById(payment.getId()).orElseThrow();
        assertEquals(PaymentStatus.SUCCESS, finalPayment.getStatus());
    }
}
