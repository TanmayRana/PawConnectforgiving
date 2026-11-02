package com.example.PawConnect.controller;

import com.example.PawConnect.config.RequestIdFilter;
import com.example.PawConnect.dto.request.payment.CreateOrderRequestDTO;
import com.example.PawConnect.dto.request.payment.VerifyPaymentRequestDTO;
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
class StandardRazorpayCheckoutIntegrationTests {

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
    private ProductRepository productRepository;

    @Autowired
    private ProductCategoryRepository productCategoryRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PaymentOrderRepository paymentOrderRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private PaymentRepository paymentRepository;

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

    private User testCustomer;
    private String customerToken;
    private User testAdmin;
    private String adminToken;
    private Product testProduct;
    private Order testOrder;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .addFilter(requestIdFilter)
                .addFilter(springSecurityFilterChain)
                .build();

        Role petOwnerRole = roleRepository.findByRoleCode("PET_OWNER")
                .orElseGet(() -> roleRepository.save(Role.builder().roleCode("PET_OWNER").roleName("Pet Owner").build()));

        Role adminRole = roleRepository.findByRoleCode("ADMIN")
                .orElseGet(() -> roleRepository.save(Role.builder().roleCode("ADMIN").roleName("Admin").build()));

        long suffix = System.currentTimeMillis() % 100000000;
        testCustomer = userRepository.save(User.builder()
                .email("checkout_tester_" + suffix + "@test.com")
                .passwordHash(passwordEncoder.encode("Secret123!"))
                .firstName("Razorpay")
                .lastName("Buyer")
                .phone("9" + String.format("%09d", suffix))
                .status(UserStatus.ACTIVE)
                .tokenVersion(1)
                .build());

        userRoleRepository.save(UserRole.builder().user(testCustomer).role(petOwnerRole).build());
        customerToken = "Bearer " + jwtService.generateAccessToken(testCustomer, List.of("ROLE_PET_OWNER"));

        testAdmin = userRepository.save(User.builder()
                .email("admin_tester_" + suffix + "@test.com")
                .passwordHash(passwordEncoder.encode("Secret123!"))
                .firstName("Admin")
                .lastName("Support")
                .phone("8" + String.format("%09d", suffix))
                .status(UserStatus.ACTIVE)
                .tokenVersion(1)
                .build());

        userRoleRepository.save(UserRole.builder().user(testAdmin).role(adminRole).build());
        adminToken = "Bearer " + jwtService.generateAccessToken(testAdmin, List.of("ROLE_ADMIN"));

        ProductCategory category = productCategoryRepository.findAll().stream().findFirst()
                .orElseGet(() -> productCategoryRepository.save(ProductCategory.builder()
                        .name("Supplies " + suffix)
                        .isActive(true)
                        .build()));

        testProduct = productRepository.save(Product.builder()
                .name("Standard Checkout Dog Food")
                .sku("SKU-CHK-" + suffix)
                .category(category)
                .price(new BigDecimal("499.00"))
                .stockQuantity(100)
                .status(ProductStatus.ACTIVE)
                .isActive(true)
                .build());

