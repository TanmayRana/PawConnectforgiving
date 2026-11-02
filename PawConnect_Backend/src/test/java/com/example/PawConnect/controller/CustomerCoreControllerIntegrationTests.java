package com.example.PawConnect.controller;

import com.example.PawConnect.config.RequestIdFilter;
import com.example.PawConnect.dto.request.address.CreateAddressRequest;
import com.example.PawConnect.dto.request.address.UpdateAddressRequest;
import com.example.PawConnect.dto.request.pet.CreatePetRequest;
import com.example.PawConnect.dto.request.pet.UpdatePetRequest;
import com.example.PawConnect.dto.request.user.ChangePasswordRequest;
import com.example.PawConnect.dto.request.user.UpdateProfileRequest;
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
import java.time.LocalDate;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
class CustomerCoreControllerIntegrationTests {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private FilterChainProxy springSecurityFilterChain;

    @Autowired
    private RequestIdFilter requestIdFilter;

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());

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

    private User alice;
    private String aliceToken;

    private User bob;
    private String bobToken;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .addFilters(requestIdFilter, springSecurityFilterChain)
                .build();

        cleanup();

        Role petOwnerRole = roleRepository.findByRoleCode("PET_OWNER").orElseGet(() ->
                roleRepository.save(Role.builder()
                        .roleCode("PET_OWNER")
                        .roleName("Pet Owner")
                        .description("Default pet owner role")
                        .build()));

        alice = userRepository.save(User.builder()
                .firstName("Alice")
                .lastName("Smith")
                .email("cust_alice@test.com")
                .phone("+12345678901")
                .passwordHash(passwordEncoder.encode("SecurePass123!"))
                .status(UserStatus.ACTIVE)
                .tokenVersion(1)
                .build());
        userRoleRepository.save(UserRole.builder().user(alice).role(petOwnerRole).build());
        aliceToken = jwtService.generateAccessToken(alice, List.of("ROLE_PET_OWNER"));

        bob = userRepository.save(User.builder()
                .firstName("Bob")
                .lastName("Jones")
                .email("cust_bob@test.com")
                .phone("+19876543210")
                .passwordHash(passwordEncoder.encode("SecurePass123!"))
                .status(UserStatus.ACTIVE)
                .tokenVersion(1)
                .build());
        userRoleRepository.save(UserRole.builder().user(bob).role(petOwnerRole).build());
        bobToken = jwtService.generateAccessToken(bob, List.of("ROLE_PET_OWNER"));
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

    // ==========================================
    // 1. Profile APIs
    // ==========================================

    @Test
    void testGetCurrentUserProfileSuccess() throws Exception {
        mockMvc.perform(get("/api/me")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.email", is("cust_alice@test.com")))
                .andExpect(jsonPath("$.data.fullName", is("Alice Smith")))
                .andExpect(jsonPath("$.data.roles", hasItem("PET_OWNER")));
    }

    @Test
    void testUpdateProfileSuccess() throws Exception {
        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .firstName("Alicia")
                .lastName("Smith-Williams")
                .phone("+12345678999")
                .profileImage("https://example.com/avatar.jpg")
                .build();

        mockMvc.perform(put("/api/me")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.firstName", is("Alicia")))
                .andExpect(jsonPath("$.data.lastName", is("Smith-Williams")))
                .andExpect(jsonPath("$.data.fullName", is("Alicia Smith-Williams")))
                .andExpect(jsonPath("$.data.phone", is("+12345678999")));
    }

    @Test
    void testUpdateProfileWithDuplicatePhoneFails() throws Exception {
        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .firstName("Alicia")
                .lastName("Smith")
                .phone("+19876543210") // Bob's phone
                .build();

        mockMvc.perform(put("/api/me")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.code", is("DUPLICATE_RESOURCE")));
    }

    @Test
    void testChangePasswordSuccessAndRevokesSession() throws Exception {
        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("SecurePass123!")
                .newPassword("BrandNewPass456@")
                .confirmNewPassword("BrandNewPass456@")
                .build();

        mockMvc.perform(put("/api/me/password")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        // Old token should now be rejected as token_version was incremented
        mockMvc.perform(get("/api/me")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testChangePasswordWithWrongCurrentPasswordFails() throws Exception {
        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("WrongPass999!")
                .newPassword("BrandNewPass456@")
                .confirmNewPassword("BrandNewPass456@")
                .build();

        mockMvc.perform(put("/api/me/password")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    // ==========================================
    // 2. Pet APIs
    // ==========================================

    @Test
    void testCreatePetSuccess() throws Exception {
        CreatePetRequest request = CreatePetRequest.builder()
                .name("Buddy")
                .species("Dog")
                .breed("Golden Retriever")
                .gender(PetGender.MALE)
                .weight(new BigDecimal("28.50"))
                .dateOfBirth(LocalDate.now().minusYears(2).minusMonths(3))
                .photoUrl("https://example.com/buddy.jpg")
                .notes("Loves tennis balls")
                .build();

        mockMvc.perform(post("/api/me/pets")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.name", is("Buddy")))
                .andExpect(jsonPath("$.data.species", is("Dog")))
                .andExpect(jsonPath("$.data.age", containsString("year")))
                .andExpect(jsonPath("$.data.status", is("ACTIVE")))
                .andExpect(jsonPath("$.data.ownerId", is(alice.getId().intValue())));
    }

    @Test
    void testGetPetsPagedSuccess() throws Exception {
        petRepository.save(Pet.builder().owner(alice).name("Buddy").species("Dog").status(PetStatus.ACTIVE).build());
        petRepository.save(Pet.builder().owner(alice).name("Milo").species("Cat").status(PetStatus.ACTIVE).build());

        mockMvc.perform(get("/api/me/pets?page=0&size=10&sort=name,asc")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(2)))
                .andExpect(jsonPath("$.data.content[0].name", is("Buddy")))
                .andExpect(jsonPath("$.data.content[1].name", is("Milo")));
    }

    @Test
    void testUpdatePetSuccess() throws Exception {
        Pet pet = petRepository.save(Pet.builder()
                .owner(alice)
                .name("Buddy")
                .species("Dog")
                .status(PetStatus.ACTIVE)
                .build());

        UpdatePetRequest request = UpdatePetRequest.builder()
                .name("Buddy Champion")
                .species("Dog")
                .breed("Labrador")
                .weight(new BigDecimal("30.00"))
                .build();

        mockMvc.perform(put("/api/me/pets/" + pet.getId())
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.name", is("Buddy Champion")))
                .andExpect(jsonPath("$.data.breed", is("Labrador")));
    }

    @Test
    void testDeletePetSoftDeletesAndHidesFromList() throws Exception {
        Pet pet = petRepository.save(Pet.builder()
                .owner(alice)
                .name("Buddy")
                .species("Dog")
                .status(PetStatus.ACTIVE)
                .build());

        mockMvc.perform(delete("/api/me/pets/" + pet.getId())
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk());

        // Check it is not listed in active pets
        mockMvc.perform(get("/api/me/pets")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(0)));

        // Inactive pet returns 404 when directly accessed
        mockMvc.perform(get("/api/me/pets/" + pet.getId())
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isNotFound());

        // Database entity still exists with INACTIVE status
        Pet dbPet = petRepository.findById(pet.getId()).orElseThrow();
        assertEquals(PetStatus.INACTIVE, dbPet.getStatus());
    }

    @Test
    void testCrossOwnerPetAccessDenied() throws Exception {
        Pet alicesPet = petRepository.save(Pet.builder()
                .owner(alice)
                .name("Buddy")
                .species("Dog")
                .status(PetStatus.ACTIVE)
                .build());

        // Bob tries to access Alice's pet
        mockMvc.perform(get("/api/me/pets/" + alicesPet.getId())
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isForbidden());

        // Bob tries to update Alice's pet
        UpdatePetRequest updateReq = UpdatePetRequest.builder()
                .name("Hacked Name")
                .species("Dog")
                .build();

        mockMvc.perform(put("/api/me/pets/" + alicesPet.getId())
                        .header("Authorization", "Bearer " + bobToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isForbidden());

        // Bob tries to delete Alice's pet
        mockMvc.perform(delete("/api/me/pets/" + alicesPet.getId())
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isForbidden());
    }

    // ==========================================
    // 3. Address APIs
    // ==========================================

    @Test
    void testCreateAddressAndAutoSetsDefaultIfFirst() throws Exception {
        CreateAddressRequest request = CreateAddressRequest.builder()
                .recipientName("Alice Smith")
                .phone("+12345678901")
                .addressType(AddressType.HOME)
                .addressLine1("123 Maple Street")
                .city("Springfield")
                .state("Illinois")
                .postalCode("62701")
                .country("USA")
                .isDefault(false) // First address should automatically be made default
                .build();

        mockMvc.perform(post("/api/me/addresses")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.isDefault", is(true)))
                .andExpect(jsonPath("$.data.city", is("Springfield")));
    }

    @Test
    void testCreateSecondAddressWithDefaultUnsetsFirst() throws Exception {
        Address addr1 = addressRepository.save(Address.builder()
                .user(alice)
                .recipientName("Alice Home")
                .phone("+12345678901")
                .addressLine1("123 First St")
                .city("City1")
                .state("State1")
                .postalCode("12345")
                .country("Country")
                .isDefault(true)
                .build());

        CreateAddressRequest request = CreateAddressRequest.builder()
                .recipientName("Alice Work")
                .phone("+12345678901")
                .addressType(AddressType.OFFICE)
                .addressLine1("456 Second St")
                .city("City2")
                .state("State2")
                .postalCode("67890")
                .country("Country")
                .isDefault(true)
                .build();

        mockMvc.perform(post("/api/me/addresses")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.isDefault", is(true)));

        // Previous address should now have isDefault = false
        Address updatedAddr1 = addressRepository.findById(addr1.getId()).orElseThrow();
        assertFalse(updatedAddr1.getIsDefault());
    }

    @Test
    void testSetDefaultAddressPatch() throws Exception {
        Address addr1 = addressRepository.save(Address.builder()
                .user(alice)
                .recipientName("Alice Home")
                .phone("+12345678901")
                .addressLine1("123 First St")
                .city("City1")
                .state("State1")
                .postalCode("12345")
                .country("Country")
                .isDefault(false)
                .build());

        Address addr2 = addressRepository.save(Address.builder()
                .user(alice)
                .recipientName("Alice Office")
                .phone("+12345678901")
                .addressLine1("456 Office St")
                .city("City1")
                .state("State1")
                .postalCode("12345")
                .country("Country")
                .isDefault(true)
                .build());

        mockMvc.perform(patch("/api/me/addresses/" + addr1.getId() + "/default")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isDefault", is(true)));

        Address updatedAddr2 = addressRepository.findById(addr2.getId()).orElseThrow();
        assertFalse(updatedAddr2.getIsDefault());
    }

    @Test
    void testDeleteDefaultAddressPromotesRemainingAddress() throws Exception {
        Address addr1 = addressRepository.save(Address.builder()
                .user(alice)
                .recipientName("Alice Default")
                .phone("+12345678901")
                .addressLine1("123 First St")
                .city("City1")
                .state("State1")
                .postalCode("12345")
                .country("Country")
                .isDefault(true)
                .build());

        Address addr2 = addressRepository.save(Address.builder()
                .user(alice)
                .recipientName("Alice Secondary")
                .phone("+12345678901")
                .addressLine1("456 Second St")
                .city("City2")
                .state("State2")
                .postalCode("67890")
                .country("Country")
                .isDefault(false)
                .build());

        mockMvc.perform(delete("/api/me/addresses/" + addr1.getId())
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk());

        // Address 2 should now be promoted to default
        Address remainingAddr = addressRepository.findById(addr2.getId()).orElseThrow();
        assertTrue(remainingAddr.getIsDefault());
    }

    @Test
    void testCrossOwnerAddressAccessDenied() throws Exception {
        Address alicesAddress = addressRepository.save(Address.builder()
                .user(alice)
                .recipientName("Alice Secret Address")
                .phone("+12345678901")
                .addressLine1("123 Maple St")
                .city("Springfield")
                .state("Illinois")
                .postalCode("62701")
                .country("USA")
                .isDefault(true)
                .build());

        // Bob tries to get Alice's address
        mockMvc.perform(get("/api/me/addresses/" + alicesAddress.getId())
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isForbidden());

        // Bob tries to update Alice's address
        UpdateAddressRequest updateReq = UpdateAddressRequest.builder()
                .recipientName("Bob")
                .phone("+19876543210")
                .addressLine1("Bob St")
                .city("City")
                .state("State")
                .postalCode("12345")
                .country("Country")
                .build();

        mockMvc.perform(put("/api/me/addresses/" + alicesAddress.getId())
                        .header("Authorization", "Bearer " + bobToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isForbidden());

        // Bob tries to delete Alice's address
        mockMvc.perform(delete("/api/me/addresses/" + alicesAddress.getId())
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isForbidden());

        // Bob tries to set default on Alice's address
        mockMvc.perform(patch("/api/me/addresses/" + alicesAddress.getId() + "/default")
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isForbidden());
    }
}
