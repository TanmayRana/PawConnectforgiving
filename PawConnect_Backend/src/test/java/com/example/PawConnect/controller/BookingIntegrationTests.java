package com.example.PawConnect.controller;

import com.example.PawConnect.config.RequestIdFilter;
import com.example.PawConnect.dto.request.booking.CancelBookingRequest;
import com.example.PawConnect.dto.request.booking.CreateAppointmentRequest;
import com.example.PawConnect.dto.request.booking.CreateBookingRequest;
import com.example.PawConnect.dto.request.booking.CreateServiceBookingRequest;
import com.example.PawConnect.dto.request.booking.UpdateBookingStatusRequest;
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
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
class BookingIntegrationTests {

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
    private VeterinarianAvailabilityRepository veterinarianAvailabilityRepository;

    @Autowired
    private ServiceProviderRepository serviceProviderRepository;

    @Autowired
    private ServiceProviderAvailabilityRepository serviceProviderAvailabilityRepository;

    @Autowired
    private ServiceCategoryRepository serviceCategoryRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private ServiceBookingRepository serviceBookingRepository;

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

    // Users & Tokens
    private User customerAlice;
    private String aliceToken;

    private User customerBob;
    private String bobToken;

    private User vetUserCharlie;
    private Veterinarian vetCharlie;
    private String vetCharlieToken;

    private User vetUserDiana;
    private String vetDianaToken;

    private User providerUserEvan;
    private ServiceProvider providerEvan;
    private String providerEvanToken;

    private User providerUserFiona;
    private String providerFionaToken;

    private Pet aliceDog;
    private Pet bobCat;
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
        customerAlice = createUser("alice@test.com", "Alice", "Smith", "+1111111111");
        assignRole(customerAlice, petOwnerRole);
        aliceToken = jwtService.generateAccessToken(customerAlice, List.of("ROLE_PET_OWNER"));

        // Customer Bob
        customerBob = createUser("bob@test.com", "Bob", "Jones", "+1222222222");
        assignRole(customerBob, petOwnerRole);
        bobToken = jwtService.generateAccessToken(customerBob, List.of("ROLE_PET_OWNER"));

        // Veterinarian Charlie
        vetUserCharlie = createUser("vet_charlie@test.com", "Charlie", "Vet", "+1333333333");
        assignRole(vetUserCharlie, vetRole);
        vetCharlieToken = jwtService.generateAccessToken(vetUserCharlie, List.of("ROLE_VETERINARIAN"));

        vetCharlie = veterinarianRepository.save(Veterinarian.builder()
                .user(vetUserCharlie)
                .specialization("General Practice")
                .licenseNumber("VET-LIC-1001")
                .clinicName("Charlie Animal Clinic")
                .consultationFee(BigDecimal.valueOf(150.00))
                .verificationStatus(VeterinarianVerificationStatus.APPROVED)
                .isActive(true)
                .build());

        // Veterinarian Diana
        vetUserDiana = createUser("vet_diana@test.com", "Diana", "Vet", "+1444444444");
        assignRole(vetUserDiana, vetRole);
        vetDianaToken = jwtService.generateAccessToken(vetUserDiana, List.of("ROLE_VETERINARIAN"));

        veterinarianRepository.save(Veterinarian.builder()
                .user(vetUserDiana)
                .specialization("Surgery")
                .licenseNumber("VET-LIC-1002")
                .clinicName("Diana Pet Hospital")
                .consultationFee(BigDecimal.valueOf(250.00))
                .verificationStatus(VeterinarianVerificationStatus.APPROVED)
                .isActive(true)
                .build());

        // Service Provider Evan
        providerUserEvan = createUser("provider_evan@test.com", "Evan", "Groomer", "+1555555555");
        assignRole(providerUserEvan, providerRole);
        providerEvanToken = jwtService.generateAccessToken(providerUserEvan, List.of("ROLE_SERVICE_PROVIDER"));

        providerEvan = serviceProviderRepository.save(ServiceProvider.builder()
                .user(providerUserEvan)
                .providerType(ProviderType.GROOMER)
                .businessName("Evan's Pet Grooming")
                .phone("+1555555555")
                .verificationStatus(ServiceProviderVerificationStatus.APPROVED)
                .isActive(true)
                .build());