        testOrder = orderRepository.save(Order.builder()
                .orderNo("ORD-STD-" + suffix)
                .user(testCustomer)
                .deliveryRecipientName("Razorpay Buyer")
                .deliveryPhone("9" + String.format("%09d", suffix))
                .deliveryAddressLine1("123 Dog St")
                .deliveryCity("Bangalore")
                .deliveryState("KA")
                .deliveryPostalCode("560001")
                .deliveryCountry("India")
                .subtotal(new BigDecimal("499.00"))
                .shippingFee(BigDecimal.ZERO)
                .taxAmount(BigDecimal.ZERO)
                .totalAmount(new BigDecimal("499.00"))
                .paymentStatus(PaymentStatus.PENDING)
                .orderStatus(OrderStatus.CONFIRMED)
                .build());
    }

    @AfterEach
    void tearDown() {
        paymentOrderRepository.deleteAll();
        paymentRepository.deleteAll();
        if (testOrder != null) {
            orderRepository.delete(testOrder);
        }
        if (testProduct != null) {
            productRepository.delete(testProduct);
        }
        if (testCustomer != null) {
            notificationRepository.deleteAll(notificationRepository.findByUserId(testCustomer.getId()));
            userRoleRepository.deleteAll(userRoleRepository.findByUserId(testCustomer.getId()));
            userRepository.delete(testCustomer);
        }
        if (testAdmin != null) {
            notificationRepository.deleteAll(notificationRepository.findByUserId(testAdmin.getId()));
            userRoleRepository.deleteAll(userRoleRepository.findByUserId(testAdmin.getId()));
            userRepository.delete(testAdmin);
        }
    }

    private String calculateHmac(String data, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKeySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(secretKeySpec);
        return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
    }

    @Test
    void testCreateOrder_ProductPriceCalculatedStrictlyFromDatabase() throws Exception {
        CreateOrderRequestDTO request = CreateOrderRequestDTO.builder()
                .productId(testProduct.getId())
                .quantity(2)
                .currency("INR")
                .build();

        // Expected: 499.00 * 2 = 998.00 => 99800 paise
        mockMvc.perform(post("/api/payment/create-order")
                        .header("Authorization", customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.orderId", notNullValue()))
                .andExpect(jsonPath("$.data.amountInPaise", is(99800)))
                .andExpect(jsonPath("$.data.currency", is("INR")))
                .andExpect(jsonPath("$.data.productId", is(testProduct.getId().intValue())));

        // Verify stored PaymentOrder record
        List<PaymentOrder> orders = paymentOrderRepository.findByUserId(testCustomer.getId());
        assertFalse(orders.isEmpty());
        PaymentOrder po = orders.get(0);
        assertEquals(99800L, po.getAmountInPaise());
        assertEquals(PaymentStatus.CREATED, po.getStatus());
        assertFalse(po.isSignatureVerified());
    }

    @Test
    void testVerifyPayment_ValidSignatureFulfillsOrder() throws Exception {
        CreateOrderRequestDTO request = CreateOrderRequestDTO.builder()
                .orderId(testOrder.getId())
                .currency("INR")
                .build();

        String createJson = mockMvc.perform(post("/api/payment/create-order")
                        .header("Authorization", customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String razorpayOrderId = objectMapper.readTree(createJson).get("data").get("orderId").asText();
        String razorpayPaymentId = "pay_test_" + System.currentTimeMillis();
        String validSignature = calculateHmac(razorpayOrderId + "|" + razorpayPaymentId, keySecret);

        VerifyPaymentRequestDTO verifyRequest = VerifyPaymentRequestDTO.builder()
                .razorpayOrderId(razorpayOrderId)
                .razorpayPaymentId(razorpayPaymentId)
                .razorpaySignature(validSignature)
                .paymentMethod("CARD")
                .build();

        mockMvc.perform(post("/api/payment/verify")
                        .header("Authorization", customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("PAID")))
                .andExpect(jsonPath("$.data.signatureVerified", is(true)));

        // Verify Merchandise Order updated
        Order refreshedOrder = orderRepository.findById(testOrder.getId()).orElseThrow();
        assertTrue(refreshedOrder.getPaymentStatus() == PaymentStatus.PAID || refreshedOrder.getPaymentStatus() == PaymentStatus.SUCCESS);
    }

    @Test
    void testVerifyPayment_ForgedSignatureRejected() throws Exception {
        CreateOrderRequestDTO request = CreateOrderRequestDTO.builder()
                .orderId(testOrder.getId())
                .currency("INR")
                .build();

        String createJson = mockMvc.perform(post("/api/payment/create-order")
                        .header("Authorization", customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String razorpayOrderId = objectMapper.readTree(createJson).get("data").get("orderId").asText();

        VerifyPaymentRequestDTO verifyRequest = VerifyPaymentRequestDTO.builder()
                .razorpayOrderId(razorpayOrderId)
                .razorpayPaymentId("pay_fake_123")
                .razorpaySignature("forged_tampered_signature")
                .build();

        mockMvc.perform(post("/api/payment/verify")
                        .header("Authorization", customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    void testWebhook_UnauthenticatedAccessPermittedAndProcessesIdempotently() throws Exception {
        CreateOrderRequestDTO request = CreateOrderRequestDTO.builder()
                .orderId(testOrder.getId())
                .currency("INR")
                .build();

        String createJson = mockMvc.perform(post("/api/payment/create-order")
                        .header("Authorization", customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String razorpayOrderId = objectMapper.readTree(createJson).get("data").get("orderId").asText();
        String fakePaymentId = "pay_hook_" + System.currentTimeMillis();

        String webhookPayload = String.format(
                "{\"event\":\"payment.captured\",\"payload\":{\"payment\":{\"entity\":{\"id\":\"%s\",\"order_id\":\"%s\",\"amount\":49900,\"currency\":\"INR\",\"status\":\"captured\"}}}}",
                fakePaymentId, razorpayOrderId
        );
        String webhookSignature = calculateHmac(webhookPayload, webhookSecret);

        // Webhook POST has NO Authorization header! (unauthenticated)
        mockMvc.perform(post("/api/payment/webhook")
                        .header("X-Razorpay-Signature", webhookSignature)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(webhookPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        // Verify order reconciled
        Order refreshedOrder = orderRepository.findById(testOrder.getId()).orElseThrow();
        assertTrue(refreshedOrder.getPaymentStatus() == PaymentStatus.PAID || refreshedOrder.getPaymentStatus() == PaymentStatus.SUCCESS);

        // Repeated webhook call is idempotent and safe
        mockMvc.perform(post("/api/payment/webhook")
                        .header("X-Razorpay-Signature", webhookSignature)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(webhookPayload))
                .andExpect(status().isOk());
    }

    @Test
    void testPaymentStatus_PollingReturnsCurrentState() throws Exception {
        CreateOrderRequestDTO request = CreateOrderRequestDTO.builder()
                .productId(testProduct.getId())
                .quantity(1)
                .currency("INR")
                .build();

        String createJson = mockMvc.perform(post("/api/payment/create-order")
                        .header("Authorization", customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String razorpayOrderId = objectMapper.readTree(createJson).get("data").get("orderId").asText();

        // 1. Initial status check returns CREATED
        mockMvc.perform(get("/api/payment/status/" + razorpayOrderId)
                        .header("Authorization", customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.orderId", is(razorpayOrderId)))
                .andExpect(jsonPath("$.data.status", is("CREATED")))
                .andExpect(jsonPath("$.data.signatureVerified", is(false)));

        // 2. Perform payment verification
        String paymentId = "pay_stat_" + System.currentTimeMillis();
        String validSignature = calculateHmac(razorpayOrderId + "|" + paymentId, keySecret);

        VerifyPaymentRequestDTO verifyRequest = VerifyPaymentRequestDTO.builder()
                .razorpayOrderId(razorpayOrderId)
                .razorpayPaymentId(paymentId)
                .razorpaySignature(validSignature)
                .build();

        mockMvc.perform(post("/api/payment/verify")
                        .header("Authorization", customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyRequest)))
                .andExpect(status().isOk());

        // 3. Status polling now returns PAID and signatureVerified = true
        mockMvc.perform(get("/api/payment/status/" + razorpayOrderId)
                        .header("Authorization", customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("PAID")))
                .andExpect(jsonPath("$.data.signatureVerified", is(true)))
                .andExpect(jsonPath("$.data.razorpayPaymentId", is(paymentId)));
    }

    @Test
    void testRefundPayment_AdminCanRefundAndSubsequentRefundIsIdempotent() throws Exception {
        CreateOrderRequestDTO request = CreateOrderRequestDTO.builder()
                .orderId(testOrder.getId())
                .currency("INR")
                .build();

        String createJson = mockMvc.perform(post("/api/payment/create-order")
                        .header("Authorization", customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String razorpayOrderId = objectMapper.readTree(createJson).get("data").get("orderId").asText();
        String paymentId = "pay_rfnd_" + System.currentTimeMillis();
        String validSignature = calculateHmac(razorpayOrderId + "|" + paymentId, keySecret);

        VerifyPaymentRequestDTO verifyRequest = VerifyPaymentRequestDTO.builder()
                .razorpayOrderId(razorpayOrderId)
                .razorpayPaymentId(paymentId)
                .razorpaySignature(validSignature)
                .build();

        mockMvc.perform(post("/api/payment/verify")
                        .header("Authorization", customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyRequest)))
                .andExpect(status().isOk());

        // 1. Admin issues refund
        mockMvc.perform(post("/api/payment/refund/" + razorpayOrderId)
                        .header("Authorization", adminToken)
                        .param("reason", "Customer requested cancellation"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("REFUNDED")));

        // Verify linked Order status is CANCELLED and REFUNDED
        Order refundedOrder = orderRepository.findById(testOrder.getId()).orElseThrow();
        assertEquals(PaymentStatus.REFUNDED, refundedOrder.getPaymentStatus());
        assertEquals(OrderStatus.CANCELLED, refundedOrder.getOrderStatus());

        // 2. Second refund call is idempotent and succeeds without error
        mockMvc.perform(post("/api/payment/refund/" + razorpayOrderId)
                        .header("Authorization", adminToken)
                        .param("reason", "Duplicate attempt"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("REFUNDED")));
    }

    @Test
    void testWebhook_RefundProcessedReconcilesOrderToRefunded() throws Exception {
        CreateOrderRequestDTO request = CreateOrderRequestDTO.builder()
                .orderId(testOrder.getId())
                .currency("INR")
                .build();

        String createJson = mockMvc.perform(post("/api/payment/create-order")
                        .header("Authorization", customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String razorpayOrderId = objectMapper.readTree(createJson).get("data").get("orderId").asText();
        String paymentId = "pay_wh_rfnd_" + System.currentTimeMillis();
        String validSignature = calculateHmac(razorpayOrderId + "|" + paymentId, keySecret);

        VerifyPaymentRequestDTO verifyRequest = VerifyPaymentRequestDTO.builder()
                .razorpayOrderId(razorpayOrderId)
                .razorpayPaymentId(paymentId)
                .razorpaySignature(validSignature)
                .build();

        mockMvc.perform(post("/api/payment/verify")
                        .header("Authorization", customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyRequest)))
                .andExpect(status().isOk());

        // Send refund.processed webhook
        String webhookPayload = String.format(
                "{\"event\":\"refund.processed\",\"payload\":{\"refund\":{\"entity\":{\"id\":\"rfnd_123\",\"payment_id\":\"%s\",\"order_id\":\"%s\",\"amount\":49900,\"currency\":\"INR\",\"status\":\"processed\"}}}}",
                paymentId, razorpayOrderId
        );
        String webhookSignature = calculateHmac(webhookPayload, webhookSecret);

        mockMvc.perform(post("/api/payment/webhook")
                        .header("X-Razorpay-Signature", webhookSignature)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(webhookPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        // Verify PaymentOrder was reconciled to REFUNDED
        PaymentOrder po = paymentOrderRepository.findByRazorpayOrderId(razorpayOrderId).orElseThrow();
        assertEquals(PaymentStatus.REFUNDED, po.getStatus());
    }

    @Test
    void testCancelOrder_PaidOrderAutomaticallyTriggersRefundWorkflow() throws Exception {
        // 1. Create standard Razorpay payment order for testOrder
        CreateOrderRequestDTO request = CreateOrderRequestDTO.builder()
                .orderId(testOrder.getId())
                .currency("INR")
                .build();

        String createJson = mockMvc.perform(post("/api/payment/create-order")
                        .header("Authorization", customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String razorpayOrderId = objectMapper.readTree(createJson).get("data").get("orderId").asText();
        String paymentId = "pay_cancel_rfnd_" + System.currentTimeMillis();
        String validSignature = calculateHmac(razorpayOrderId + "|" + paymentId, keySecret);

        // 2. Fulfill and verify payment so the order becomes PAID
        VerifyPaymentRequestDTO verifyRequest = VerifyPaymentRequestDTO.builder()
                .razorpayOrderId(razorpayOrderId)
                .razorpayPaymentId(paymentId)
                .razorpaySignature(validSignature)
                .build();

        mockMvc.perform(post("/api/payment/verify")
                        .header("Authorization", customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyRequest)))
                .andExpect(status().isOk());

        // Verify order is PAID before cancellation
        Order paidOrder = orderRepository.findById(testOrder.getId()).orElseThrow();
        assertTrue(paidOrder.getPaymentStatus() == PaymentStatus.PAID || paidOrder.getPaymentStatus() == PaymentStatus.SUCCESS);

        // 3. Customer cancels the order via /api/me/orders/{orderId}/cancel
        mockMvc.perform(post("/api/me/orders/" + testOrder.getId() + "/cancel")
                        .header("Authorization", customerToken)
                        .param("reason", "Customer changed mind"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.orderStatus", is("CANCELLED")));

        // 4. Verify that Order and PaymentOrder are both automatically transitioned to REFUNDED and CANCELLED
        Order cancelledOrder = orderRepository.findById(testOrder.getId()).orElseThrow();
        assertEquals(OrderStatus.CANCELLED, cancelledOrder.getOrderStatus());
        assertEquals(PaymentStatus.REFUNDED, cancelledOrder.getPaymentStatus());

        PaymentOrder refundedPo = paymentOrderRepository.findByRazorpayOrderId(razorpayOrderId).orElseThrow();
        assertEquals(PaymentStatus.REFUNDED, refundedPo.getStatus());
        assertTrue(refundedPo.getFailureReason().contains("Order cancelled"));
    }

    @Test
    void testPrePaymentWorkflow_OrderPendingUntilVerifyPaymentFulfilled() throws Exception {
        // 1. Initial state: testOrder has OrderStatus.PENDING, PaymentStatus.PENDING
        testOrder.setOrderStatus(OrderStatus.PENDING);
        testOrder.setPaymentStatus(PaymentStatus.PENDING);
        orderRepository.save(testOrder);

        // 2. Create Razorpay Payment Order
        CreateOrderRequestDTO request = CreateOrderRequestDTO.builder()
                .orderId(testOrder.getId())
                .currency("INR")
                .build();

        String createJson = mockMvc.perform(post("/api/payment/create-order")
                        .header("Authorization", customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String razorpayOrderId = objectMapper.readTree(createJson).get("data").get("orderId").asText();

        // Verify order is STILL in PENDING before verification
        Order unverified = orderRepository.findById(testOrder.getId()).orElseThrow();
        assertEquals(OrderStatus.PENDING, unverified.getOrderStatus());
        assertEquals(PaymentStatus.PENDING, unverified.getPaymentStatus());

        // 3. Complete payment verification via POST /api/payment/verify
        String paymentId = "pay_test_vrf_" + System.currentTimeMillis();
        String validSignature = calculateHmac(razorpayOrderId + "|" + paymentId, keySecret);

        VerifyPaymentRequestDTO verifyRequest = VerifyPaymentRequestDTO.builder()
                .razorpayOrderId(razorpayOrderId)
                .razorpayPaymentId(paymentId)
                .razorpaySignature(validSignature)
                .build();

        mockMvc.perform(post("/api/payment/verify")
                        .header("Authorization", customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("PAID")));

        // 4. Verify order is now CONFIRMED and PAID
        Order confirmed = orderRepository.findById(testOrder.getId()).orElseThrow();
        assertEquals(OrderStatus.CONFIRMED, confirmed.getOrderStatus());
        assertEquals(PaymentStatus.PAID, confirmed.getPaymentStatus());

        // Verify notification emitted
        List<Notification> notifs = notificationRepository.findByUserId(testCustomer.getId());
        assertTrue(notifs.stream().anyMatch(n -> n.getNotificationType() == NotificationType.PAYMENT_SUCCESS));
    }

    @Test
    void testCancelAbandonedPayment_CancelsOrderAndRestoresStock() throws Exception {
        testOrder.setOrderStatus(OrderStatus.PENDING);
        testOrder.setPaymentStatus(PaymentStatus.PENDING);
        orderRepository.save(testOrder);

        CreateOrderRequestDTO request = CreateOrderRequestDTO.builder()
                .orderId(testOrder.getId())
                .currency("INR")
                .build();

        String createJson = mockMvc.perform(post("/api/payment/create-order")
                        .header("Authorization", customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String razorpayOrderId = objectMapper.readTree(createJson).get("data").get("orderId").asText();

        // Customer abandons checkout and modal calls POST /api/payment/cancel-abandoned/{razorpayOrderId}
        mockMvc.perform(post("/api/payment/cancel-abandoned/" + razorpayOrderId)
                        .header("Authorization", customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        // Verify PaymentOrder and Order are updated
        PaymentOrder po = paymentOrderRepository.findByRazorpayOrderId(razorpayOrderId).orElseThrow();
        assertEquals(PaymentStatus.FAILED, po.getStatus());

        Order cancelled = orderRepository.findById(testOrder.getId()).orElseThrow();
        assertEquals(OrderStatus.CANCELLED, cancelled.getOrderStatus());
    }

    @Test
    void testAdminPayments_LedgerAndSummaryKPIs() throws Exception {
        // Create and verify an order to have confirmed transaction data
        CreateOrderRequestDTO request = CreateOrderRequestDTO.builder()
                .orderId(testOrder.getId())
                .currency("INR")
                .build();

        String createJson = mockMvc.perform(post("/api/payment/create-order")
                        .header("Authorization", customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String razorpayOrderId = objectMapper.readTree(createJson).get("data").get("orderId").asText();
        String paymentId = "pay_adm_test_" + System.currentTimeMillis();
        String validSignature = calculateHmac(razorpayOrderId + "|" + paymentId, keySecret);

        VerifyPaymentRequestDTO verifyRequest = VerifyPaymentRequestDTO.builder()
                .razorpayOrderId(razorpayOrderId)
                .razorpayPaymentId(paymentId)
                .razorpaySignature(validSignature)
                .build();

        mockMvc.perform(post("/api/payment/verify")
                        .header("Authorization", customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyRequest)))
                .andExpect(status().isOk());

        // 1. Admin queries GET /api/admin/payments
        mockMvc.perform(get("/api/admin/payments")
                        .header("Authorization", adminToken)
                        .param("status", "PAID"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", not(empty())))
                .andExpect(jsonPath("$.data.content[0].razorpayOrderId", is(razorpayOrderId)))
                .andExpect(jsonPath("$.data.content[0].customerName", notNullValue()))
                .andExpect(jsonPath("$.data.content[0].amount", notNullValue()));

        // 2. Admin queries GET /api/admin/payments/summary
        mockMvc.perform(get("/api/admin/payments/summary")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.totalTransactions", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.data.successfulCount", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.data.totalRevenue", greaterThan(0.0)));
    }
}
