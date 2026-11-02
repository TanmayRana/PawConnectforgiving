package com.example.PawConnect.controller;

import com.example.PawConnect.config.RequestIdFilter;
import com.example.PawConnect.dto.request.pet.CreateMedicalRecordRequest;
import com.example.PawConnect.dto.request.pet.CreateVaccinationRequest;
import com.example.PawConnect.dto.request.pet.UpdateMedicalRecordRequest;
import com.example.PawConnect.dto.request.pet.UpdateVaccinationRequest;
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

import java.time.LocalDate;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
class PetHealthRecordsIntegrationTests {

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
    private PetVaccinationRepository petVaccinationRepository;

    @Autowired
    private PetMedicalRecordRepository petMedicalRecordRepository;

    @Autowired
    private VeterinarianRepository veterinarianRepository;

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

    private Pet alicesPet;

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
                .email("health_alice@test.com")
                .passwordHash(passwordEncoder.encode("SecurePass123!"))
                .status(UserStatus.ACTIVE)
                .tokenVersion(1)
                .build());
        userRoleRepository.save(UserRole.builder().user(alice).role(petOwnerRole).build());
        aliceToken = jwtService.generateAccessToken(alice, List.of("ROLE_PET_OWNER"));

        bob = userRepository.save(User.builder()
                .firstName("Bob")
                .lastName("Jones")
                .email("health_bob@test.com")
                .passwordHash(passwordEncoder.encode("SecurePass123!"))
                .status(UserStatus.ACTIVE)
                .tokenVersion(1)
                .build());
        userRoleRepository.save(UserRole.builder().user(bob).role(petOwnerRole).build());
        bobToken = jwtService.generateAccessToken(bob, List.of("ROLE_PET_OWNER"));

        alicesPet = petRepository.save(Pet.builder()
                .owner(alice)
                .name("Buddy")
                .species("Dog")
                .status(PetStatus.ACTIVE)
                .build());
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
        petMedicalRecordRepository.deleteAll();
        petVaccinationRepository.deleteAll();
        veterinarianRepository.deleteAll();
        petRepository.deleteAll();
        userRoleRepository.deleteAll();
        userRepository.deleteAll();
    }

    // ==========================================
    // 1. Vaccination APIs
    // ==========================================

    @Test
    void testCreateVaccinationSuccess() throws Exception {
        CreateVaccinationRequest request = CreateVaccinationRequest.builder()
                .vaccineName("Rabies")
                .vaccinationDate(LocalDate.now().minusDays(10))
                .nextDueDate(LocalDate.now().plusMonths(12))
                .certificateUrl("https://example.com/rabies-cert.pdf")
                .administeredBy("City Pet Care")
                .notes("Annual booster")
                .build();

        mockMvc.perform(post("/api/me/pets/" + alicesPet.getId() + "/vaccinations")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.vaccineName", is("Rabies")))
                .andExpect(jsonPath("$.data.petId", is(alicesPet.getId().intValue())))
                .andExpect(jsonPath("$.data.administeredBy", is("City Pet Care")));
    }

    @Test
    void testCreateVaccinationWithInvalidDatesFails() throws Exception {
        // nextDueDate is before vaccinationDate
        CreateVaccinationRequest request = CreateVaccinationRequest.builder()
                .vaccineName("Parvovirus")
                .vaccinationDate(LocalDate.now().minusDays(10))
                .nextDueDate(LocalDate.now().minusDays(20))
                .build();

        mockMvc.perform(post("/api/me/pets/" + alicesPet.getId() + "/vaccinations")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.code", is("BUSINESS_RULE_VIOLATION")));
    }

    @Test
    void testGetVaccinationsPaged() throws Exception {
        petVaccinationRepository.save(PetVaccination.builder()
                .pet(alicesPet)
                .vaccineName("Rabies")
                .vaccinationDate(LocalDate.now().minusDays(30))
                .build());

        petVaccinationRepository.save(PetVaccination.builder()
                .pet(alicesPet)
                .vaccineName("DHPP")
                .vaccinationDate(LocalDate.now().minusDays(15))
                .build());

        mockMvc.perform(get("/api/me/pets/" + alicesPet.getId() + "/vaccinations?page=0&size=10")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(2)));
    }

    @Test
    void testUpdateVaccinationSuccess() throws Exception {
        PetVaccination vaccination = petVaccinationRepository.save(PetVaccination.builder()
                .pet(alicesPet)
                .vaccineName("Rabies Initial")
                .vaccinationDate(LocalDate.now().minusDays(5))
                .build());

        UpdateVaccinationRequest updateReq = UpdateVaccinationRequest.builder()
                .vaccineName("Rabies Booster")
                .vaccinationDate(LocalDate.now().minusDays(5))
                .nextDueDate(LocalDate.now().plusYears(1))
                .notes("Updated notes")
                .build();

        mockMvc.perform(put("/api/me/pets/" + alicesPet.getId() + "/vaccinations/" + vaccination.getId())
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.vaccineName", is("Rabies Booster")))
                .andExpect(jsonPath("$.data.notes", is("Updated notes")));
    }

    @Test
    void testDeleteVaccinationSuccess() throws Exception {
        PetVaccination vaccination = petVaccinationRepository.save(PetVaccination.builder()
                .pet(alicesPet)
                .vaccineName("Rabies")
                .vaccinationDate(LocalDate.now().minusDays(5))
                .build());

        mockMvc.perform(delete("/api/me/pets/" + alicesPet.getId() + "/vaccinations/" + vaccination.getId())
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk());

        assertFalse(petVaccinationRepository.findById(vaccination.getId()).isPresent());
    }

    @Test
    void testCrossOwnerVaccinationAccessDenied() throws Exception {
        PetVaccination vaccination = petVaccinationRepository.save(PetVaccination.builder()
                .pet(alicesPet)
                .vaccineName("Rabies")
                .vaccinationDate(LocalDate.now().minusDays(5))
                .build());

        // Bob tries to view Alice's pet vaccinations
        mockMvc.perform(get("/api/me/pets/" + alicesPet.getId() + "/vaccinations")
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isForbidden());

        // Bob tries to delete Alice's pet vaccination
        mockMvc.perform(delete("/api/me/pets/" + alicesPet.getId() + "/vaccinations/" + vaccination.getId())
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isForbidden());
    }

    // ==========================================
    // 2. Medical Record APIs
    // ==========================================

    @Test
    void testCreateMedicalRecordSuccess() throws Exception {
        CreateMedicalRecordRequest request = CreateMedicalRecordRequest.builder()
                .recordType("Annual Checkup")
                .diagnosis("Healthy pet, normal weight")
                .treatment("Routine deworming")
                .medicines("Drontal Plus 1 tab")
                .recordDate(LocalDate.now().minusDays(2))
                .notes("Recheck next year")
                .build();

        mockMvc.perform(post("/api/me/pets/" + alicesPet.getId() + "/medical-records")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.recordType", is("Annual Checkup")))
                .andExpect(jsonPath("$.data.isVeterinarianVerified", is(false)))
                .andExpect(jsonPath("$.data.veterinarianId", nullValue()));
    }

    @Test
    void testUpdateCustomerMedicalRecordSuccess() throws Exception {
        PetMedicalRecord record = petMedicalRecordRepository.save(PetMedicalRecord.builder()
                .pet(alicesPet)
                .recordType("Home Care")
                .diagnosis("Minor scratch")
                .recordDate(LocalDate.now().minusDays(1))
                .build());

        UpdateMedicalRecordRequest updateReq = UpdateMedicalRecordRequest.builder()
                .recordType("Home Care Updated")
                .diagnosis("Healed scratch")
                .recordDate(LocalDate.now().minusDays(1))
                .build();

        mockMvc.perform(put("/api/me/pets/" + alicesPet.getId() + "/medical-records/" + record.getId())
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.recordType", is("Home Care Updated")));
    }

    @Test
    void testCannotUpdateOrDeleteVeterinarianAuthoredRecord() throws Exception {
        // Create a veterinarian user and profile
        User vetUser = userRepository.save(User.builder()
                .firstName("Sarah")
                .lastName("Connor")
                .email("dr_sarah@test.com")
                .passwordHash("hash")
                .status(UserStatus.ACTIVE)
                .build());

        Veterinarian vet = veterinarianRepository.save(Veterinarian.builder()
                .user(vetUser)
                .licenseNumber("VET-12345")
                .specialization("General Surgeon")
                .consultationFee(new java.math.BigDecimal("500.00"))
                .isActive(true)
                .verificationStatus(VeterinarianVerificationStatus.APPROVED)
                .build());

        // Create a medical record authored by this veterinarian
        PetMedicalRecord vetRecord = petMedicalRecordRepository.save(PetMedicalRecord.builder()
                .pet(alicesPet)
                .veterinarian(vet)
                .recordType("Surgical Consultation")
                .diagnosis("Fractured leg confirmed by X-ray")
                .recordDate(LocalDate.now().minusDays(5))
                .build());

        // Alice attempts to modify the veterinarian's record
        UpdateMedicalRecordRequest updateReq = UpdateMedicalRecordRequest.builder()
                .recordType("Tampered Record")
                .recordDate(LocalDate.now().minusDays(5))
                .build();

        mockMvc.perform(put("/api/me/pets/" + alicesPet.getId() + "/medical-records/" + vetRecord.getId())
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code", is("FORBIDDEN")));

        // Alice attempts to delete the veterinarian's record
        mockMvc.perform(delete("/api/me/pets/" + alicesPet.getId() + "/medical-records/" + vetRecord.getId())
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code", is("FORBIDDEN")));
    }

    @Test
    void testCrossOwnerMedicalRecordAccessDenied() throws Exception {
        PetMedicalRecord record = petMedicalRecordRepository.save(PetMedicalRecord.builder()
                .pet(alicesPet)
                .recordType("Checkup")
                .recordDate(LocalDate.now().minusDays(1))
                .build());

        // Bob tries to access Alice's pet medical record
        mockMvc.perform(get("/api/me/pets/" + alicesPet.getId() + "/medical-records")
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/me/pets/" + alicesPet.getId() + "/medical-records/" + record.getId())
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isForbidden());
    }
}
