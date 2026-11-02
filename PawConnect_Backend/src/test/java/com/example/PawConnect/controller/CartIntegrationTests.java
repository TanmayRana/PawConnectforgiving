package com.example.PawConnect.controller;

import com.example.PawConnect.config.RequestIdFilter;
import com.example.PawConnect.dto.request.commerce.CreateCartItemRequest;
import com.example.PawConnect.dto.request.commerce.UpdateCartItemRequest;
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

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
class CartIntegrationTests {

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
    private CartItemRepository cartItemRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductCategoryRepository productCategoryRepository;

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

    private Product petFood;
    private Product chewToy;
    private Product inactiveProduct;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .addFilters(requestIdFilter, springSecurityFilterChain)
                .build();

        cleanup();

        Role petOwnerRole = roleRepository.findByRoleCode("PET_OWNER").orElseGet(() ->
                roleRepository.save(Role.builder().roleCode("PET_OWNER").roleName("Pet Owner").build()));

        alice = userRepository.save(User.builder()
                .firstName("Alice")
                .lastName("Customer")
                .email("alice_cart@test.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .status(UserStatus.ACTIVE)
                .tokenVersion(1)
                .build());
        userRoleRepository.save(UserRole.builder().user(alice).role(petOwnerRole).build());
        aliceToken = jwtService.generateAccessToken(alice, java.util.List.of("ROLE_PET_OWNER"));

        bob = userRepository.save(User.builder()
                .firstName("Bob")
                .lastName("Customer")
                .email("bob_cart@test.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .status(UserStatus.ACTIVE)
                .tokenVersion(1)
                .build());
        userRoleRepository.save(UserRole.builder().user(bob).role(petOwnerRole).build());
        bobToken = jwtService.generateAccessToken(bob, java.util.List.of("ROLE_PET_OWNER"));

        ProductCategory category = productCategoryRepository.save(ProductCategory.builder()
                .name("General Supplies")
                .isActive(true)
                .build());

        petFood = productRepository.save(Product.builder()
                .category(category)
                .name("Premium Dog Food")
                .sku("SKU-DOG-FOOD")
                .price(BigDecimal.valueOf(30.00))
                .stockQuantity(10)
                .status(ProductStatus.ACTIVE)
                .isActive(true)
                .build());

        chewToy = productRepository.save(Product.builder()
                .category(category)
                .name("Cat Feather Wand")
                .sku("SKU-CAT-WAND")
                .price(BigDecimal.valueOf(15.00))
                .stockQuantity(20)
                .status(ProductStatus.ACTIVE)
                .isActive(true)
                .build());

        inactiveProduct = productRepository.save(Product.builder()
                .category(category)
                .name("Old Product")
                .sku("SKU-OLD-01")
                .price(BigDecimal.valueOf(5.00))
                .stockQuantity(5)
                .status(ProductStatus.INACTIVE)
                .isActive(false)
                .build());
    }

    @Test
    void testGetEmptyCart_InitializesCleanActiveCart() throws Exception {
        mockMvc.perform(get("/api/me/cart")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("ACTIVE")))
                .andExpect(jsonPath("$.data.items", hasSize(0)))
                .andExpect(jsonPath("$.data.subtotal", is(0)))
                .andExpect(jsonPath("$.data.totalItems", is(0)));
    }

    @Test
    void testAddItemToCart_CalculatesLineTotalsAndSubtotalOnServer() throws Exception {
        CreateCartItemRequest request = CreateCartItemRequest.builder()
                .productId(petFood.getId())
                .quantity(2)
                .build();

        mockMvc.perform(post("/api/me/cart/items")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.items", hasSize(1)))
                .andExpect(jsonPath("$.data.items[0].productName", is("Premium Dog Food")))
                .andExpect(jsonPath("$.data.items[0].unitPrice", is(30.00)))
                .andExpect(jsonPath("$.data.items[0].quantity", is(2)))
                .andExpect(jsonPath("$.data.items[0].lineTotal", is(60.00)))
                .andExpect(jsonPath("$.data.subtotal", is(60.00)))
                .andExpect(jsonPath("$.data.totalItems", is(2)));
    }

    @Test
    void testAddItemToCart_DuplicateProductIncrementsExistingQuantity() throws Exception {
        CreateCartItemRequest request1 = CreateCartItemRequest.builder()
                .productId(petFood.getId())
                .quantity(2)
                .build();

        mockMvc.perform(post("/api/me/cart/items")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request1)))
                .andExpect(status().isCreated());

        CreateCartItemRequest request2 = CreateCartItemRequest.builder()
                .productId(petFood.getId())
                .quantity(3)
                .build();

