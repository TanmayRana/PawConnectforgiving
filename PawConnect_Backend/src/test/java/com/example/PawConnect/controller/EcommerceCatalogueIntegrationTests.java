package com.example.PawConnect.controller;

import com.example.PawConnect.config.RequestIdFilter;
import com.example.PawConnect.dto.request.admin.CategoryRequest;
import com.example.PawConnect.dto.request.admin.ProductRequest;
import com.example.PawConnect.dto.request.admin.UpdateProductStatusRequest;
import com.example.PawConnect.dto.request.admin.UpdateStockRequest;
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
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
class EcommerceCatalogueIntegrationTests {

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
    private ProductRepository productRepository;

    @Autowired
    private ProductCategoryRepository productCategoryRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private OrderStatusHistoryRepository orderStatusHistoryRepository;

    @Autowired
    private OrderRepository orderRepository;

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

    private User admin;
    private String adminToken;

    private User alice;
    private String aliceToken;

    private ProductCategory foodCategory;
    private ProductCategory toysCategory;

    private Product activeProduct1;
    private Product inactiveProduct;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .addFilters(requestIdFilter, springSecurityFilterChain)
                .build();

        cleanup();

        Role adminRole = roleRepository.findByRoleCode("ADMIN").orElseGet(() ->
                roleRepository.save(Role.builder().roleCode("ADMIN").roleName("Admin").build()));
        Role petOwnerRole = roleRepository.findByRoleCode("PET_OWNER").orElseGet(() ->
                roleRepository.save(Role.builder().roleCode("PET_OWNER").roleName("Pet Owner").build()));