        // Service Provider Fiona
        providerUserFiona = createUser("provider_fiona@test.com", "Fiona", "Trainer", "+1666666666");
        assignRole(providerUserFiona, providerRole);
        providerFionaToken = jwtService.generateAccessToken(providerUserFiona, List.of("ROLE_SERVICE_PROVIDER"));

        serviceProviderRepository.save(ServiceProvider.builder()
                .user(providerUserFiona)
                .providerType(ProviderType.TRAINER)
                .businessName("Fiona's Training")
                .phone("+1666666666")
                .verificationStatus(ServiceProviderVerificationStatus.APPROVED)
                .isActive(true)
                .build());

        // Alice's Pet
        aliceDog = petRepository.save(Pet.builder()
                .owner(customerAlice)
                .name("Max")
                .species("Dog")
                .breed("Golden Retriever")
                .gender(PetGender.MALE)
                .status(PetStatus.ACTIVE)
                .build());

        // Bob's Pet
        bobCat = petRepository.save(Pet.builder()
                .owner(customerBob)
                .name("Luna")
                .species("Cat")
                .breed("Persian")
                .gender(PetGender.FEMALE)
                .status(PetStatus.ACTIVE)
                .build());

        // Service Category & Service for Evan
        ServiceCategory category = serviceCategoryRepository.save(ServiceCategory.builder()
                .name("Grooming")
                .serviceType(ServiceType.GROOMING)
                .description("Professional dog and cat grooming")
                .isActive(true)
                .build());

