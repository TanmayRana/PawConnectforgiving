package com.example.PawConnect.security;

import com.example.PawConnect.exception.ForbiddenException;
import com.example.PawConnect.model.*;
import com.example.PawConnect.repository.*;
import com.example.PawConnect.response.ApiResponse;
import com.example.PawConnect.service.AuthorizationService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Import;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.FilterChainProxy;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.WebApplicationContext;
import com.example.PawConnect.config.RequestIdFilter;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Import(AuthorizationAndOwnershipTests.TestEndpointsConfig.class)
class AuthorizationAndOwnershipTests {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private FilterChainProxy springSecurityFilterChain;

    @Autowired
    private RequestIdFilter requestIdFilter;

    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private PetRepository petRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderStatusHistoryRepository orderStatusHistoryRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private AuthorizationService authorizationService;

    private User adminUser;
    private User petOwnerUserA;
    private User petOwnerUserB;
    private User vetUser;
    private User providerUser;

    private String adminToken;
    private String petOwnerTokenA;
    private String vetToken;
    private String providerToken;

    @TestConfiguration
    static class TestEndpointsConfig {
        @RestController
        @RequestMapping("/api/test-roles")
        static class TestRoleController {
            @GetMapping("/admin")
            @PreAuthorize("hasRole('ADMIN')")
            public ApiResponse<String> adminOnly() {
                return ApiResponse.ok("admin-only-data");
            }

            @GetMapping("/vet")
            @PreAuthorize("hasRole('VETERINARIAN')")
            public ApiResponse<String> vetOnly() {
                return ApiResponse.ok("vet-only-data");
            }

            @GetMapping("/provider")
            @PreAuthorize("hasRole('SERVICE_PROVIDER')")
            public ApiResponse<String> providerOnly() {
                return ApiResponse.ok("provider-only-data");
            }
        }
    }

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .addFilters(requestIdFilter, springSecurityFilterChain)
                .build();

        cleanup();

        Role adminRole = roleRepository.findByRoleCode("ADMIN")
                .orElseGet(() -> roleRepository.save(Role.builder().roleCode("ADMIN").roleName("Admin").build()));
        Role petOwnerRole = roleRepository.findByRoleCode("PET_OWNER")
                .orElseGet(() -> roleRepository.save(Role.builder().roleCode("PET_OWNER").roleName("Pet Owner").build()));
        Role vetRole = roleRepository.findByRoleCode("VETERINARIAN")
                .orElseGet(() -> roleRepository.save(Role.builder().roleCode("VETERINARIAN").roleName("Veterinarian").build()));
        Role providerRole = roleRepository.findByRoleCode("SERVICE_PROVIDER")
                .orElseGet(() -> roleRepository.save(Role.builder().roleCode("SERVICE_PROVIDER").roleName("Service Provider").build()));

        adminUser = userRepository.save(User.builder().firstName("Admin").lastName("User").email("admin@test.com").passwordHash("hash").status(UserStatus.ACTIVE).tokenVersion(1).build());
        userRoleRepository.save(UserRole.builder().user(adminUser).role(adminRole).build());

        petOwnerUserA = userRepository.save(User.builder().firstName("OwnerA").lastName("User").email("ownera@test.com").passwordHash("hash").status(UserStatus.ACTIVE).tokenVersion(1).build());
        userRoleRepository.save(UserRole.builder().user(petOwnerUserA).role(petOwnerRole).build());

        petOwnerUserB = userRepository.save(User.builder().firstName("OwnerB").lastName("User").email("ownerb@test.com").passwordHash("hash").status(UserStatus.ACTIVE).tokenVersion(1).build());
        userRoleRepository.save(UserRole.builder().user(petOwnerUserB).role(petOwnerRole).build());

        vetUser = userRepository.save(User.builder().firstName("Vet").lastName("User").email("vet@test.com").passwordHash("hash").status(UserStatus.ACTIVE).tokenVersion(1).build());
        userRoleRepository.save(UserRole.builder().user(vetUser).role(vetRole).build());

        providerUser = userRepository.save(User.builder().firstName("Provider").lastName("User").email("provider@test.com").passwordHash("hash").status(UserStatus.ACTIVE).tokenVersion(1).build());
        userRoleRepository.save(UserRole.builder().user(providerUser).role(providerRole).build());