        admin = userRepository.save(User.builder()
                .firstName("Admin")
                .lastName("Root")
                .email("admin_cat@test.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .status(UserStatus.ACTIVE)
                .tokenVersion(1)
                .build());
        userRoleRepository.save(UserRole.builder().user(admin).role(adminRole).build());
        adminToken = jwtService.generateAccessToken(admin, java.util.List.of("ROLE_ADMIN"));

        alice = userRepository.save(User.builder()
                .firstName("Alice")
                .lastName("Customer")
                .email("alice_cat@test.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .status(UserStatus.ACTIVE)
                .tokenVersion(1)
                .build());
        userRoleRepository.save(UserRole.builder().user(alice).role(petOwnerRole).build());
        aliceToken = jwtService.generateAccessToken(alice, java.util.List.of("ROLE_PET_OWNER"));

        foodCategory = productCategoryRepository.save(ProductCategory.builder()
                .name("Pet Food")
                .description("Nutritious pet food")
                .isActive(true)
                .build());

        toysCategory = productCategoryRepository.save(ProductCategory.builder()
                .name("Pet Toys")
                .description("Fun toys for pets")
                .isActive(true)
                .build());

        activeProduct1 = productRepository.save(Product.builder()
                .category(foodCategory)
                .name("Organic Dog Kibble")
                .sku("SKU-DOG-KIBBLE-01")
                .description("Premium grain-free dog food")
                .price(BigDecimal.valueOf(49.99))
                .stockQuantity(100)
                .status(ProductStatus.ACTIVE)
                .isActive(true)
                .build());

        productRepository.save(Product.builder()
                .category(toysCategory)
                .name("Chew Bone Toy")
                .sku("SKU-TOY-BONE-01")
                .description("Durable rubber chew toy")
                .price(BigDecimal.valueOf(14.50))
                .stockQuantity(50)
                .status(ProductStatus.ACTIVE)
                .isActive(true)
                .build());

        inactiveProduct = productRepository.save(Product.builder()
                .category(foodCategory)
                .name("Discontinued Cat Treat")
                .sku("SKU-CAT-DISCONTINUED")
                .description("Legacy treat")
                .price(BigDecimal.valueOf(9.99))
                .stockQuantity(0)
                .status(ProductStatus.INACTIVE)
                .isActive(false)
                .build());
    }

    @Test
    void testPublicGetProducts_ListsOnlyActiveProducts() throws Exception {
        mockMvc.perform(get("/api/products")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.totalElements", is(2)))
                .andExpect(jsonPath("$.data.content[*].name", containsInAnyOrder("Organic Dog Kibble", "Chew Bone Toy")))
                .andExpect(jsonPath("$.data.content[*].sku", not(hasItem("SKU-CAT-DISCONTINUED"))));
    }

    @Test
    void testPublicGetProducts_FilterByCategoryAndPrice() throws Exception {
        mockMvc.perform(get("/api/products")
                        .param("categoryId", foodCategory.getId().toString())
                        .param("minPrice", "20.00")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.totalElements", is(1)))
                .andExpect(jsonPath("$.data.content[0].name", is("Organic Dog Kibble")));
    }

    @Test
    void testPublicGetProducts_SearchKeyword() throws Exception {
        mockMvc.perform(get("/api/products")
                        .param("search", "chew")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.totalElements", is(1)))
                .andExpect(jsonPath("$.data.content[0].name", is("Chew Bone Toy")));
    }

    @Test
    void testPublicGetProducts_InvalidSortFieldRejected() throws Exception {
        mockMvc.perform(get("/api/products")
                        .param("sort", "unsupportedColumn,desc")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("Invalid sort field")));
    }

    @Test
    void testPublicGetProductById_ActiveProductSucceeds() throws Exception {
        mockMvc.perform(get("/api/products/" + activeProduct1.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.name", is("Organic Dog Kibble")))
                .andExpect(jsonPath("$.data.price", is(49.99)))
                .andExpect(jsonPath("$.data.stockQuantity", is(100)));
    }

    @Test
    void testPublicGetProductById_InactiveProductReturnsNotFound() throws Exception {
        mockMvc.perform(get("/api/products/" + inactiveProduct.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    void testPublicGetCategories_ReturnsActiveCategories() throws Exception {
        mockMvc.perform(get("/api/products/categories")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(2)))
                .andExpect(jsonPath("$.data[*].name", containsInAnyOrder("Pet Food", "Pet Toys")));
    }

    // =========================================================================
    // Admin Catalog Operations Tests
    // =========================================================================

    @Test
    void testAdminCreateProduct_Success() throws Exception {
        ProductRequest request = ProductRequest.builder()
                .categoryId(foodCategory.getId())
                .name("Salmon Cat Wet Food")
                .sku("SKU-CAT-SALMON-01")
                .description("Rich in Omega 3")
                .price(BigDecimal.valueOf(25.00))
                .stockQuantity(80)
                .weight(BigDecimal.valueOf(0.5))
                .status(ProductStatus.ACTIVE)
                .isActive(true)
                .build();

        mockMvc.perform(post("/api/admin/products")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.name", is("Salmon Cat Wet Food")))
                .andExpect(jsonPath("$.data.sku", is("SKU-CAT-SALMON-01")));

        assertTrue(productRepository.findBySku("SKU-CAT-SALMON-01").isPresent());
    }

    @Test
    void testAdminCreateProduct_NonAdminForbidden() throws Exception {
        ProductRequest request = ProductRequest.builder()
                .categoryId(foodCategory.getId())
                .name("Cat Food")
                .sku("SKU-CAT-SAMPLE")
                .price(BigDecimal.valueOf(20.00))
                .stockQuantity(10)
                .status(ProductStatus.ACTIVE)
                .build();

        mockMvc.perform(post("/api/admin/products")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testAdminUpdateStock_Success() throws Exception {
        UpdateStockRequest stockRequest = UpdateStockRequest.builder()
                .stockQuantity(120)
                .build();

        mockMvc.perform(patch("/api/admin/products/" + activeProduct1.getId() + "/stock")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(stockRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.stockQuantity", is(120)));

        Product updated = productRepository.findById(activeProduct1.getId()).orElseThrow();
        assertEquals(120, updated.getStockQuantity());
    }

    @Test
    void testAdminUpdateProductStatus_DeactivatesProductSafely() throws Exception {
        UpdateProductStatusRequest statusRequest = UpdateProductStatusRequest.builder()
                .status(ProductStatus.INACTIVE)
                .isActive(false)
                .build();

        mockMvc.perform(patch("/api/admin/products/" + activeProduct1.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("INACTIVE")))
                .andExpect(jsonPath("$.data.isActive", is(false)));

        // Verifying that it is now hidden from public listings
        mockMvc.perform(get("/api/products/" + activeProduct1.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    void testAdminManageCategory_Success() throws Exception {
        CategoryRequest catRequest = CategoryRequest.builder()
                .name("Bird Supplies")
                .description("Cages and feed")
                .isActive(true)
                .build();

        mockMvc.perform(post("/api/admin/categories")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(catRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.name", is("Bird Supplies")));

        assertTrue(productCategoryRepository.findByName("Bird Supplies").isPresent());
    }

    @AfterEach
    void tearDown() {
        cleanup();
    }

    private void cleanup() {
        notificationRepository.deleteAll();
        orderStatusHistoryRepository.deleteAll();
        orderItemRepository.deleteAll();
        orderRepository.deleteAll();
        cartItemRepository.deleteAll();
        cartRepository.deleteAll();
        productRepository.deleteAll();
        productCategoryRepository.deleteAll();
        userRoleRepository.deleteAll();
        userRepository.deleteAll();
    }
}
