package com.example.PawConnect.controller;

import com.example.PawConnect.config.RequestIdFilter;
import com.example.PawConnect.dto.request.admin.OrderStatusRequest;
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
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
class OrderAndCheckoutIntegrationTests {

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
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private OrderStatusHistoryRepository orderStatusHistoryRepository;

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
    private PaymentRepository paymentRepository;

    @Autowired
    private PaymentOrderRepository paymentOrderRepository;

    @Autowired
    private com.example.PawConnect.service.OrderService orderService;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private ServiceBookingRepository serviceBookingRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private ServiceCategoryRepository serviceCategoryRepository;

    @Autowired
    private ServiceProviderRepository serviceProviderRepository;

    @Autowired
    private VeterinarianRepository veterinarianRepository;

    @Autowired
    private PetRepository petRepository;

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

    private User admin;
    private String adminToken;

    private Address aliceAddress;
    private Address bobAddress;

    private Product petBed;
    private Product petShampoo;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .addFilters(requestIdFilter, springSecurityFilterChain)
                .build();

        cleanup();

        Role petOwnerRole = roleRepository.findByRoleCode("PET_OWNER").orElseGet(() ->
                roleRepository.save(Role.builder().roleCode("PET_OWNER").roleName("Pet Owner").build()));
        Role adminRole = roleRepository.findByRoleCode("ADMIN").orElseGet(() ->
                roleRepository.save(Role.builder().roleCode("ADMIN").roleName("Admin").build()));