        adminToken = jwtService.generateAccessToken(adminUser, List.of("ADMIN"));
        petOwnerTokenA = jwtService.generateAccessToken(petOwnerUserA, List.of("PET_OWNER"));
        vetToken = jwtService.generateAccessToken(vetUser, List.of("VETERINARIAN"));
        providerToken = jwtService.generateAccessToken(providerUser, List.of("SERVICE_PROVIDER"));
    }

    @Test
    void testAdminAllowedOnAdminEndpoint() throws Exception {
        mockMvc.perform(get("/api/test-roles/admin")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    void testPetOwnerDeniedOnAdminEndpointReturns403() throws Exception {
        mockMvc.perform(get("/api/test-roles/admin")
                        .header("Authorization", "Bearer " + petOwnerTokenA))
                .andExpect(status().isForbidden());
    }

    @Test
    void testVeterinarianDeniedOnAdminEndpointReturns403() throws Exception {
        mockMvc.perform(get("/api/test-roles/admin")
                        .header("Authorization", "Bearer " + vetToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void testServiceProviderDeniedOnAdminEndpointReturns403() throws Exception {
        mockMvc.perform(get("/api/test-roles/admin")
                        .header("Authorization", "Bearer " + providerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void testVeterinarianAllowedOnVetEndpoint() throws Exception {
        mockMvc.perform(get("/api/test-roles/vet")
                        .header("Authorization", "Bearer " + vetToken))
                .andExpect(status().isOk());
    }

    @Test
    void testPetOwnerDeniedOnVetEndpointReturns403() throws Exception {
        mockMvc.perform(get("/api/test-roles/vet")
                        .header("Authorization", "Bearer " + petOwnerTokenA))
                .andExpect(status().isForbidden());
    }

    @Test
    void testRefreshTokenCannotBeUsedAsBearerTokenOnProtectedEndpoint() throws Exception {
        String refreshToken = jwtService.generateRefreshToken(petOwnerUserA);

        mockMvc.perform(get("/api/me")
                        .header("Authorization", "Bearer " + refreshToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testPetOwnershipAuthorization() {
        Pet petA = petRepository.save(Pet.builder()
                .name("Buddy")
                .species("Dog")
                .breed("Golden Retriever")
                .gender(PetGender.MALE)
                .status(PetStatus.ACTIVE)
                .owner(petOwnerUserA)
                .build());

        // Authenticate as Owner A
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        new UserDetailsImpl(petOwnerUserA, List.of()), null, List.of()
                )
        );
        assertDoesNotThrow(() -> authorizationService.requirePetOwner(petA.getId()));

        // Authenticate as Owner B
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        new UserDetailsImpl(petOwnerUserB, List.of()), null, List.of()
                )
        );
        assertThrows(ForbiddenException.class, () -> authorizationService.requirePetOwner(petA.getId()));

        // Authenticate as Admin: admin is granted access
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        new UserDetailsImpl(adminUser, List.of()), null, List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_ADMIN"))
                )
        );
        assertDoesNotThrow(() -> authorizationService.requirePetOwner(petA.getId()));
    }

    @Test
    void testAddressOwnershipAuthorization() {
        Address addrA = addressRepository.save(Address.builder()
                .user(petOwnerUserA)
                .addressType(AddressType.HOME)
                .recipientName("Alice")
                .phone("+12345678901")
                .addressLine1("123 Main St")
                .city("Springfield")
                .state("IL")
                .postalCode("62701")
                .country("USA")
                .build());

        // Authenticate as Owner A
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        new UserDetailsImpl(petOwnerUserA, List.of()), null, List.of()
                )
        );
        assertDoesNotThrow(() -> authorizationService.requireAddressOwner(addrA.getId()));

        // Authenticate as Owner B
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        new UserDetailsImpl(petOwnerUserB, List.of()), null, List.of()
                )
        );
        assertThrows(ForbiddenException.class, () -> authorizationService.requireAddressOwner(addrA.getId()));
    }

    @Test
    void testOrderOwnershipAuthorization() {
        Order orderA = orderRepository.save(Order.builder()
                .user(petOwnerUserA)
                .orderNo("ORD-1001")
                .subtotal(new BigDecimal("100.00"))
                .taxAmount(new BigDecimal("10.00"))
                .shippingFee(BigDecimal.ZERO)
                .totalAmount(new BigDecimal("110.00"))
                .orderStatus(OrderStatus.CONFIRMED)
                .paymentStatus(PaymentStatus.SUCCESS)
                .build());

        // Authenticate as Owner A
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        new UserDetailsImpl(petOwnerUserA, List.of()), null, List.of()
                )
        );
        assertDoesNotThrow(() -> authorizationService.requireOrderOwner(orderA.getId()));

        // Authenticate as Owner B
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        new UserDetailsImpl(petOwnerUserB, List.of()), null, List.of()
                )
        );
        assertThrows(ForbiddenException.class, () -> authorizationService.requireOrderOwner(orderA.getId()));
    }

    @Test
    void testCorsHeadersAllowedForFrontendOrigin() throws Exception {
        mockMvc.perform(options("/api/auth/login")
                        .header("Origin", "http://localhost:3000")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:3000"))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
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
        addressRepository.deleteAll();
        petRepository.deleteAll();
        userRoleRepository.deleteAll();
        userRepository.deleteAll();
    }
}