        groomingService = serviceRepository.save(Service.builder()
                .provider(providerEvan)
                .category(category)
                .name("Deluxe Bath & Trim")
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
        veterinarianAvailabilityRepository.deleteAll();
        serviceProviderAvailabilityRepository.deleteAll();
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

    // =========================================================================
    // 1. Authentication and Authorization Tests
    // =========================================================================

    @Test
    void testAnonymousAccessDeniedToBookingEndpoints() throws Exception {
        mockMvc.perform(get("/api/me/bookings"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code", is("UNAUTHORIZED")));

        mockMvc.perform(post("/api/me/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/vet/appointments"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/provider/bookings"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testRoleAccessRestrictions() throws Exception {
        // Customer cannot access Vet endpoints
        mockMvc.perform(get("/api/vet/appointments")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code", is("FORBIDDEN")));

        // Customer cannot access Provider endpoints
        mockMvc.perform(get("/api/provider/bookings")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isForbidden());

        // Vet cannot access Provider endpoints
        mockMvc.perform(get("/api/provider/bookings")
                        .header("Authorization", "Bearer " + vetCharlieToken))
                .andExpect(status().isForbidden());

        // Provider cannot access Vet endpoints
        mockMvc.perform(get("/api/vet/appointments")
                        .header("Authorization", "Bearer " + providerEvanToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void testCustomerCannotBookWithAnotherUsersPet() throws Exception {
        LocalDate futureDate = LocalDate.now().plusDays(2);
        CreateBookingRequest req = CreateBookingRequest.builder()
                .bookingType("VETERINARY")
                .petId(bobCat.getId()) // Bob's cat, but Alice is booking
                .veterinarianId(vetCharlie.getId())
                .date(futureDate)
                .startTime(LocalTime.of(10, 0))
                .reason("Routine Checkup")
                .build();

        mockMvc.perform(post("/api/me/bookings")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code", is("FORBIDDEN")));
    }

    @Test
    void testCustomerCannotAccessAnotherCustomersBooking() throws Exception {
        LocalDate futureDate = LocalDate.now().plusDays(3);
        Appointment apt = appointmentRepository.save(Appointment.builder()
                .appointmentNo("APT-ALICE-1")
                .pet(aliceDog)
                .veterinarian(vetCharlie)
                .appointmentDate(futureDate)
                .startTime(LocalTime.of(11, 0))
                .endTime(LocalTime.of(11, 30))
                .consultationFee(BigDecimal.valueOf(150.00))
                .status(AppointmentStatus.PENDING)
                .build());

        // Bob attempts to read Alice's booking
        mockMvc.perform(get("/api/me/bookings/" + apt.getId())
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code", is("FORBIDDEN")));

        // Bob attempts to cancel Alice's booking
        mockMvc.perform(patch("/api/me/bookings/" + apt.getId() + "/cancel")
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void testVeterinarianCannotAccessAnotherVeterinariansAppointment() throws Exception {
        LocalDate futureDate = LocalDate.now().plusDays(3);
        Appointment apt = appointmentRepository.save(Appointment.builder()
                .appointmentNo("APT-CHARLIE-1")
                .pet(aliceDog)
                .veterinarian(vetCharlie)
                .appointmentDate(futureDate)
                .startTime(LocalTime.of(14, 0))
                .endTime(LocalTime.of(14, 30))
                .consultationFee(BigDecimal.valueOf(150.00))
                .status(AppointmentStatus.PENDING)
                .build());

        // Vet Diana attempts to view or update Charlie's appointment
        mockMvc.perform(get("/api/vet/appointments/" + apt.getId())
                        .header("Authorization", "Bearer " + vetDianaToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code", is("FORBIDDEN")));

        UpdateBookingStatusRequest updateReq = UpdateBookingStatusRequest.builder()
                .status("CONFIRMED")
                .build();

        mockMvc.perform(patch("/api/vet/appointments/" + apt.getId() + "/status")
                        .header("Authorization", "Bearer " + vetDianaToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testServiceProviderCannotAccessAnotherProvidersBooking() throws Exception {
        LocalDate futureDate = LocalDate.now().plusDays(4);
        ServiceBooking booking = serviceBookingRepository.save(ServiceBooking.builder()
                .bookingNo("SB-EVAN-1")
                .pet(aliceDog)
                .provider(providerEvan)
                .service(groomingService)
                .bookingDate(futureDate)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(10, 0))
                .price(BigDecimal.valueOf(80.00))
                .status(BookingStatus.PENDING)
                .build());

        // Provider Fiona attempts to access Evan's booking
        mockMvc.perform(get("/api/provider/bookings/" + booking.getId())
                        .header("Authorization", "Bearer " + providerFionaToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code", is("FORBIDDEN")));

        UpdateBookingStatusRequest updateReq = UpdateBookingStatusRequest.builder()
                .status("CONFIRMED")
                .build();

        mockMvc.perform(patch("/api/provider/bookings/" + booking.getId() + "/status")
                        .header("Authorization", "Bearer " + providerFionaToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isForbidden());
    }

    // =========================================================================
    // 2. Booking Creation & Validation Tests
    // =========================================================================

    @Test
    void testCreateVeterinaryAppointmentSuccess() throws Exception {
        LocalDate futureDate = LocalDate.now().plusDays(5);
        CreateBookingRequest req = CreateBookingRequest.builder()
                .bookingType("VETERINARY")
                .petId(aliceDog.getId())
                .veterinarianId(vetCharlie.getId())
                .date(futureDate)
                .startTime(LocalTime.of(10, 0))
                .reason("Vaccination Boosters")
                .build();

        mockMvc.perform(post("/api/me/bookings")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.bookingType", is("VETERINARY")))
                .andExpect(jsonPath("$.data.petName", is("Max")))
                .andExpect(jsonPath("$.data.providerName", is("Charlie Vet")))
                .andExpect(jsonPath("$.data.status", is("PENDING")))
                .andExpect(jsonPath("$.data.amount", is(150.00)));
    }

    @Test
    void testCreateServiceBookingSuccess() throws Exception {
        LocalDate futureDate = LocalDate.now().plusDays(6);
        CreateBookingRequest req = CreateBookingRequest.builder()
                .bookingType("SERVICE")
                .petId(aliceDog.getId())
                .providerId(providerEvan.getId())
                .serviceId(groomingService.getId())
                .date(futureDate)
                .startTime(LocalTime.of(14, 0))
                .notes("Gentle shampoo requested")
                .build();

        mockMvc.perform(post("/api/me/bookings")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.bookingType", is("SERVICE")))
                .andExpect(jsonPath("$.data.serviceOrReason", is("Deluxe Bath & Trim")))
                .andExpect(jsonPath("$.data.providerName", is("Evan's Pet Grooming")))
                .andExpect(jsonPath("$.data.status", is("PENDING")))
                .andExpect(jsonPath("$.data.amount", is(80.00)));
    }

    @Test
    void testCreateBookingPastDateRejected() throws Exception {
        LocalDate pastDate = LocalDate.now().minusDays(1);
        CreateBookingRequest req = CreateBookingRequest.builder()
                .bookingType("VETERINARY")
                .petId(aliceDog.getId())
                .veterinarianId(vetCharlie.getId())
                .date(pastDate)
                .startTime(LocalTime.of(10, 0))
                .build();

        mockMvc.perform(post("/api/me/bookings")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is("VALIDATION_ERROR")));
    }

    @Test
    void testCreateBookingMissingRequiredFields() throws Exception {
        CreateBookingRequest req = CreateBookingRequest.builder()
                .bookingType("VETERINARY")
                // Missing petId, date, startTime
                .build();

        mockMvc.perform(post("/api/me/bookings")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is("VALIDATION_ERROR")));
    }

    @Test
    void testCreateBookingNonexistentVeterinarian() throws Exception {
        LocalDate futureDate = LocalDate.now().plusDays(2);
        CreateBookingRequest req = CreateBookingRequest.builder()
                .bookingType("VETERINARY")
                .petId(aliceDog.getId())
                .veterinarianId(999999L)
                .date(futureDate)
                .startTime(LocalTime.of(10, 0))
                .build();

        mockMvc.perform(post("/api/me/bookings")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code", is("RESOURCE_NOT_FOUND")));
    }

    @Test
    void testCreateBookingOutsideProviderWorkingHoursRejected() throws Exception {
        LocalDate futureDate = LocalDate.now().plusDays(7);
        DayOfWeek dow = futureDate.getDayOfWeek();

        // Set veterinarian working hours 09:00 - 13:00 on this day
        veterinarianAvailabilityRepository.save(VeterinarianAvailability.builder()
                .veterinarian(vetCharlie)
                .dayOfWeek(dow)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(13, 0))
                .slotDurationMinutes(30)
                .isAvailable(true)
                .build());

        // Customer requests 15:00 (outside working hours)
        CreateBookingRequest req = CreateBookingRequest.builder()
                .bookingType("VETERINARY")
                .petId(aliceDog.getId())
                .veterinarianId(vetCharlie.getId())
                .date(futureDate)
                .startTime(LocalTime.of(15, 0))
                .build();

        mockMvc.perform(post("/api/me/bookings")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.code", is("BUSINESS_RULE_VIOLATION")));
    }

    // =========================================================================
    // 3. Double-Booking Prevention & Schedule Conflict Tests
    // =========================================================================

    @Test
    void testDoubleBookingConflictRejected() throws Exception {
        LocalDate futureDate = LocalDate.now().plusDays(5);
        LocalTime startTime = LocalTime.of(10, 0);
        LocalTime endTime = LocalTime.of(10, 30);

        // Pre-existing confirmed appointment for Vet Charlie
        appointmentRepository.save(Appointment.builder()
                .appointmentNo("APT-CONF-1")
                .pet(aliceDog)
                .veterinarian(vetCharlie)
                .appointmentDate(futureDate)
                .startTime(startTime)
                .endTime(endTime)
                .consultationFee(BigDecimal.valueOf(150.00))
                .status(AppointmentStatus.CONFIRMED)
                .build());

        // Bob attempts to book Vet Charlie during the overlapping slot (10:15 - 10:45)
        CreateAppointmentRequest req = CreateAppointmentRequest.builder()
                .veterinarianId(vetCharlie.getId())
                .petId(bobCat.getId())
                .appointmentDate(futureDate)
                .startTime(LocalTime.of(10, 15))
                .endTime(LocalTime.of(10, 45))
                .reason("Consultation")
                .build();

        mockMvc.perform(post("/api/me/appointments")
                        .header("Authorization", "Bearer " + bobToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code", is("SLOT_CONFLICT")));
    }

    @Test
    void testNonOverlappingSlotAccepted() throws Exception {
        LocalDate futureDate = LocalDate.now().plusDays(5);

        // Pre-existing appointment for Vet Charlie (10:00 - 10:30)
        appointmentRepository.save(Appointment.builder()
                .appointmentNo("APT-CONF-1")
                .pet(aliceDog)
                .veterinarian(vetCharlie)
                .appointmentDate(futureDate)
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(10, 30))
                .consultationFee(BigDecimal.valueOf(150.00))
                .status(AppointmentStatus.CONFIRMED)
                .build());

        // Bob books non-overlapping slot (11:00 - 11:30)
        CreateAppointmentRequest req = CreateAppointmentRequest.builder()
                .veterinarianId(vetCharlie.getId())
                .petId(bobCat.getId())
                .appointmentDate(futureDate)
                .startTime(LocalTime.of(11, 0))
                .endTime(LocalTime.of(11, 30))
                .reason("Dental Check")
                .build();

        mockMvc.perform(post("/api/me/appointments")
                        .header("Authorization", "Bearer " + bobToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("PENDING")));
    }

    @Test
    void testServiceBookingDoubleBookingConflictRejected() throws Exception {
        LocalDate futureDate = LocalDate.now().plusDays(8);
        LocalTime startTime = LocalTime.of(14, 0);
        LocalTime endTime = LocalTime.of(15, 0);

        // Existing booking for Evan
        serviceBookingRepository.save(ServiceBooking.builder()
                .bookingNo("SB-EXISTING-1")
                .pet(aliceDog)
                .provider(providerEvan)
                .service(groomingService)
                .bookingDate(futureDate)
                .startTime(startTime)
                .endTime(endTime)
                .price(BigDecimal.valueOf(80.00))
                .status(BookingStatus.CONFIRMED)
                .build());

        // Bob tries to book at overlapping time (14:30)
        CreateServiceBookingRequest req = CreateServiceBookingRequest.builder()
                .providerId(providerEvan.getId())
                .serviceId(groomingService.getId())
                .petId(bobCat.getId())
                .bookingDate(futureDate)
                .startTime(LocalTime.of(14, 30))
                .build();

        mockMvc.perform(post("/api/me/service-bookings")
                        .header("Authorization", "Bearer " + bobToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code", is("SLOT_CONFLICT")));
    }

    // =========================================================================
    // 4. Booking Lifecycle & State Machine Transitions
    // =========================================================================

    @Test
    void testVeterinarianLifecycleTransitions() throws Exception {
        LocalDate futureDate = LocalDate.now().plusDays(10);
        Appointment apt = appointmentRepository.save(Appointment.builder()
                .appointmentNo("APT-LIFECYCLE-1")
                .pet(aliceDog)
                .veterinarian(vetCharlie)
                .appointmentDate(futureDate)
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(10, 30))
                .consultationFee(BigDecimal.valueOf(150.00))
                .status(AppointmentStatus.PENDING)
                .build());

        // 1. PENDING -> CONFIRMED
        UpdateBookingStatusRequest confirmReq = UpdateBookingStatusRequest.builder()
                .status("CONFIRMED")
                .notes("Confirmed by clinic staff")
                .build();

        mockMvc.perform(patch("/api/vet/appointments/" + apt.getId() + "/status")
                        .header("Authorization", "Bearer " + vetCharlieToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(confirmReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("CONFIRMED")));

        // 2. CONFIRMED -> COMPLETED
        UpdateBookingStatusRequest completeReq = UpdateBookingStatusRequest.builder()
                .status("COMPLETED")
                .notes("Treatment concluded successfully")
                .build();

        mockMvc.perform(patch("/api/vet/appointments/" + apt.getId() + "/status")
                        .header("Authorization", "Bearer " + vetCharlieToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(completeReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("COMPLETED")));

        // 3. COMPLETED is terminal -> Cannot transition back to CONFIRMED or CANCELLED
        mockMvc.perform(patch("/api/vet/appointments/" + apt.getId() + "/status")
                        .header("Authorization", "Bearer " + vetCharlieToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(confirmReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code", is("INVALID_STATE_TRANSITION")));
    }

    @Test
    void testCustomerCancellationAndSlotReavailability() throws Exception {
        LocalDate futureDate = LocalDate.now().plusDays(12);
        LocalTime startTime = LocalTime.of(11, 0);
        LocalTime endTime = LocalTime.of(11, 30);

        Appointment apt = appointmentRepository.save(Appointment.builder()
                .appointmentNo("APT-CANCEL-1")
                .pet(aliceDog)
                .veterinarian(vetCharlie)
                .appointmentDate(futureDate)
                .startTime(startTime)
                .endTime(endTime)
                .consultationFee(BigDecimal.valueOf(150.00))
                .status(AppointmentStatus.PENDING)
                .build());

        // Alice cancels the appointment
        CancelBookingRequest cancelReq = CancelBookingRequest.builder()
                .reason("Schedule conflict")
                .build();

        mockMvc.perform(patch("/api/me/bookings/" + apt.getId() + "/cancel")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cancelReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("CANCELLED")));

        // Attempting to cancel already CANCELLED appointment -> 409 Conflict
        mockMvc.perform(patch("/api/me/bookings/" + apt.getId() + "/cancel")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cancelReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code", is("INVALID_STATE_TRANSITION")));

        // Now Bob books the SAME slot that Alice just cancelled -> SUCCESS!
        CreateAppointmentRequest req = CreateAppointmentRequest.builder()
                .veterinarianId(vetCharlie.getId())
                .petId(bobCat.getId())
                .appointmentDate(futureDate)
                .startTime(startTime)
                .endTime(endTime)
                .reason("Checkup")
                .build();

        mockMvc.perform(post("/api/me/appointments")
                        .header("Authorization", "Bearer " + bobToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status", is("PENDING")));
    }

    @Test
    void testServiceProviderLifecycleTransitions() throws Exception {
        LocalDate futureDate = LocalDate.now().plusDays(14);
        ServiceBooking booking = serviceBookingRepository.save(ServiceBooking.builder()
                .bookingNo("SB-PROVIDER-1")
                .pet(aliceDog)
                .provider(providerEvan)
                .service(groomingService)
                .bookingDate(futureDate)
                .startTime(LocalTime.of(15, 0))
                .endTime(LocalTime.of(16, 0))
                .price(BigDecimal.valueOf(80.00))
                .status(BookingStatus.PENDING)
                .build());

        // Confirm
        UpdateBookingStatusRequest confirmReq = UpdateBookingStatusRequest.builder()
                .status("CONFIRMED")
                .build();

        mockMvc.perform(patch("/api/provider/bookings/" + booking.getId() + "/status")
                        .header("Authorization", "Bearer " + providerEvanToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(confirmReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("CONFIRMED")));

        // No-show
        UpdateBookingStatusRequest noShowReq = UpdateBookingStatusRequest.builder()
                .status("NO_SHOW")
                .notes("Customer did not arrive")
                .build();

        mockMvc.perform(patch("/api/provider/bookings/" + booking.getId() + "/status")
                        .header("Authorization", "Bearer " + providerEvanToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(noShowReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("NO_SHOW")));

        // NO_SHOW is terminal -> cannot transition to COMPLETED
        UpdateBookingStatusRequest completeReq = UpdateBookingStatusRequest.builder()
                .status("COMPLETED")
                .build();

        mockMvc.perform(patch("/api/provider/bookings/" + booking.getId() + "/status")
                        .header("Authorization", "Bearer " + providerEvanToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(completeReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code", is("INVALID_STATE_TRANSITION")));
    }

    // =========================================================================
    // 5. Pagination, Sorting and List Endpoints
    // =========================================================================

    @Test
    void testCustomerUnifiedBookingsPagination() throws Exception {
        LocalDate futureDate = LocalDate.now().plusDays(15);

        // Create an appointment and a service booking for Alice
        appointmentRepository.save(Appointment.builder()
                .appointmentNo("APT-PAG-1")
                .pet(aliceDog)
                .veterinarian(vetCharlie)
                .appointmentDate(futureDate)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(9, 30))
                .consultationFee(BigDecimal.valueOf(150.00))
                .status(AppointmentStatus.PENDING)
                .build());

        serviceBookingRepository.save(ServiceBooking.builder()
                .bookingNo("SB-PAG-1")
                .pet(aliceDog)
                .provider(providerEvan)
                .service(groomingService)
                .bookingDate(futureDate.plusDays(1))
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(11, 0))
                .price(BigDecimal.valueOf(80.00))
                .status(BookingStatus.PENDING)
                .build());

        mockMvc.perform(get("/api/me/bookings?page=0&size=10&sort=date,desc")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(2)))
                .andExpect(jsonPath("$.data.totalElements", is(2)))
                .andExpect(jsonPath("$.data.content[0].bookingType", is("SERVICE")))
                .andExpect(jsonPath("$.data.content[1].bookingType", is("VETERINARY")));
    }

    @Test
    void testVeterinarianAppointmentsList() throws Exception {
        LocalDate futureDate = LocalDate.now().plusDays(16);

        appointmentRepository.save(Appointment.builder()
                .appointmentNo("APT-VET-LIST-1")
                .pet(aliceDog)
                .veterinarian(vetCharlie)
                .appointmentDate(futureDate)
                .startTime(LocalTime.of(11, 0))
                .endTime(LocalTime.of(11, 30))
                .consultationFee(BigDecimal.valueOf(150.00))
                .status(AppointmentStatus.CONFIRMED)
                .build());

        mockMvc.perform(get("/api/vet/appointments?status=CONFIRMED&page=0&size=10")
                        .header("Authorization", "Bearer " + vetCharlieToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].veterinarianName", is("Charlie Vet")))
                .andExpect(jsonPath("$.data.content[0].status", is("CONFIRMED")));
    }

    @Test
    void testConcurrentBookingAttemptsPreventDoubleBooking() throws Exception {
        LocalDate futureDate = LocalDate.now().plusDays(18);
        LocalTime startTime = LocalTime.of(10, 0);
        LocalTime endTime = LocalTime.of(10, 30);

        CreateAppointmentRequest reqAlice = CreateAppointmentRequest.builder()
                .veterinarianId(vetCharlie.getId())
                .petId(aliceDog.getId())
                .appointmentDate(futureDate)
                .startTime(startTime)
                .endTime(endTime)
                .reason("Concurrent Test Alice")
                .build();

        CreateAppointmentRequest reqBob = CreateAppointmentRequest.builder()
                .veterinarianId(vetCharlie.getId())
                .petId(bobCat.getId())
                .appointmentDate(futureDate)
                .startTime(startTime)
                .endTime(endTime)
                .reason("Concurrent Test Bob")
                .build();

        int numThreads = 2;
        java.util.concurrent.ExecutorService executor = java.util.concurrent.Executors.newFixedThreadPool(numThreads);
        java.util.concurrent.CountDownLatch readyLatch = new java.util.concurrent.CountDownLatch(numThreads);
        java.util.concurrent.CountDownLatch startLatch = new java.util.concurrent.CountDownLatch(1);
        java.util.concurrent.atomic.AtomicInteger successCount = new java.util.concurrent.atomic.AtomicInteger(0);
        java.util.concurrent.atomic.AtomicInteger conflictCount = new java.util.concurrent.atomic.AtomicInteger(0);

        java.util.concurrent.Callable<Void> taskAlice = () -> {
            readyLatch.countDown();
            try {
                startLatch.await();
                mockMvc.perform(post("/api/me/appointments")
                                .header("Authorization", "Bearer " + aliceToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(reqAlice)))
                        .andExpect(result -> {
                            int status = result.getResponse().getStatus();
                            if (status == 201) successCount.incrementAndGet();
                            else if (status == 409) conflictCount.incrementAndGet();
                        });
            } catch (Exception ignored) {}
            return null;
        };

        java.util.concurrent.Callable<Void> taskBob = () -> {
            readyLatch.countDown();
            try {
                startLatch.await();
                mockMvc.perform(post("/api/me/appointments")
                                .header("Authorization", "Bearer " + bobToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(reqBob)))
                        .andExpect(result -> {
                            int status = result.getResponse().getStatus();
                            if (status == 201) successCount.incrementAndGet();
                            else if (status == 409) conflictCount.incrementAndGet();
                        });
            } catch (Exception ignored) {}
            return null;
        };

        java.util.concurrent.Future<Void> f1 = executor.submit(taskAlice);
        java.util.concurrent.Future<Void> f2 = executor.submit(taskBob);

        readyLatch.await(5, java.util.concurrent.TimeUnit.SECONDS);
        startLatch.countDown();

        f1.get(10, java.util.concurrent.TimeUnit.SECONDS);
        f2.get(10, java.util.concurrent.TimeUnit.SECONDS);
        executor.shutdown();

        assertEquals(1, successCount.get(), "Exactly one booking must succeed");
        assertEquals(1, conflictCount.get(), "The competing booking must be rejected with 409 Conflict");
    }
}
