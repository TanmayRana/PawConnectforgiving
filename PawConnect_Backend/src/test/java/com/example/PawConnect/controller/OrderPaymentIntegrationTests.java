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
import java.util.HexFormat;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
class OrderPaymentIntegrationTests {

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
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private OrderStatusHistoryRepository orderStatusHistoryRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private PaymentOrderRepository paymentOrderRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductCategoryRepository productCategoryRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private User alice;
    private String aliceToken;

    private User bob;
    private String bobToken;

    private Address aliceAddress;
    private Order placedOrder;

    @BeforeEach
    void setUp() throws Exception {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .addFilters(requestIdFilter, springSecurityFilterChain)
                .build();

        cleanup();

        Role petOwnerRole = roleRepository.findByRoleCode("PET_OWNER").orElseGet(() ->
                roleRepository.save(Role.builder().roleCode("PET_OWNER").roleName("Pet Owner").build()));

        alice = userRepository.save(User.builder()
                .firstName("Alice")
                .lastName("Walker")
                .email("alice_pay@test.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .status(UserStatus.ACTIVE)
                .tokenVersion(1)
                .build());
        userRoleRepository.save(UserRole.builder().user(alice).role(petOwnerRole).build());
        aliceToken = jwtService.generateAccessToken(alice, java.util.List.of("ROLE_PET_OWNER"));

        bob = userRepository.save(User.builder()
                .firstName("Bob")
                .lastName("Jones")
                .email("bob_pay@test.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .status(UserStatus.ACTIVE)
                .tokenVersion(1)
                .build());
        userRoleRepository.save(UserRole.builder().user(bob).role(petOwnerRole).build());
        bobToken = jwtService.generateAccessToken(bob, java.util.List.of("ROLE_PET_OWNER"));

        aliceAddress = addressRepository.save(Address.builder()
                .user(alice)
                .recipientName("Alice Walker")
                .phone("+919876543210")
                .addressLine1("123 Green Valley")
                .city("Bengaluru")
                .state("Karnataka")
                .postalCode("560001")
                .country("India")
                .isDefault(true)
                .build());

        ProductCategory category = productCategoryRepository.save(ProductCategory.builder()
                .name("Pet Gear")
                .isActive(true)
                .build());

        productRepository.save(Product.builder()
                .category(category)
                .name("No-Pull Dog Harness")
                .sku("SKU-HARNESS-01")
                .price(BigDecimal.valueOf(150.00))
                .stockQuantity(10)
                .status(ProductStatus.ACTIVE)
                .isActive(true)
                .build());

        // Pre-create an order for Alice
        placedOrder = orderRepository.save(Order.builder()
                .orderNo("ORD-TEST-12345")
                .user(alice)
                .address(aliceAddress)
                .deliveryRecipientName("Alice Walker")
                .subtotal(BigDecimal.valueOf(150.00))
                .shippingFee(BigDecimal.ZERO)
                .taxAmount(BigDecimal.ZERO)
                .totalAmount(BigDecimal.valueOf(150.00))
                .orderStatus(OrderStatus.CONFIRMED)
                .paymentStatus(PaymentStatus.PENDING)
                .build());
    }

    private String calculateHmac(String data, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec keySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(keySpec);
        byte[] rawHmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return HexFormat.of().formatHex(rawHmac);
    }

    @Test
    void testCreateOrderPayment_Success() throws Exception {
        mockMvc.perform(post("/api/me/orders/" + placedOrder.getId() + "/payments/order")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.razorpayOrderId", notNullValue()))
                .andExpect(jsonPath("$.data.amount", is(150.00)))
                .andExpect(jsonPath("$.data.amountInPaise", is(15000)))
                .andExpect(jsonPath("$.data.currency", is("INR")))
                .andExpect(jsonPath("$.data.bookingType", is("ORDER")));

        List<Payment> payments = paymentRepository.findByPaymentForAndReferenceId(PaymentFor.ORDER, placedOrder.getId());
        assertEquals(1, payments.size());
        assertEquals(PaymentStatus.PENDING, payments.get(0).getStatus());
        assertEquals(0, BigDecimal.valueOf(150.00).compareTo(payments.get(0).getAmount()));
    }

    @Test
    void testCreateOrderPayment_ForeignOrderForbidden() throws Exception {
        // Bob tries to pay for Alice's order
        mockMvc.perform(post("/api/me/orders/" + placedOrder.getId() + "/payments/order")
                        .header("Authorization", "Bearer " + bobToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void testCreateOrderPayment_CancelledOrderRejected() throws Exception {
        placedOrder.setOrderStatus(OrderStatus.CANCELLED);
        orderRepository.save(placedOrder);

        mockMvc.perform(post("/api/me/orders/" + placedOrder.getId() + "/payments/order")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("CANCELLED")));
    }

    @Test
    void testVerifyOrderPayment_ValidSignatureMarksSuccess() throws Exception {
        // 1. Create payment order first
        String createJson = mockMvc.perform(post("/api/me/orders/" + placedOrder.getId() + "/payments/order")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String razorpayOrderId = objectMapper.readTree(createJson).get("data").get("razorpayOrderId").asText();
        String razorpayPaymentId = "pay_test_" + System.currentTimeMillis();
        String validSignature = calculateHmac(razorpayOrderId + "|" + razorpayPaymentId, keySecret);

        VerifyPaymentRequest verifyRequest = VerifyPaymentRequest.builder()
                .razorpayOrderId(razorpayOrderId)
                .razorpayPaymentId(razorpayPaymentId)
                .razorpaySignature(validSignature)
                .build();

        // 2. Verify payment signature
        mockMvc.perform(post("/api/payments/razorpay/verify")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("SUCCESS")));

        // 3. Verify order payment status is now SUCCESS
        Order refreshedOrder = orderRepository.findById(placedOrder.getId()).orElseThrow();
        assertEquals(PaymentStatus.SUCCESS, refreshedOrder.getPaymentStatus());

        // 4. Duplicate verify call is idempotent
        mockMvc.perform(post("/api/payments/razorpay/verify")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("SUCCESS")));
    }

    @Test
    void testVerifyOrderPayment_InvalidSignatureRejected() throws Exception {
        String createJson = mockMvc.perform(post("/api/me/orders/" + placedOrder.getId() + "/payments/order")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String razorpayOrderId = objectMapper.readTree(createJson).get("data").get("razorpayOrderId").asText();
        VerifyPaymentRequest invalidRequest = VerifyPaymentRequest.builder()
                .razorpayOrderId(razorpayOrderId)
                .razorpayPaymentId("pay_fake_123")
                .razorpaySignature("invalid_tampered_signature")
                .build();

        mockMvc.perform(post("/api/payments/razorpay/verify")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));

        // Order remains PENDING
        Order refreshedOrder = orderRepository.findById(placedOrder.getId()).orElseThrow();
        assertEquals(PaymentStatus.PENDING, refreshedOrder.getPaymentStatus());
    }

    @Test
    void testWebhookOrderPaymentCaptured_ReconcilesOrderToSuccess() throws Exception {
        String createJson = mockMvc.perform(post("/api/me/orders/" + placedOrder.getId() + "/payments/order")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String razorpayOrderId = objectMapper.readTree(createJson).get("data").get("razorpayOrderId").asText();
        String fakePaymentId = "pay_hook_" + System.currentTimeMillis();

        String webhookPayload = String.format(
                "{\"event\":\"payment.captured\",\"payload\":{\"payment\":{\"entity\":{\"id\":\"%s\",\"order_id\":\"%s\",\"amount\":15000,\"currency\":\"INR\",\"status\":\"captured\"}}}}",
                fakePaymentId, razorpayOrderId
        );

        String webhookSignature = calculateHmac(webhookPayload, webhookSecret);

        mockMvc.perform(post("/api/webhooks/razorpay")
                        .header("X-Razorpay-Signature", webhookSignature)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(webhookPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        // Verify order is reconciled to PAID or SUCCESS
        Order refreshedOrder = orderRepository.findById(placedOrder.getId()).orElseThrow();
        assertTrue(refreshedOrder.getPaymentStatus() == PaymentStatus.PAID || refreshedOrder.getPaymentStatus() == PaymentStatus.SUCCESS);

        // Subsequent failure webhook cannot downgrade success
        String failedPayload = String.format(
                "{\"event\":\"payment.failed\",\"payload\":{\"payment\":{\"entity\":{\"id\":\"%s\",\"order_id\":\"%s\",\"amount\":15000,\"currency\":\"INR\",\"status\":\"failed\",\"error_description\":\"Card declined\"}}}}",
                fakePaymentId, razorpayOrderId
        );
        String failedSignature = calculateHmac(failedPayload, webhookSecret);

        mockMvc.perform(post("/api/webhooks/razorpay")
                        .header("X-Razorpay-Signature", failedSignature)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(failedPayload))
                .andExpect(status().isOk());

        Order finalOrder = orderRepository.findById(placedOrder.getId()).orElseThrow();
        assertTrue(finalOrder.getPaymentStatus() == PaymentStatus.PAID || finalOrder.getPaymentStatus() == PaymentStatus.SUCCESS, "Verified payment must never be downgraded by failure webhook");
    }

    @AfterEach
    void tearDown() {
        cleanup();
    }

    private void cleanup() {
        notificationRepository.deleteAll();
        paymentRepository.deleteAll();
        paymentOrderRepository.deleteAll();
        orderStatusHistoryRepository.deleteAll();
        orderItemRepository.deleteAll();
        orderRepository.deleteAll();
        cartItemRepository.deleteAll();
        cartRepository.deleteAll();
        addressRepository.deleteAll();
        productRepository.deleteAll();
        productCategoryRepository.deleteAll();
        userRoleRepository.deleteAll();
        userRepository.deleteAll();
    }
}