        mockMvc.perform(post("/api/me/cart/items")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request2)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.items", hasSize(1)))
                .andExpect(jsonPath("$.data.items[0].quantity", is(5)))
                .andExpect(jsonPath("$.data.items[0].lineTotal", is(150.00)))
                .andExpect(jsonPath("$.data.subtotal", is(150.00)))
                .andExpect(jsonPath("$.data.totalItems", is(5)));
    }

    @Test
    void testAddItemToCart_ExceedingStockRejected() throws Exception {
        CreateCartItemRequest request = CreateCartItemRequest.builder()
                .productId(petFood.getId())
                .quantity(15) // Available stock is 10
                .build();

        mockMvc.perform(post("/api/me/cart/items")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("exceeds available stock")));
    }

    @Test
    void testAddItemToCart_InactiveProductRejected() throws Exception {
        CreateCartItemRequest request = CreateCartItemRequest.builder()
                .productId(inactiveProduct.getId())
                .quantity(1)
                .build();

        mockMvc.perform(post("/api/me/cart/items")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("not active or available for purchase")));
    }

    @Test
    void testUpdateCartItemQuantity_Success() throws Exception {
        // Add item first
        CreateCartItemRequest addRequest = CreateCartItemRequest.builder()
                .productId(chewToy.getId())
                .quantity(2)
                .build();

        String responseJson = mockMvc.perform(post("/api/me/cart/items")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addRequest)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long cartItemId = objectMapper.readTree(responseJson).get("data").get("items").get(0).get("id").asLong();

        UpdateCartItemRequest updateRequest = UpdateCartItemRequest.builder()
                .quantity(4)
                .build();

        mockMvc.perform(put("/api/me/cart/items/" + cartItemId)
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.items[0].quantity", is(4)))
                .andExpect(jsonPath("$.data.items[0].lineTotal", is(60.00)))
                .andExpect(jsonPath("$.data.subtotal", is(60.00)));
    }

    @Test
    void testSetProductQuantity_UpsertAndRemove() throws Exception {
        // 1. Direct set product quantity on empty cart (auto-upserts item)
        UpdateCartItemRequest setReq = UpdateCartItemRequest.builder()
                .quantity(3)
                .build();

        mockMvc.perform(put("/api/me/cart/products/" + petFood.getId())
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(setReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.items", hasSize(1)))
                .andExpect(jsonPath("$.data.items[0].productName", is("Premium Dog Food")))
                .andExpect(jsonPath("$.data.items[0].quantity", is(3)))
                .andExpect(jsonPath("$.data.items[0].lineTotal", is(90.00)))
                .andExpect(jsonPath("$.data.subtotal", is(90.00)));

        // 2. Direct set to another quantity (idempotently updates item)
        UpdateCartItemRequest setReq2 = UpdateCartItemRequest.builder()
                .quantity(5)
                .build();

        mockMvc.perform(put("/api/me/cart/products/" + petFood.getId())
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(setReq2)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.items", hasSize(1)))
                .andExpect(jsonPath("$.data.items[0].quantity", is(5)))
                .andExpect(jsonPath("$.data.subtotal", is(150.00)));

        // 3. Set via PUT /api/me/cart/items with CreateCartItemRequest
        CreateCartItemRequest itemSetReq = CreateCartItemRequest.builder()
                .productId(chewToy.getId())
                .quantity(2)
                .build();

        mockMvc.perform(put("/api/me/cart/items")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(itemSetReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.items", hasSize(2)));

        // 4. Set quantity to 0 removes product
        UpdateCartItemRequest removeReq = UpdateCartItemRequest.builder()
                .quantity(0)
                .build();

        mockMvc.perform(put("/api/me/cart/products/" + petFood.getId())
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(removeReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.items", hasSize(1)))
                .andExpect(jsonPath("$.data.items[0].productName", is("Cat Feather Wand")));
    }

    @Test
    void testRemoveCartItem_Success() throws Exception {
        CreateCartItemRequest addRequest = CreateCartItemRequest.builder()
                .productId(chewToy.getId())
                .quantity(1)
                .build();

        String responseJson = mockMvc.perform(post("/api/me/cart/items")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addRequest)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long cartItemId = objectMapper.readTree(responseJson).get("data").get("items").get(0).get("id").asLong();

        mockMvc.perform(delete("/api/me/cart/items/" + cartItemId)
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.items", hasSize(0)))
                .andExpect(jsonPath("$.data.subtotal", is(0)));
    }

    @Test
    void testClearCart_Success() throws Exception {
        CreateCartItemRequest addRequest = CreateCartItemRequest.builder()
                .productId(chewToy.getId())
                .quantity(1)
                .build();

        mockMvc.perform(post("/api/me/cart/items")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addRequest)))
                .andExpect(status().isCreated());

        mockMvc.perform(delete("/api/me/cart")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.items", hasSize(0)));
    }

    @Test
    void testCrossCustomerCartAccess_Forbidden() throws Exception {
        // Alice adds an item
        CreateCartItemRequest addRequest = CreateCartItemRequest.builder()
                .productId(petFood.getId())
                .quantity(1)
                .build();

        String responseJson = mockMvc.perform(post("/api/me/cart/items")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addRequest)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long aliceCartItemId = objectMapper.readTree(responseJson).get("data").get("items").get(0).get("id").asLong();

        // Bob attempts to update Alice's cart item
        UpdateCartItemRequest bobUpdate = UpdateCartItemRequest.builder().quantity(2).build();
        mockMvc.perform(put("/api/me/cart/items/" + aliceCartItemId)
                        .header("Authorization", "Bearer " + bobToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bobUpdate)))
                .andExpect(status().isForbidden());

        // Bob attempts to remove Alice's cart item
        mockMvc.perform(delete("/api/me/cart/items/" + aliceCartItemId)
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isForbidden());
    }

    @AfterEach
    void tearDown() {
        cleanup();
    }

    private void cleanup() {
        notificationRepository.deleteAll();
        cartItemRepository.deleteAll();
        cartRepository.deleteAll();
        productRepository.deleteAll();
        productCategoryRepository.deleteAll();
        userRoleRepository.deleteAll();
        userRepository.deleteAll();
    }
}
