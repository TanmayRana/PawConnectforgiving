package com.example.PawConnect.controller;

import com.example.PawConnect.config.RequestIdFilter;
import com.example.PawConnect.dto.request.admin.CreatePromoCodeRequest;
import com.example.PawConnect.dto.request.admin.TogglePromoCodeStatusRequest;
import com.example.PawConnect.dto.request.admin.UpdatePromoCodeRequest;
import com.example.PawConnect.dto.request.commerce.ApplyPromoRequest;
import com.example.PawConnect.dto.request.commerce.CheckoutRequest;
import com.example.PawConnect.dto.request.commerce.CreateCartItemRequest;
import com.example.PawConnect.model.*;
import com.example.PawConnect.repository.*;
import com.example.PawConnect.security.JwtService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
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
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
class PromoCodeIntegrationTests {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private FilterChainProxy springSecurityFilterChain;

    @Autowired
    private RequestIdFilter requestIdFilter;

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());

    @Autowired
    private PromoCodeRepository promoCodeRepository;

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
    private AuditLogRepository auditLogRepository;

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

    private User adminUser;
    private String adminToken;

    private User customerUser;
    private String customerToken;

    private Address customerAddress;
    private Product product1;
    private Product product2;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .addFilters(requestIdFilter, springSecurityFilterChain)
                .build();

        cleanup();

        Role adminRole = roleRepository.findByRoleCode("ADMIN")
                .orElseGet(() -> roleRepository.save(Role.builder().roleCode("ADMIN").roleName("Admin").description("Administrator").build()));

        Role customerRole = roleRepository.findByRoleCode("PET_OWNER")
                .orElseGet(() -> roleRepository.save(Role.builder().roleCode("PET_OWNER").roleName("Pet Owner").description("Pet Owner").build()));

        adminUser = userRepository.save(User.builder()
                .firstName("Admin")
                .lastName("Super")
                .email("admin_promo@test.com")
                .phone("+919999999999")
                .passwordHash(passwordEncoder.encode("AdminPass123!"))
                .status(UserStatus.ACTIVE)
                .tokenVersion(1)
                .build());
        userRoleRepository.save(UserRole.builder().user(adminUser).role(adminRole).build());
        adminToken = jwtService.generateAccessToken(adminUser, List.of("ROLE_ADMIN"));

        customerUser = userRepository.save(User.builder()
                .firstName("Alice")
                .lastName("Customer")
                .email("alice_promo@test.com")
                .phone("+919888888888")
                .passwordHash(passwordEncoder.encode("AlicePass123!"))
                .status(UserStatus.ACTIVE)
                .tokenVersion(1)
                .build());
        userRoleRepository.save(UserRole.builder().user(customerUser).role(customerRole).build());
        customerToken = jwtService.generateAccessToken(customerUser, List.of("ROLE_PET_OWNER"));

        customerAddress = addressRepository.save(Address.builder()
                .user(customerUser)
                .recipientName("Alice Customer")
                .phone("+919888888888")
                .addressLine1("123 Paw Lane")
                .city("Bangalore")
                .state("Karnataka")
                .postalCode("560001")
                .country("India")
                .isDefault(true)
                .build());

        ProductCategory category = productCategoryRepository.save(ProductCategory.builder()
                .name("Dog Supplies " + System.currentTimeMillis())
                .description("Supplies for dogs")
                .isActive(true)
                .build());

        product1 = productRepository.save(Product.builder()
                .category(category)
                .name("Premium Dog Kibble")
                .sku("DOG-KIB-001")
                .price(BigDecimal.valueOf(1000.00))
                .stockQuantity(50)
                .isActive(true)
                .status(ProductStatus.ACTIVE)
                .build());

        product2 = productRepository.save(Product.builder()
                .category(category)
                .name("Chew Toy")
                .sku("DOG-TOY-002")
                .price(BigDecimal.valueOf(200.00))
                .stockQuantity(50)
                .isActive(true)
                .status(ProductStatus.ACTIVE)
                .build());
    }

    @AfterEach
    void tearDown() {
        cleanup();
    }

    private void cleanup() {
        notificationRepository.deleteAllInBatch();
        paymentOrderRepository.deleteAllInBatch();
        paymentRepository.deleteAllInBatch();
        orderStatusHistoryRepository.deleteAllInBatch();
        orderItemRepository.deleteAllInBatch();
        orderRepository.deleteAllInBatch();
        cartItemRepository.deleteAllInBatch();
        cartRepository.deleteAllInBatch();
        productRepository.deleteAllInBatch();
        productCategoryRepository.deleteAllInBatch();
        addressRepository.deleteAllInBatch();
        promoCodeRepository.deleteAllInBatch();
        auditLogRepository.deleteAllInBatch();
        userRoleRepository.deleteAllInBatch();
        userRepository.deleteAllInBatch();
    }

    // =========================================================================
    // 1. Admin Promo Code Management Tests
    // =========================================================================

    @Test
    void testAdminCanCreatePromoCode_PercentageAndFixedAmount() throws Exception {
        CreatePromoCodeRequest request = CreatePromoCodeRequest.builder()
                .code("paw10") // Test normalization to uppercase
                .description("10% off on all orders")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(BigDecimal.valueOf(10.00))
                .minOrderAmount(BigDecimal.valueOf(500.00))
                .maxDiscountAmount(BigDecimal.valueOf(150.00))
                .usageLimit(100)
                .perUserLimit(2)
                .isActive(true)
                .build();

        mockMvc.perform(post("/api/admin/promo-codes")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.code", is("PAW10")))
                .andExpect(jsonPath("$.data.discountType", is("PERCENTAGE")))
                .andExpect(jsonPath("$.data.discountValue", is(10.00)))
                .andExpect(jsonPath("$.data.minOrderAmount", is(500.00)))
                .andExpect(jsonPath("$.data.maxDiscountAmount", is(150.00)))
                .andExpect(jsonPath("$.data.perUserLimit", is(2)))
                .andExpect(jsonPath("$.data.isActive", is(true)));

        // Verify Audit Log recorded
        List<AuditLog> logs = auditLogRepository.findAll();
        assertEquals(1, logs.size());
        assertEquals("CREATE_PROMO_CODE", logs.get(0).getAction());
        assertEquals("PROMO_CODE", logs.get(0).getModule());
    }

    @Test
    void testAdminCanListFilterAndSearchPromoCodes() throws Exception {
        promoCodeRepository.save(PromoCode.builder()
                .code("PAW10")
                .description("Ten percent discount")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(BigDecimal.valueOf(10.00))
                .minOrderAmount(BigDecimal.ZERO)
                .isActive(true)
                .build());

        promoCodeRepository.save(PromoCode.builder()
                .code("FLAT50")
                .description("Fifty rupees off")
                .discountType(DiscountType.FIXED_AMOUNT)
                .discountValue(BigDecimal.valueOf(50.00))
                .minOrderAmount(BigDecimal.ZERO)
                .isActive(false)
                .build());

        // Search by keyword
        mockMvc.perform(get("/api/admin/promo-codes?search=PAW")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].code", is("PAW10")));

        // Filter by isActive
        mockMvc.perform(get("/api/admin/promo-codes?isActive=false")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].code", is("FLAT50")));
    }

    @Test
    void testAdminCanUpdatePromoCode() throws Exception {
        PromoCode promo = promoCodeRepository.save(PromoCode.builder()
                .code("PAW20")
                .description("Initial description")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(BigDecimal.valueOf(20.00))
                .minOrderAmount(BigDecimal.valueOf(200.00))
                .isActive(true)
                .build());

        UpdatePromoCodeRequest updateReq = UpdatePromoCodeRequest.builder()
                .description("Updated description")
                .discountValue(BigDecimal.valueOf(25.00))
                .minOrderAmount(BigDecimal.valueOf(300.00))
                .build();

        mockMvc.perform(put("/api/admin/promo-codes/" + promo.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.description", is("Updated description")))
                .andExpect(jsonPath("$.data.discountValue", is(25.00)))
                .andExpect(jsonPath("$.data.minOrderAmount", is(300.00)));

        List<AuditLog> logs = auditLogRepository.findAll();
        assertEquals(1, logs.size());
        assertEquals("UPDATE_PROMO_CODE", logs.get(0).getAction());
    }

    @Test
    void testAdminCanTogglePromoCodeStatus() throws Exception {
        PromoCode promo = promoCodeRepository.save(PromoCode.builder()
                .code("TOGGLE1")
                .discountType(DiscountType.FIXED_AMOUNT)
                .discountValue(BigDecimal.valueOf(50.00))
                .isActive(true)
                .build());

        // Toggle to false
        mockMvc.perform(patch("/api/admin/promo-codes/" + promo.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"isActive\": false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isActive", is(false)));

        // Verify in DB
        PromoCode updated = promoCodeRepository.findById(promo.getId()).orElseThrow();
        assertEquals(false, updated.getIsActive());

        // Toggle back to true without body
        mockMvc.perform(patch("/api/admin/promo-codes/" + promo.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isActive", is(true)));
    }

    @Test
    void testAdminCanDeletePromoCode() throws Exception {
        PromoCode promo = promoCodeRepository.save(PromoCode.builder()
                .code("DELETE1")
                .discountType(DiscountType.FIXED_AMOUNT)
                .discountValue(BigDecimal.valueOf(50.00))
                .isActive(true)
                .build());

        mockMvc.perform(delete("/api/admin/promo-codes/" + promo.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        assertEquals(0, promoCodeRepository.count());
    }

    @Test
    void testNonAdminForbiddenFromAdminEndpoints() throws Exception {
        // Customer forbidden
        mockMvc.perform(get("/api/admin/promo-codes")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());

        // Unauthenticated rejected
        mockMvc.perform(get("/api/admin/promo-codes"))
                .andExpect(status().isUnauthorized());
    }

    // =========================================================================
    // 2. Customer Promo Code Validation Tests
    // =========================================================================

    @Test
    void testCustomerCanValidateValidPromoCode() throws Exception {
        // Add 1 x product1 (₹1000) to customer cart
        mockMvc.perform(post("/api/me/cart/items")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(CreateCartItemRequest.builder()
                                .productId(product1.getId())
                                .quantity(1)
                                .build())))
                .andExpect(status().isCreated());

        // Create promo code 10% capped at ₹150 with minOrder ₹500
        promoCodeRepository.save(PromoCode.builder()
                .code("PAW10")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(BigDecimal.valueOf(10.00))
                .minOrderAmount(BigDecimal.valueOf(500.00))
                .maxDiscountAmount(BigDecimal.valueOf(150.00))
                .isActive(true)
                .build());

        // Validate via /api/me/cart/apply-promo
        mockMvc.perform(post("/api/me/cart/apply-promo")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(ApplyPromoRequest.builder().code("paw10").build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.code", is("PAW10")))
                .andExpect(jsonPath("$.data.subtotal", is(1000.00)))
                .andExpect(jsonPath("$.data.discountAmount", is(100.00))) // 10% of 1000 = 100
                .andExpect(jsonPath("$.data.finalTotal", is(900.00)));

        // Validate via alias endpoint /api/me/promo-codes/validate
        mockMvc.perform(post("/api/me/promo-codes/validate")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(ApplyPromoRequest.builder().code("PAW10").build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.discountAmount", is(100.00)));
    }

    @Test
    void testCustomerValidateExpiredPromoCodeFails() throws Exception {
        // Add item to cart
        mockMvc.perform(post("/api/me/cart/items")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(CreateCartItemRequest.builder()
                                .productId(product1.getId())
                                .quantity(1)
                                .build())))
                .andExpect(status().isCreated());

        promoCodeRepository.save(PromoCode.builder()
                .code("EXPIRED1")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(BigDecimal.valueOf(10.00))
                .validFrom(LocalDateTime.now().minusDays(10))
                .validUntil(LocalDateTime.now().minusDays(1)) // Expired
                .isActive(true)
                .build());

        mockMvc.perform(post("/api/me/cart/apply-promo")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(ApplyPromoRequest.builder().code("EXPIRED1").build())))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.message", containsString("expired")));
    }

    @Test
    void testCustomerValidateBelowMinOrderAmountFails() throws Exception {
        // Add product2 (₹200) to cart
        mockMvc.perform(post("/api/me/cart/items")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(CreateCartItemRequest.builder()
                                .productId(product2.getId())
                                .quantity(1)
                                .build())))
                .andExpect(status().isCreated());

        promoCodeRepository.save(PromoCode.builder()
                .code("MIN500")
                .discountType(DiscountType.FIXED_AMOUNT)
                .discountValue(BigDecimal.valueOf(50.00))
                .minOrderAmount(BigDecimal.valueOf(500.00)) // Min order ₹500
                .isActive(true)
                .build());

        mockMvc.perform(post("/api/me/cart/apply-promo")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(ApplyPromoRequest.builder().code("MIN500").build())))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.message", containsString("Minimum order amount")));
    }

    // =========================================================================
    // 3. Checkout and Payment Integration Tests
    // =========================================================================

    @Test
    void testCheckoutWithPromoCodeAppliesDiscountAndUpdatesRazorpayAmount() throws Exception {
        // Add 1 x product1 (₹1000) to customer cart
        mockMvc.perform(post("/api/me/cart/items")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(CreateCartItemRequest.builder()
                                .productId(product1.getId())
                                .quantity(1)
                                .build())))
                .andExpect(status().isCreated());

        PromoCode promo = promoCodeRepository.save(PromoCode.builder()
                .code("CHECKOUT15")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(BigDecimal.valueOf(15.00))
                .minOrderAmount(BigDecimal.valueOf(500.00))
                .maxDiscountAmount(BigDecimal.valueOf(300.00))
                .usageLimit(10)
                .usedCount(0)
                .perUserLimit(1)
                .isActive(true)
                .build());

        // Checkout with promoCode: "checkout15"
        CheckoutRequest checkoutReq = CheckoutRequest.builder()
                .addressId(customerAddress.getId())
                .promoCode("checkout15")
                .notes("Deliver in afternoon")
                .build();

        String responseJson = mockMvc.perform(post("/api/me/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.orderNo", notNullValue()))
                .andExpect(jsonPath("$.data.subtotal", is(1000.00)))
                .andExpect(jsonPath("$.data.discountAmount", is(150.00))) // 15% of 1000 = 150
                .andExpect(jsonPath("$.data.promoCode", is("CHECKOUT15")))
                .andExpect(jsonPath("$.data.totalAmount", is(850.00))) // 1000 - 150 + 0 + 0 = 850
                .andReturn().getResponse().getContentAsString();

        Long orderId = objectMapper.readTree(responseJson).get("data").get("id").asLong();

        // Verify PromoCode.usedCount incremented in DB
        PromoCode promoAfterCheckout = promoCodeRepository.findById(promo.getId()).orElseThrow();
        assertEquals(1, promoAfterCheckout.getUsedCount());

        // Verify Razorpay Payment Order Amount in paise reflects the discounted totalAmount: 850 * 100 = 85000 paise
        mockMvc.perform(post("/api/me/orders/" + orderId + "/payments/order")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.amount", is(850.00)))
                .andExpect(jsonPath("$.data.amountInPaise", is(85000)));

        // Test customer cancellation restores usedCount
        mockMvc.perform(post("/api/me/orders/" + orderId + "/cancel")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\": \"Changed mind\"}"))
                .andExpect(status().isOk());

        PromoCode promoAfterCancel = promoCodeRepository.findById(promo.getId()).orElseThrow();
        assertEquals(0, promoAfterCancel.getUsedCount());
    }

    @Test
    void testPerUserLimitEnforcedOnSecondOrder() throws Exception {
        promoCodeRepository.save(PromoCode.builder()
                .code("ONCEONLY")
                .discountType(DiscountType.FIXED_AMOUNT)
                .discountValue(BigDecimal.valueOf(100.00))
                .perUserLimit(1) // Only once per user
                .isActive(true)
                .build());

        // Place first order
        mockMvc.perform(post("/api/me/cart/items")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(CreateCartItemRequest.builder()
                                .productId(product1.getId())
                                .quantity(1)
                                .build())))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/me/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(CheckoutRequest.builder()
                                .addressId(customerAddress.getId())
                                .promoCode("ONCEONLY")
                                .build())))
                .andExpect(status().isCreated());

        // Mark first order as CONFIRMED so it counts as used and is not treated as a superseded pending order
        List<Order> orders = orderRepository.findAll();
        assertEquals(1, orders.size());
        Order firstOrder = orders.get(0);
        firstOrder.setOrderStatus(OrderStatus.CONFIRMED);
        firstOrder.setPaymentStatus(PaymentStatus.PAID);
        orderRepository.save(firstOrder);

        // Add item again for a second order
        mockMvc.perform(post("/api/me/cart/items")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(CreateCartItemRequest.builder()
                                .productId(product2.getId())
                                .quantity(2)
                                .build())))
                .andExpect(status().isCreated());

        // Second checkout with same code should be rejected due to perUserLimit
        mockMvc.perform(post("/api/me/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(CheckoutRequest.builder()
                                .addressId(customerAddress.getId())
                                .promoCode("ONCEONLY")
                                .build())))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.message", containsString("maximum number of times allowed")));
    }
}