        alice = userRepository.save(User.builder()
                .firstName("Alice")
                .lastName("Walker")
                .email("alice_order@test.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .status(UserStatus.ACTIVE)
                .tokenVersion(1)
                .build());
        userRoleRepository.save(UserRole.builder().user(alice).role(petOwnerRole).build());
        aliceToken = jwtService.generateAccessToken(alice, java.util.List.of("ROLE_PET_OWNER"));

        bob = userRepository.save(User.builder()
                .firstName("Bob")
                .lastName("Jones")
                .email("bob_order@test.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .status(UserStatus.ACTIVE)
                .tokenVersion(1)
                .build());
        userRoleRepository.save(UserRole.builder().user(bob).role(petOwnerRole).build());
        bobToken = jwtService.generateAccessToken(bob, java.util.List.of("ROLE_PET_OWNER"));

        admin = userRepository.save(User.builder()
                .firstName("Admin")
                .lastName("Manager")
                .email("admin_order@test.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .status(UserStatus.ACTIVE)
                .tokenVersion(1)
                .build());
        userRoleRepository.save(UserRole.builder().user(admin).role(adminRole).build());
        adminToken = jwtService.generateAccessToken(admin, java.util.List.of("ROLE_ADMIN"));

        aliceAddress = addressRepository.save(Address.builder()
                .user(alice)
                .recipientName("Alice Walker")
                .phone("+919876543210")
                .addressLine1("123 Green Valley")
                .addressLine2("Apt 4B")
                .city("Bengaluru")
                .state("Karnataka")
                .postalCode("560001")
                .country("India")
                .isDefault(true)
                .build());

        bobAddress = addressRepository.save(Address.builder()
                .user(bob)
                .recipientName("Bob Jones")
                .phone("+919123456789")
                .addressLine1("456 Blue Ridge")
                .city("Mumbai")
                .state("Maharashtra")
                .postalCode("400001")
                .country("India")
                .isDefault(true)
                .build());

        ProductCategory category = productCategoryRepository.save(ProductCategory.builder()
                .name("Pet Essentials")
                .isActive(true)
                .build());

        petBed = productRepository.save(Product.builder()
                .category(category)
                .name("Orthopedic Pet Bed")
                .sku("SKU-PET-BED-01")
                .price(BigDecimal.valueOf(100.00))
                .stockQuantity(10)
                .status(ProductStatus.ACTIVE)
                .isActive(true)
                .build());

        petShampoo = productRepository.save(Product.builder()
                .category(category)
                .name("Herbal Pet Shampoo")
                .sku("SKU-PET-SHAMPOO-01")
                .price(BigDecimal.valueOf(25.00))
                .stockQuantity(15)
                .status(ProductStatus.ACTIVE)
                .isActive(true)
                .build());
    }

    private void addItemsToCart(String token, Product product, int quantity) throws Exception {
        CreateCartItemRequest request = CreateCartItemRequest.builder()
                .productId(product.getId())
                .quantity(quantity)
                .build();

        mockMvc.perform(post("/api/me/cart/items")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    @Test
    void testCheckout_SuccessWithImmutableSnapshotsAndAtomicStockDecrement() throws Exception {
        addItemsToCart(aliceToken, petBed, 2);      // 2 * 100 = 200
        addItemsToCart(aliceToken, petShampoo, 1);  // 1 * 25 = 25

        CheckoutRequest checkoutRequest = CheckoutRequest.builder()
                .addressId(aliceAddress.getId())
                .notes("Leave at doorstep")
                .build();

        String responseJson = mockMvc.perform(post("/api/me/orders")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.orderNo", notNullValue()))
                .andExpect(jsonPath("$.data.subtotal", is(225.00)))
                .andExpect(jsonPath("$.data.totalAmount", is(225.00)))
                .andExpect(jsonPath("$.data.orderStatus", is("PENDING")))
                .andExpect(jsonPath("$.data.paymentStatus", is("PENDING")))
                .andExpect(jsonPath("$.data.deliveryRecipientName", is("Alice Walker")))
                .andExpect(jsonPath("$.data.deliveryAddressLine1", is("123 Green Valley")))
                .andExpect(jsonPath("$.data.deliveryCity", is("Bengaluru")))
                .andExpect(jsonPath("$.data.items", hasSize(2)))
                .andReturn().getResponse().getContentAsString();

        Long orderId = objectMapper.readTree(responseJson).get("data").get("id").asLong();

        // 1. Verify that inventory decremented atomically
        Product refreshedBed = productRepository.findById(petBed.getId()).orElseThrow();
        assertEquals(8, refreshedBed.getStockQuantity()); // 10 - 2 = 8

        Product refreshedShampoo = productRepository.findById(petShampoo.getId()).orElseThrow();
        assertEquals(14, refreshedShampoo.getStockQuantity()); // 15 - 1 = 14

        // 2. Verify that active cart remains intact before payment confirmation
        mockMvc.perform(get("/api/me/cart")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items", hasSize(2)));

        // 3. Verify order items preserve historical snapshots
        List<OrderItem> savedItems = orderItemRepository.findByOrderId(orderId);
        assertEquals(2, savedItems.size());
        for (OrderItem item : savedItems) {
            assertNotNull(item.getProductName());
            assertNotNull(item.getProductSku());
            assertNotNull(item.getUnitPrice());
            assertNotNull(item.getLineTotal());
        }
    }

    @Test
    void testCheckout_ConsecutiveOrdersBySameUser() throws Exception {
        // First Order
        addItemsToCart(aliceToken, petBed, 1);
        CheckoutRequest checkoutRequest1 = CheckoutRequest.builder()
                .addressId(aliceAddress.getId())
                .notes("First order")
                .build();

        mockMvc.perform(post("/api/me/orders")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutRequest1)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)));

        // Second Order
        addItemsToCart(aliceToken, petShampoo, 1);
        CheckoutRequest checkoutRequest2 = CheckoutRequest.builder()
                .addressId(aliceAddress.getId())
                .notes("Second order")
                .build();

        mockMvc.perform(post("/api/me/orders")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutRequest2)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    void testCheckout_EmptyCartRejected() throws Exception {
        CheckoutRequest checkoutRequest = CheckoutRequest.builder()
                .addressId(aliceAddress.getId())
                .build();

        mockMvc.perform(post("/api/me/orders")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("empty shopping cart")));
    }

    @Test
    void testCheckout_ForeignAddressForbidden() throws Exception {
        addItemsToCart(aliceToken, petBed, 1);

        // Alice tries to use Bob's address
        CheckoutRequest checkoutRequest = CheckoutRequest.builder()
                .addressId(bobAddress.getId())
                .build();

        mockMvc.perform(post("/api/me/orders")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutRequest)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    void testCheckout_CrossCustomerOrderAccessForbidden() throws Exception {
        addItemsToCart(aliceToken, petBed, 1);
        CheckoutRequest checkoutRequest = CheckoutRequest.builder().addressId(aliceAddress.getId()).build();

        String responseJson = mockMvc.perform(post("/api/me/orders")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutRequest)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long aliceOrderId = objectMapper.readTree(responseJson).get("data").get("id").asLong();

        // Bob attempts to view Alice's order
        mockMvc.perform(get("/api/me/orders/" + aliceOrderId)
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void testOrderCancellation_RestoresInventoryOnceIdempotently() throws Exception {
        addItemsToCart(aliceToken, petBed, 3); // Initial stock 10 -> after checkout 7
        CheckoutRequest checkoutRequest = CheckoutRequest.builder().addressId(aliceAddress.getId()).build();

        String responseJson = mockMvc.perform(post("/api/me/orders")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutRequest)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long orderId = objectMapper.readTree(responseJson).get("data").get("id").asLong();

        Product afterCheckout = productRepository.findById(petBed.getId()).orElseThrow();
        assertEquals(7, afterCheckout.getStockQuantity());

        // Cancel order
        mockMvc.perform(patch("/api/me/orders/" + orderId + "/cancel")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Changed my mind\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.orderStatus", is("CANCELLED")));

        // Inventory must be restored: 7 + 3 = 10
        Product afterCancel = productRepository.findById(petBed.getId()).orElseThrow();
        assertEquals(10, afterCancel.getStockQuantity());

        // Second cancellation attempt (idempotent, must not restore stock again)
        mockMvc.perform(patch("/api/me/orders/" + orderId + "/cancel")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.orderStatus", is("CANCELLED")));

        Product afterSecondCancel = productRepository.findById(petBed.getId()).orElseThrow();
        assertEquals(10, afterSecondCancel.getStockQuantity(), "Stock must not be restored twice on duplicate cancellation");
    }

    @Test
    void testAdminOrderStatusLifecycle_TransitionsCorrectly() throws Exception {
        addItemsToCart(aliceToken, petBed, 1);
        CheckoutRequest checkoutRequest = CheckoutRequest.builder().addressId(aliceAddress.getId()).build();

        String responseJson = mockMvc.perform(post("/api/me/orders")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutRequest)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long orderId = objectMapper.readTree(responseJson).get("data").get("id").asLong();

        // 1. Payment Guard: Admin cannot mark PACKED if order is UNPAID (PaymentStatus.PENDING)
        mockMvc.perform(patch("/api/admin/orders/" + orderId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(OrderStatusRequest.builder()
                                .orderStatus(OrderStatus.PACKED)
                                .remarks("Attempt packing unpaid order")
                                .build())))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code", is("BUSINESS_RULE_VIOLATION")));

        // Simulate successful payment
        Order orderEntity = orderRepository.findById(orderId).orElseThrow();
        orderEntity.setPaymentStatus(PaymentStatus.PAID);
        orderRepository.save(orderEntity);

        // 2. Admin marks PACKED with logistics details
        mockMvc.perform(patch("/api/admin/orders/" + orderId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(OrderStatusRequest.builder()
                                .orderStatus(OrderStatus.PACKED)
                                .courierPartner("Delhivery")
                                .packageWeightKg(BigDecimal.valueOf(1.20))
                                .packageDimensions("30x20x10 cm")
                                .remarks("Packed in warehouse")
                                .build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.orderStatus", is("PACKED")))
                .andExpect(jsonPath("$.data.shippingLabelNumber", notNullValue()))
                .andExpect(jsonPath("$.data.invoiceNumber", notNullValue()))
                .andExpect(jsonPath("$.data.packageWeightKg", is(1.20)))
                .andExpect(jsonPath("$.data.packageDimensions", is("30x20x10 cm")));

        // 3. Admin marks SHIPPED with auto-generated AWB
        mockMvc.perform(patch("/api/admin/orders/" + orderId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(OrderStatusRequest.builder()
                                .orderStatus(OrderStatus.SHIPPED)
                                .courierPartner("BlueDart")
                                .autoGenerateAwb(true)
                                .estimatedDeliveryDate(LocalDate.now().plusDays(3))
                                .remarks("Handed over to BlueDart courier")
                                .build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.orderStatus", is("SHIPPED")))
                .andExpect(jsonPath("$.data.courierPartner", is("BlueDart")))
                .andExpect(jsonPath("$.data.trackingNumber", startsWith("AWBPC")))
                .andExpect(jsonPath("$.data.estimatedDeliveryDate", notNullValue()));

        // 4. Verify Printable Shipping Label ("Shift Label") Endpoint
        mockMvc.perform(get("/api/admin/orders/" + orderId + "/shipping-label")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.orderId", is(orderId.intValue())))
                .andExpect(jsonPath("$.data.paymentMode", is("PREPAID")))
                .andExpect(jsonPath("$.data.courierPartner", is("BlueDart")))
                .andExpect(jsonPath("$.data.awbNumber", startsWith("AWBPC")))
                .andExpect(jsonPath("$.data.shippingLabelNumber", notNullValue()))
                .andExpect(jsonPath("$.data.shipFrom", containsString("PawConnect Central Fulfillment Center")))
                .andExpect(jsonPath("$.data.recipientName", is("Alice Walker")))
                .andExpect(jsonPath("$.data.postalCode", is("560001")))
                .andExpect(jsonPath("$.data.items", hasSize(greaterThanOrEqualTo(1))));

        // 4b. Verify Batch Shipping Label Endpoint
        mockMvc.perform(post("/api/admin/orders/shipping-labels/batch")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(com.example.PawConnect.dto.request.admin.BatchShippingLabelRequest.builder()
                                .orderIds(List.of(orderId))
                                .build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].orderId", is(orderId.intValue())))
                .andExpect(jsonPath("$.data[0].courierPartner", is("BlueDart")))
                .andExpect(jsonPath("$.data[0].awbNumber", startsWith("AWBPC")));

        // 5. Customer cannot cancel a SHIPPED order
        mockMvc.perform(patch("/api/me/orders/" + orderId + "/cancel")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success", is(false)));

        // 6. Admin marks DELIVERED
        mockMvc.perform(patch("/api/admin/orders/" + orderId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(OrderStatusRequest.builder()
                                .orderStatus(OrderStatus.DELIVERED)
                                .remarks("Delivered to customer")
                                .build())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.orderStatus", is("DELIVERED")))
                .andExpect(jsonPath("$.data.deliveredAt", notNullValue()));

        // 7. Terminal state: DELIVERED cannot transition back to PACKED
        mockMvc.perform(patch("/api/admin/orders/" + orderId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(OrderStatusRequest.builder()
                                .orderStatus(OrderStatus.PACKED)
                                .build())))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    void testConcurrentCheckout_PreventsOverselling() throws Exception {
        // Set petBed stock to exactly 2 units
        petBed.setStockQuantity(2);
        productRepository.save(petBed);

        // Pre-create carts for Alice and Bob each wanting 2 units (total demanded = 4 units)
        addItemsToCart(aliceToken, petBed, 2);
        addItemsToCart(bobToken, petBed, 2);

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch latch = new CountDownLatch(1);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);

        Callable<Void> taskAlice = () -> {
            latch.await();
            try {
                mockMvc.perform(post("/api/me/orders")
                                .header("Authorization", "Bearer " + aliceToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(CheckoutRequest.builder().addressId(aliceAddress.getId()).build())))
                        .andExpect(result -> {
                            int status = result.getResponse().getStatus();
                            if (status == 201) successCount.incrementAndGet();
                            else failureCount.incrementAndGet();
                        });
            } catch (Exception e) {
                failureCount.incrementAndGet();
            }
            return null;
        };

        Callable<Void> taskBob = () -> {
            latch.await();
            try {
                mockMvc.perform(post("/api/me/orders")
                                .header("Authorization", "Bearer " + bobToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(CheckoutRequest.builder().addressId(bobAddress.getId()).build())))
                        .andExpect(result -> {
                            int status = result.getResponse().getStatus();
                            if (status == 201) successCount.incrementAndGet();
                            else failureCount.incrementAndGet();
                        });
            } catch (Exception e) {
                failureCount.incrementAndGet();
            }
            return null;
        };

        Future<Void> f1 = executor.submit(taskAlice);
        Future<Void> f2 = executor.submit(taskBob);

        // Fire both checkout requests concurrently
        latch.countDown();

        f1.get(10, TimeUnit.SECONDS);
        f2.get(10, TimeUnit.SECONDS);
        executor.shutdown();

        // Exactly one customer must succeed and one must fail
        assertEquals(1, successCount.get(), "Exactly one concurrent checkout must succeed");
        assertEquals(1, failureCount.get(), "Exactly one concurrent checkout must fail due to insufficient inventory");

        // Remaining stock must be 0, never negative
        Product finalProduct = productRepository.findById(petBed.getId()).orElseThrow();
        assertEquals(0, finalProduct.getStockQuantity());
    }

    @Test
    void testPaidOrderInvoice_ReturnsFullGstBreakdown() throws Exception {
        Order order = orderRepository.save(Order.builder()
                .orderNo("ORD-TEST-INV-001")
                .user(alice)
                .address(aliceAddress)
                .subtotal(BigDecimal.valueOf(200.00))
                .shippingFee(BigDecimal.ZERO)
                .taxAmount(BigDecimal.valueOf(36.00))
                .discountAmount(BigDecimal.ZERO)
                .totalAmount(BigDecimal.valueOf(200.00))
                .paymentStatus(PaymentStatus.PAID)
                .orderStatus(OrderStatus.CONFIRMED)
                .courierPartner("BlueDart Express")
                .trackingNumber("AWB-BLUEDART-8888")
                .invoiceNumber("INV-ORD-TEST-001")
                .build());

        orderItemRepository.save(OrderItem.builder()
                .order(order)
                .product(petBed)
                .productName(petBed.getName())
                .productSku(petBed.getSku())
                .quantity(2)
                .unitPrice(BigDecimal.valueOf(100.00))
                .lineTotal(BigDecimal.valueOf(200.00))
                .build());

        paymentRepository.save(Payment.builder()
                .user(alice)
                .paymentReference("PAY-REF-ORD-INV-001")
                .paymentFor(PaymentFor.ORDER)
                .referenceId(order.getId())
                .amount(BigDecimal.valueOf(200.00))
                .paymentMethod("Razorpay Online")
                .gatewayOrderId("order_rzp_inv_101")
                .gatewayPaymentId("pay_rzp_inv_101")
                .status(PaymentStatus.PAID)
                .build());

        mockMvc.perform(get("/api/invoices/order/" + order.getId())
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.invoiceType").value("ORDER"))
                .andExpect(jsonPath("$.data.resourceId").value(order.getId().intValue()))
                .andExpect(jsonPath("$.data.invoiceNumber").value("INV-ORD-TEST-001"))
                .andExpect(jsonPath("$.data.courierPartner").value("BlueDart Express"))
                .andExpect(jsonPath("$.data.awbNumber").value("AWB-BLUEDART-8888"))
                .andExpect(jsonPath("$.data.customerName").value("Alice Walker"))
                .andExpect(jsonPath("$.data.hsnSacCode").value("2309"))
                .andExpect(jsonPath("$.data.cgstRate").value(9.00))
                .andExpect(jsonPath("$.data.sgstRate").value(9.00))
                .andExpect(jsonPath("$.data.items", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data.items[0].hsnSacCode").value("2309"));
    }

    @Test
    void testUnpaidOrderInvoice_ReturnsBadRequest() throws Exception {
        Order pendingOrder = orderRepository.save(Order.builder()
                .orderNo("ORD-TEST-UNPAID-001")
                .user(alice)
                .address(aliceAddress)
                .subtotal(BigDecimal.valueOf(100.00))
                .shippingFee(BigDecimal.ZERO)
                .taxAmount(BigDecimal.valueOf(18.00))
                .totalAmount(BigDecimal.valueOf(100.00))
                .paymentStatus(PaymentStatus.PENDING)
                .orderStatus(OrderStatus.PENDING)
                .build());

        mockMvc.perform(get("/api/invoices/order/" + pendingOrder.getId())
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message", containsString("Tax Invoice is only issued for paid transactions")));
    }

    @Test
    void testPaidAppointmentAndServiceBookingInvoices_ReturnsSacAndDetails() throws Exception {
        // 1. Setup Pet
        Pet pet = petRepository.save(Pet.builder()
                .owner(alice)
                .name("Max")
                .species("Dog")
                .breed("Golden Retriever")
                .gender(PetGender.MALE)
                .status(PetStatus.ACTIVE)
                .build());

        // 2. Setup Veterinarian
        User vetUser = userRepository.save(User.builder()
                .firstName("Vet")
                .lastName("Specialist")
                .email("vet_inv@test.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .status(UserStatus.ACTIVE)
                .tokenVersion(1)
                .build());

        Veterinarian vet = veterinarianRepository.save(Veterinarian.builder()
                .user(vetUser)
                .clinicName("PawCare Vet Hospital")
                .clinicAddress("42 Animal Clinic Road, Bengaluru")
                .licenseNumber("VET-LIC-TEST-001")
                .consultationFee(BigDecimal.valueOf(600.00))
                .verificationStatus(VeterinarianVerificationStatus.APPROVED)
                .isActive(true)
                .build());

        Payment aptPayment = paymentRepository.save(Payment.builder()
                .user(alice)
                .paymentReference("PAY-REF-APT-001")
                .paymentFor(PaymentFor.APPOINTMENT)
                .referenceId(1L)
                .amount(BigDecimal.valueOf(600.00))
                .paymentMethod("Razorpay Online")
                .gatewayOrderId("order_rzp_apt_001")
                .gatewayPaymentId("pay_rzp_apt_001")
                .status(PaymentStatus.PAID)
                .build());

        Appointment apt = appointmentRepository.save(Appointment.builder()
                .appointmentNo("APT-TEST-001")
                .pet(pet)
                .veterinarian(vet)
                .appointmentDate(LocalDate.now().plusDays(2))
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(10, 30))
                .reason("General Annual Health Checkup")
                .consultationFee(BigDecimal.valueOf(600.00))
                .status(AppointmentStatus.CONFIRMED)
                .payment(aptPayment)
                .build());

        aptPayment.setReferenceId(apt.getId());
        paymentRepository.save(aptPayment);

        // Verify Appointment Invoice
        mockMvc.perform(get("/api/invoices/appointment/" + apt.getId())
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.invoiceType").value("APPOINTMENT"))
                .andExpect(jsonPath("$.data.petName").value("Max"))
                .andExpect(jsonPath("$.data.hsnSacCode").value("998351"))
                .andExpect(jsonPath("$.data.items[0].hsnSacCode").value("9983"))
                .andExpect(jsonPath("$.data.customerName").value("Alice Walker"));

        // 3. Setup Service Provider and Service Booking
        User providerUser = userRepository.save(User.builder()
                .firstName("Groomer")
                .lastName("Pro")
                .email("groomer_inv@test.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .status(UserStatus.ACTIVE)
                .tokenVersion(1)
                .build());

        ServiceProvider provider = serviceProviderRepository.save(ServiceProvider.builder()
                .user(providerUser)
                .businessName("PawSpa Grooming Studio")
                .phone("+919876543210")
                .address("10 Paw Lane, Bengaluru")
                .providerType(ProviderType.GROOMER)
                .verificationStatus(ServiceProviderVerificationStatus.APPROVED)
                .isActive(true)
                .build());

        ServiceCategory srvCategory = serviceCategoryRepository.save(ServiceCategory.builder()
                .name("Grooming & Bath")
                .serviceType(ServiceType.GROOMING)
                .isActive(true)
                .build());

        Service srv = serviceRepository.save(Service.builder()
                .provider(provider)
                .category(srvCategory)
                .name("Full Luxury Spa Bath & Hair Trim")
                .price(BigDecimal.valueOf(1200.00))
                .durationMinutes(60)
                .isActive(true)
                .build());

        Payment srvPayment = paymentRepository.save(Payment.builder()
                .user(alice)
                .paymentReference("PAY-REF-SRV-001")
                .paymentFor(PaymentFor.SERVICE_BOOKING)
                .referenceId(1L)
                .amount(BigDecimal.valueOf(1200.00))
                .paymentMethod("Razorpay Online")
                .gatewayOrderId("order_rzp_srv_001")
                .gatewayPaymentId("pay_rzp_srv_001")
                .status(PaymentStatus.PAID)
                .build());

        ServiceBooking booking = serviceBookingRepository.save(ServiceBooking.builder()
                .bookingNo("SB-TEST-001")
                .pet(pet)
                .provider(provider)
                .service(srv)
                .bookingDate(LocalDate.now().plusDays(3))
                .startTime(LocalTime.of(14, 0))
                .endTime(LocalTime.of(15, 0))
                .price(BigDecimal.valueOf(1200.00))
                .status(BookingStatus.CONFIRMED)
                .payment(srvPayment)
                .build());

        srvPayment.setReferenceId(booking.getId());
        paymentRepository.save(srvPayment);

        // Verify Service Booking Invoice
        mockMvc.perform(get("/api/invoices/service-booking/" + booking.getId())
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.invoiceType").value("SERVICE_BOOKING"))
                .andExpect(jsonPath("$.data.petName").value("Max"))
                .andExpect(jsonPath("$.data.hsnSacCode").value("999722"))
                .andExpect(jsonPath("$.data.items[0].hsnSacCode").value("9997"))
                .andExpect(jsonPath("$.data.customerName").value("Alice Walker"));
    }

    @Test
    void testPaymentInvoiceLookup_ResolvesLinkedOrderAccurately() throws Exception {
        Order order = orderRepository.save(Order.builder()
                .orderNo("ORD-TEST-LOOKUP-001")
                .user(alice)
                .address(aliceAddress)
                .subtotal(BigDecimal.valueOf(150.00))
                .shippingFee(BigDecimal.ZERO)
                .taxAmount(BigDecimal.valueOf(27.00))
                .totalAmount(BigDecimal.valueOf(150.00))
                .paymentStatus(PaymentStatus.PAID)
                .orderStatus(OrderStatus.CONFIRMED)
                .invoiceNumber("INV-LOOKUP-001")
                .build());

        Payment payment = paymentRepository.save(Payment.builder()
                .user(alice)
                .paymentReference("PAY-REF-LOOKUP-12345")
                .paymentFor(PaymentFor.ORDER)
                .referenceId(order.getId())
                .amount(BigDecimal.valueOf(150.00))
                .paymentMethod("Razorpay Online")
                .gatewayOrderId("order_rzp_lookup_987")
                .gatewayPaymentId("pay_rzp_lookup_987")
                .status(PaymentStatus.PAID)
                .build());

        // 1. Lookup by Razorpay Gateway Order ID
        mockMvc.perform(get("/api/invoices/payment/order_rzp_lookup_987")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.invoiceType").value("ORDER"))
                .andExpect(jsonPath("$.data.resourceId").value(order.getId().intValue()))
                .andExpect(jsonPath("$.data.invoiceNumber").value("INV-LOOKUP-001"));

        // 2. Lookup by Internal Payment Reference
        mockMvc.perform(get("/api/invoices/payment/PAY-REF-LOOKUP-12345")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.invoiceType").value("ORDER"))
                .andExpect(jsonPath("$.data.resourceId").value(order.getId().intValue()));

        // 3. Lookup by Primary Key ID
        mockMvc.perform(get("/api/invoices/payment/" + payment.getId())
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.invoiceType").value("ORDER"))
                .andExpect(jsonPath("$.data.resourceId").value(order.getId().intValue()));
    }

    @Test
    void testCheckoutSets15MinutePaymentWindowAndPendingStatus() throws Exception {
        addItemsToCart(aliceToken, petBed, 1);

        CheckoutRequest checkoutRequest = CheckoutRequest.builder()
                .addressId(aliceAddress.getId())
                .notes("Handle with care")
                .build();

        String responseJson = mockMvc.perform(post("/api/me/orders")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.orderStatus", is("PENDING")))
                .andExpect(jsonPath("$.data.paymentStatus", is("PENDING")))
                .andExpect(jsonPath("$.data.paymentExpiresAt", notNullValue()))
                .andExpect(jsonPath("$.data.remainingPaymentSeconds", greaterThan(800)))
                .andExpect(jsonPath("$.data.canRetryPayment", is(true)))
                .andReturn().getResponse().getContentAsString();

        Long orderId = objectMapper.readTree(responseJson).get("data").get("id").asLong();
        Order savedOrder = orderRepository.findById(orderId).orElseThrow();
        assertNotNull(savedOrder.getPaymentExpiresAt());
        assertTrue(savedOrder.getPaymentExpiresAt().isAfter(Instant.now().plus(Duration.ofMinutes(14))));
    }

    @Test
    void testIdempotentCheckout_ReusesExistingPendingOrderWithinWindow() throws Exception {
        addItemsToCart(aliceToken, petBed, 1);

        CheckoutRequest checkoutRequest = CheckoutRequest.builder()
                .addressId(aliceAddress.getId())
                .notes("First attempt")
                .build();

        // 1st checkout
        String firstResponse = mockMvc.perform(post("/api/me/orders")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutRequest)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Long firstOrderId = objectMapper.readTree(firstResponse).get("data").get("id").asLong();

        // Bed stock should be 9 (10 - 1)
        Product bedAfterFirst = productRepository.findById(petBed.getId()).orElseThrow();
        assertEquals(9, bedAfterFirst.getStockQuantity());

        // 2nd checkout with identical items
        String secondResponse = mockMvc.perform(post("/api/me/orders")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutRequest)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Long secondOrderId = objectMapper.readTree(secondResponse).get("data").get("id").asLong();

        // Should be the exact same pending order ID
        assertEquals(firstOrderId, secondOrderId);

        // Crucial: Bed stock must NOT be decremented again (still 9, not 8)
        Product bedAfterSecond = productRepository.findById(petBed.getId()).orElseThrow();
        assertEquals(9, bedAfterSecond.getStockQuantity());
    }

    @Test
    void testExpiredOrder_AutoCancelsRestoresStockAndRejectsPaymentRetry() throws Exception {
        addItemsToCart(aliceToken, petBed, 2);

        CheckoutRequest checkoutRequest = CheckoutRequest.builder()
                .addressId(aliceAddress.getId())
                .notes("Window test")
                .build();

        String responseJson = mockMvc.perform(post("/api/me/orders")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutRequest)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Long orderId = objectMapper.readTree(responseJson).get("data").get("id").asLong();

        // Bed stock was decremented from 10 to 8
        assertEquals(8, productRepository.findById(petBed.getId()).orElseThrow().getStockQuantity());

        // Simulate 15-minute window elapsed in the past
        Order order = orderRepository.findById(orderId).orElseThrow();
        order.setPaymentExpiresAt(Instant.now().minusSeconds(30));
        orderRepository.save(order);

        // Fetching the order triggers lazy read-time expiration check
        mockMvc.perform(get("/api/me/orders/" + orderId)
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.orderStatus", is("CANCELLED")))
                .andExpect(jsonPath("$.data.paymentStatus", is("FAILED")))
                .andExpect(jsonPath("$.data.canRetryPayment", is(false)));

        // Stock must be restored back from 8 to 10
        assertEquals(10, productRepository.findById(petBed.getId()).orElseThrow().getStockQuantity());

        // Attempting payment retry on expired order must be rejected with 422 Unprocessable Entity
        mockMvc.perform(post("/api/payment/create-order")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"orderId\": " + orderId + "}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.message", containsString("Payment window of 15 minutes has expired")));
    }

    @Test
    void testCheckout_ExpiresOrderWithMultiplePaymentAttempts() throws Exception {
        addItemsToCart(aliceToken, petBed, 2);

        CheckoutRequest checkoutRequest = CheckoutRequest.builder()
                .addressId(aliceAddress.getId())
                .notes("Expired order with multiple payment attempts")
                .build();

        String responseJson = mockMvc.perform(post("/api/me/orders")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutRequest)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Long expiredOrderId = objectMapper.readTree(responseJson).get("data").get("id").asLong();

        Order expiredOrder = orderRepository.findById(expiredOrderId).orElseThrow();
        expiredOrder.setPaymentExpiresAt(Instant.now().minusSeconds(30));
        orderRepository.save(expiredOrder);

        List<PaymentOrder> paymentAttempts = List.of(
                buildPaymentAttempt(expiredOrderId, "order_expired_attempt_1", PaymentStatus.CREATED),
                buildPaymentAttempt(expiredOrderId, "order_expired_attempt_2", PaymentStatus.FAILED),
                buildPaymentAttempt(expiredOrderId, "order_expired_attempt_3", PaymentStatus.PENDING)
        );
        paymentOrderRepository.saveAll(paymentAttempts);

        mockMvc.perform(post("/api/me/orders")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.orderStatus", is("PENDING")));

        Order cancelledOrder = orderRepository.findById(expiredOrderId).orElseThrow();
        assertEquals(OrderStatus.CANCELLED, cancelledOrder.getOrderStatus());
        assertEquals(PaymentStatus.FAILED, cancelledOrder.getPaymentStatus());
        assertTrue(paymentOrderRepository.findAllByOrderId(expiredOrderId).stream()
                .allMatch(attempt -> attempt.getStatus() == PaymentStatus.FAILED));

        // Expiry restores the old reservation and the new checkout reserves the same items again.
        assertEquals(8, productRepository.findById(petBed.getId()).orElseThrow().getStockQuantity());
    }

    private PaymentOrder buildPaymentAttempt(Long orderId, String razorpayOrderId, PaymentStatus status) {
        return PaymentOrder.builder()
                .razorpayOrderId(razorpayOrderId)
                .userId(alice.getId())
                .orderId(orderId)
                .amountInPaise(20000L)
                .currency("INR")
                .status(status)
                .build();
    }

    @Test
    void testRecordPaymentFailure_DoesNotPrematurelyCancelInside15MinuteWindow() throws Exception {
        addItemsToCart(aliceToken, petBed, 1);

        CheckoutRequest checkoutRequest = CheckoutRequest.builder()
                .addressId(aliceAddress.getId())
                .build();

        String responseJson = mockMvc.perform(post("/api/me/orders")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutRequest)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Long orderId = objectMapper.readTree(responseJson).get("data").get("id").asLong();

        // User dismissed razorpay or payment failed at gateway within the 15-minute window
        mockMvc.perform(post("/api/payment/record-failure")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"orderId\": " + orderId + ", \"reason\": \"User dismissed checkout\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.canRetryPayment", is(true)))
                .andExpect(jsonPath("$.data.status", is("FAILED")));

        // Order remains in PENDING status because 15 minutes have not passed
        Order orderAfterFailure = orderRepository.findById(orderId).orElseThrow();
        assertEquals(OrderStatus.PENDING, orderAfterFailure.getOrderStatus());

        // Bed stock remains reserved
        assertEquals(9, productRepository.findById(petBed.getId()).orElseThrow().getStockQuantity());
    }

    @Test
    void testCheckout_WithMultiplePreExistingPendingOrders_SucceedsWithoutDetachmentOrLazyInitError() throws Exception {
        // Create 2 existing pending orders for Alice from earlier sessions
        addItemsToCart(aliceToken, petBed, 1);
        CheckoutRequest req1 = CheckoutRequest.builder().addressId(aliceAddress.getId()).notes("Order 1").build();
        mockMvc.perform(post("/api/me/orders")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isCreated());

        addItemsToCart(aliceToken, petShampoo, 1);
        CheckoutRequest req2 = CheckoutRequest.builder().addressId(aliceAddress.getId()).notes("Order 2").build();
        mockMvc.perform(post("/api/me/orders")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req2)))
                .andExpect(status().isCreated());

        // Now place a third checkout with explicit items in request (like the frontend web payload)
        CheckoutRequest req3 = CheckoutRequest.builder()
                .addressId(aliceAddress.getId())
                .notes("Order placed via web")
                .items(List.of(
                        com.example.PawConnect.dto.request.commerce.CheckoutItemRequest.builder()
                                .productId(petBed.getId())
                                .quantity(2)
                                .build()
                ))
                .build();

        mockMvc.perform(post("/api/me/orders")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req3)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.orderNo", notNullValue()))
                .andExpect(jsonPath("$.data.orderStatus", is("PENDING")));
    }

    @AfterEach
    void tearDown() {
        cleanup();
    }

    private void cleanup() {
        serviceBookingRepository.deleteAll();
        appointmentRepository.deleteAll();
        serviceRepository.deleteAll();
        serviceCategoryRepository.deleteAll();
        serviceProviderRepository.deleteAll();
        veterinarianRepository.deleteAll();
        petRepository.deleteAll();
        paymentRepository.deleteAll();
        paymentOrderRepository.deleteAll();
        notificationRepository.deleteAll();
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
