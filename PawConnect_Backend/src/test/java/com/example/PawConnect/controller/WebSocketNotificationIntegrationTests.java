package com.example.PawConnect.controller;

import com.example.PawConnect.config.RequestIdFilter;
import com.example.PawConnect.dto.request.booking.UpdateBookingStatusRequest;
import com.example.PawConnect.dto.response.NotificationResponse;
import com.example.PawConnect.dto.response.notification.RealtimeNotificationPayload;
import com.example.PawConnect.model.*;
import com.example.PawConnect.repository.*;
import com.example.PawConnect.security.JwtService;
import com.example.PawConnect.security.StompChannelInterceptor;
import com.example.PawConnect.service.NotificationService;
import com.example.PawConnect.service.WebSocketNotificationPublisher;
import com.example.PawConnect.service.impl.ScheduledReminderService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
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

import com.example.PawConnect.dto.request.booking.CreateBookingRequest;
import org.springframework.http.MediaType;
import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
class WebSocketNotificationIntegrationTests {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private FilterChainProxy springSecurityFilterChain;

    @Autowired
    private RequestIdFilter requestIdFilter;

    private MockMvc mockMvc;

    @Autowired
    private StompChannelInterceptor stompChannelInterceptor;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private ScheduledReminderService scheduledReminderService;

    @MockitoSpyBean
    private WebSocketNotificationPublisher webSocketNotificationPublisher;

    @MockitoSpyBean
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private NotificationRepository notificationRepository;

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
    private ServiceBookingRepository serviceBookingRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private User alice;
    private String aliceToken;

    private User bob;

    private User vetUser;
    private Veterinarian vet;
    private String vetToken;

    private Pet aliceDog;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .addFilters(requestIdFilter, springSecurityFilterChain)
                .build();

        cleanup();

        Role petOwnerRole = roleRepository.findByRoleCode("PET_OWNER").orElseGet(() ->
                roleRepository.save(Role.builder().roleCode("PET_OWNER").roleName("Pet Owner").build()));
        Role vetRole = roleRepository.findByRoleCode("VETERINARIAN").orElseGet(() ->
                roleRepository.save(Role.builder().roleCode("VETERINARIAN").roleName("Veterinarian").build()));

        alice = userRepository.save(User.builder()
                .email("alice_ws@example.com")
                .passwordHash(passwordEncoder.encode("SecurePass123!"))
                .firstName("Alice")
                .lastName("Owner")
                .phone("+919999900001")
                .status(UserStatus.ACTIVE)
                .tokenVersion(0)
                .build());
        userRoleRepository.save(UserRole.builder().user(alice).role(petOwnerRole).build());
        aliceToken = jwtService.generateAccessToken(alice, List.of("ROLE_PET_OWNER"));

        bob = userRepository.save(User.builder()
                .email("bob_ws@example.com")
                .passwordHash(passwordEncoder.encode("SecurePass123!"))
                .firstName("Bob")
                .lastName("Owner")
                .phone("+919999900002")
                .status(UserStatus.ACTIVE)
                .tokenVersion(0)
                .build());
        userRoleRepository.save(UserRole.builder().user(bob).role(petOwnerRole).build());

        vetUser = userRepository.save(User.builder()
                .email("vet_ws@example.com")
                .passwordHash(passwordEncoder.encode("SecurePass123!"))
                .firstName("Doctor")
                .lastName("Vet")
                .phone("+919999900003")
                .status(UserStatus.ACTIVE)
                .tokenVersion(0)
                .build());
        userRoleRepository.save(UserRole.builder().user(vetUser).role(vetRole).build());
        vetToken = jwtService.generateAccessToken(vetUser, List.of("ROLE_VETERINARIAN"));

        vet = veterinarianRepository.save(Veterinarian.builder()
                .user(vetUser)
                .specialization("General Practice")
                .licenseNumber("VET-WS-101")
                .clinicName("Pet Care Clinic")
                .consultationFee(BigDecimal.valueOf(500.00))
                .verificationStatus(VeterinarianVerificationStatus.APPROVED)
                .isActive(true)
                .build());

        // Set up availability for all days
        for (DayOfWeek day : DayOfWeek.values()) {
            veterinarianAvailabilityRepository.save(VeterinarianAvailability.builder()
                    .veterinarian(vet)
                    .dayOfWeek(day)
                    .startTime(LocalTime.of(8, 0))
                    .endTime(LocalTime.of(20, 0))
                    .slotDurationMinutes(30)
                    .isAvailable(true)
                    .build());
        }

        aliceDog = petRepository.save(Pet.builder()
                .owner(alice)
                .name("Buddy")
                .species("DOG")
                .breed("Golden Retriever")
                .dateOfBirth(LocalDate.of(2021, 5, 10))
                .gender(PetGender.MALE)
                .status(PetStatus.ACTIVE)
                .build());
    }

    @AfterEach
    void tearDown() {
        cleanup();
    }

    private void cleanup() {
        notificationRepository.deleteAll();
        appointmentRepository.deleteAll();
        serviceBookingRepository.deleteAll();
        veterinarianAvailabilityRepository.deleteAll();
        serviceProviderAvailabilityRepository.deleteAll();
        veterinarianRepository.deleteAll();
        serviceProviderRepository.deleteAll();
        petRepository.deleteAll();
        userRoleRepository.deleteAll();
        userRepository.deleteAll();
    }

    // =========================================================================
    // PART A & B: STOMP CONNECT AUTHENTICATION TESTS
    // =========================================================================

    @Test
    void stompConnect_WithValidJwt_ShouldAuthenticatePrincipal() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.addNativeHeader("Authorization", "Bearer " + aliceToken);

        MessageChannel mockChannel = mock(MessageChannel.class);
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        Message<?> result = stompChannelInterceptor.preSend(message, mockChannel);

        assertNotNull(result);
        StompHeaderAccessor postAccessor = StompHeaderAccessor.wrap(result);
        assertNotNull(postAccessor.getUser(), "Authenticated Principal must be set on accessor");
        assertEquals("alice_ws@example.com", postAccessor.getUser().getName());
    }

    @Test
    void stompConnect_WithMissingAuthorizationHeader_ShouldThrowException() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        MessageChannel mockChannel = mock(MessageChannel.class);
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertThrows(AuthenticationCredentialsNotFoundException.class, () ->
                stompChannelInterceptor.preSend(message, mockChannel)
        );
    }

    @Test
    void stompConnect_WithMalformedAuthorizationHeader_ShouldThrowException() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.addNativeHeader("Authorization", "Basic dXNlcjpwYXNz");
        MessageChannel mockChannel = mock(MessageChannel.class);
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertThrows(AuthenticationCredentialsNotFoundException.class, () ->
                stompChannelInterceptor.preSend(message, mockChannel)
        );
    }

    @Test
    void stompConnect_WithInvalidTokenSignature_ShouldThrowBadCredentials() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.addNativeHeader("Authorization", "Bearer invalid.jwt.token.here");
        MessageChannel mockChannel = mock(MessageChannel.class);
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertThrows(BadCredentialsException.class, () ->
                stompChannelInterceptor.preSend(message, mockChannel)
        );
    }

    @Test
    void stompConnect_WithRefreshToken_ShouldBeStrictlyRejected() {
        String refreshToken = jwtService.generateRefreshToken(alice);
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.addNativeHeader("Authorization", "Bearer " + refreshToken);
        MessageChannel mockChannel = mock(MessageChannel.class);
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertThrows(BadCredentialsException.class, () ->
                stompChannelInterceptor.preSend(message, mockChannel)
        );
    }

    @Test
    void stompConnect_WithRevokedTokenVersion_ShouldThrowBadCredentials() {
        // Increment token version in database to simulate logout / token revocation
        alice.setTokenVersion(1);
        userRepository.save(alice);

        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        // aliceToken has version 0
        accessor.addNativeHeader("Authorization", "Bearer " + aliceToken);
        MessageChannel mockChannel = mock(MessageChannel.class);
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertThrows(BadCredentialsException.class, () ->
                stompChannelInterceptor.preSend(message, mockChannel)
        );
    }

    @Test
    void stompConnect_WithInactiveUser_ShouldThrowBadCredentials() {
        alice.setStatus(UserStatus.BLOCKED);
        userRepository.save(alice);

        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.addNativeHeader("Authorization", "Bearer " + aliceToken);
        MessageChannel mockChannel = mock(MessageChannel.class);
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertThrows(BadCredentialsException.class, () ->
                stompChannelInterceptor.preSend(message, mockChannel)
        );
    }

    // =========================================================================
    // PART C: DESTINATION AUTHORIZATION TESTS
    // =========================================================================

    @Test
    void stompSubscribe_ToUserPrivateQueue_ShouldBeAllowed() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination("/user/queue/notifications");
        accessor.setUser(new UsernamePasswordAuthenticationToken(alice.getEmail(), null, List.of()));

        MessageChannel mockChannel = mock(MessageChannel.class);
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        Message<?> result = stompChannelInterceptor.preSend(message, mockChannel);
        assertNotNull(result, "Allowed subscription should proceed");
    }

    @Test
    void stompSubscribe_Unauthenticated_ShouldThrowAccessDenied() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination("/user/queue/notifications");
        // No user set on accessor

        MessageChannel mockChannel = mock(MessageChannel.class);
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertThrows(AccessDeniedException.class, () ->
                stompChannelInterceptor.preSend(message, mockChannel)
        );
    }

    @Test
    void stompSubscribe_ToAnotherUserQueue_ShouldThrowAccessDenied() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination("/user/bob_ws@example.com/queue/notifications");
        accessor.setUser(new UsernamePasswordAuthenticationToken(alice.getEmail(), null, List.of()));

        MessageChannel mockChannel = mock(MessageChannel.class);
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertThrows(AccessDeniedException.class, () ->
                stompChannelInterceptor.preSend(message, mockChannel)
        );
    }

    @Test
    void stompSubscribe_ToBroadcastTopic_ShouldThrowAccessDenied() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination("/topic/all_users");
        accessor.setUser(new UsernamePasswordAuthenticationToken(alice.getEmail(), null, List.of()));

        MessageChannel mockChannel = mock(MessageChannel.class);
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertThrows(AccessDeniedException.class, () ->
                stompChannelInterceptor.preSend(message, mockChannel)
        );
    }

    @Test
    void stompSend_FromClient_ShouldBeDenied() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SEND);
        accessor.setDestination("/app/chat");
        accessor.setUser(new UsernamePasswordAuthenticationToken(alice.getEmail(), null, List.of()));

        MessageChannel mockChannel = mock(MessageChannel.class);
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertThrows(AccessDeniedException.class, () ->
                stompChannelInterceptor.preSend(message, mockChannel)
        );
    }

    // =========================================================================
    // PART D: EVENT-DRIVEN PERSISTENCE & REAL-TIME PUBLISHING TESTS
    // =========================================================================

    @Test
    void createNotification_ShouldPersistRecord_AndPublishRealtimeMessage() {
        NotificationResponse response = notificationService.createNotification(
                alice,
                NotificationType.ORDER_CREATED,
                "Order Created",
                "Your order ORD-123 has been created.",
                "ORDER",
                101L,
                "NOTIF-ORD-101-CREATED"
        );

        assertNotNull(response);
        assertNotNull(response.getId());
        assertEquals("Order Created", response.getTitle());

        // Verify notification is persisted in database
        Notification persisted = notificationRepository.findById(response.getId()).orElse(null);
        assertNotNull(persisted);
        assertEquals("NOTIF-ORD-101-CREATED", persisted.getDedupeKey());

        // Verify WebSocket publisher was invoked for alice
        ArgumentCaptor<RealtimeNotificationPayload> payloadCaptor = ArgumentCaptor.forClass(RealtimeNotificationPayload.class);
        verify(webSocketNotificationPublisher, atLeastOnce()).publishToUser(eq(alice.getEmail()), payloadCaptor.capture());

        RealtimeNotificationPayload captured = payloadCaptor.getValue();
        assertEquals(response.getId(), captured.getId());
        assertEquals(alice.getId(), captured.getUserId());
        assertEquals(NotificationType.ORDER_CREATED, captured.getNotificationType());
        assertEquals("Order Created", captured.getTitle());
        assertEquals("ORDER", captured.getReferenceType());
        assertEquals(101L, captured.getReferenceId());
        assertFalse(captured.getIsRead());
    }

    @Test
    void createNotification_DuplicateDedupeKey_ShouldNotCreateDuplicateOrPublishAgain() {
        reset(webSocketNotificationPublisher);

        // First call
        NotificationResponse first = notificationService.createNotification(
                alice,
                NotificationType.ORDER_CREATED,
                "Order Created",
                "Order message",
                "ORDER",
                101L,
                "NOTIF-DEDUPE-UNIQUE-KEY"
        );

        // Second call with identical dedupeKey
        NotificationResponse second = notificationService.createNotification(
                alice,
                NotificationType.ORDER_CREATED,
                "Order Created",
                "Order message",
                "ORDER",
                101L,
                "NOTIF-DEDUPE-UNIQUE-KEY"
        );

        assertEquals(first.getId(), second.getId(), "Must return existing notification for duplicate dedupeKey");
        assertEquals(1, notificationRepository.count(), "Only 1 record should exist in database");

        // Verify publisher was called exactly once (for first creation), NOT twice
        verify(webSocketNotificationPublisher, times(1)).publishToUser(eq(alice.getEmail()), any());
    }

    @Test
    void webSocketPublisherFailure_ShouldNotRollbackBusinessOperation() {
        // Configure messagingTemplate to simulate broker dispatch failure
        doThrow(new RuntimeException("STOMP Broker connection severed"))
                .when(messagingTemplate)
                .convertAndSendToUser(anyString(), anyString(), any());

        // Notification creation must not throw exception or roll back
        assertDoesNotThrow(() -> {
            notificationService.createNotification(
                    alice,
                    NotificationType.PAYMENT_SUCCESS,
                    "Payment Successful",
                    "Payment received successfully",
                    "PAYMENT",
                    202L,
                    "NOTIF-BROKER-FAIL-TEST"
            );
        });

        // Database record must still exist
        Notification saved = notificationRepository.findByDedupeKey("NOTIF-BROKER-FAIL-TEST").orElse(null);
        assertNotNull(saved, "Notification record must remain saved in database even if WebSocket fails");
    }

    // =========================================================================
    // PART E: BUSINESS DOMAIN EVENTS INTEGRATION TESTS
    // =========================================================================

    @Test
    void bookingEvents_CreateAndStatusTransition_ShouldEmitNotifications() throws Exception {
        reset(webSocketNotificationPublisher);

        // Alice books an appointment with Vet Doctor via REST API
        LocalDate appointmentDate = LocalDate.now().plusDays(2);
        CreateBookingRequest req = CreateBookingRequest.builder()
                .bookingType("VETERINARY")
                .petId(aliceDog.getId())
                .veterinarianId(vet.getId())
                .date(appointmentDate)
                .startTime(LocalTime.of(10, 0))
                .reason("Routine Health Checkup")
                .build();

        mockMvc.perform(post("/api/me/bookings")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(new ObjectMapper().registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule()).writeValueAsString(req)))
                .andExpect(status().isCreated());

        // Retrieve appointment id from database
        List<Appointment> appointments = appointmentRepository.findAll();
        assertFalse(appointments.isEmpty());
        Appointment savedApt = appointments.get(0);

        // Verify vet received BOOKING_CREATED notification
        Notification vetNotif = notificationRepository.findByDedupeKey("NOTIF-APT-" + savedApt.getId() + "-CREATED").orElse(null);
        assertNotNull(vetNotif, "Veterinarian must receive booking created notification");
        assertEquals(NotificationType.BOOKING_CREATED, vetNotif.getNotificationType());
        assertEquals(vetUser.getId(), vetNotif.getUser().getId());

        // Now vet transitions status to CONFIRMED via REST API
        UpdateBookingStatusRequest statusRequest = new UpdateBookingStatusRequest();
        statusRequest.setStatus("CONFIRMED");
        statusRequest.setNotes("Confirmed by clinic");

        mockMvc.perform(patch("/api/vet/appointments/" + savedApt.getId() + "/status")
                        .header("Authorization", "Bearer " + vetToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(new ObjectMapper().writeValueAsString(statusRequest)))
                .andExpect(status().isOk());

        // Verify Alice received BOOKING_CONFIRMED notification
        Notification aliceNotif = notificationRepository.findByDedupeKey("NOTIF-APT-" + savedApt.getId() + "-CONFIRMED").orElse(null);
        assertNotNull(aliceNotif, "Pet owner must receive booking confirmed notification");
        assertEquals(NotificationType.BOOKING_CONFIRMED, aliceNotif.getNotificationType());
        assertEquals(alice.getId(), aliceNotif.getUser().getId());
    }

    // =========================================================================
    // PART H: SCHEDULED REMINDERS TESTS
    // =========================================================================

    @Test
    void scheduledReminders_ShouldProcessConfirmedUpcomingBookings_Idempotently() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);

        // 1. Confirmed appointment tomorrow -> Should receive reminder
        Appointment confirmedApt = appointmentRepository.save(Appointment.builder()
                .appointmentNo("APT-REM-001")
                .pet(aliceDog)
                .veterinarian(vet)
                .appointmentDate(tomorrow)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(10, 0))
                .consultationFee(BigDecimal.valueOf(500.00))
                .status(AppointmentStatus.CONFIRMED)
                .build());

        // 2. Cancelled appointment tomorrow -> Should NOT receive reminder
        appointmentRepository.save(Appointment.builder()
                .appointmentNo("APT-REM-002")
                .pet(aliceDog)
                .veterinarian(vet)
                .appointmentDate(tomorrow)
                .startTime(LocalTime.of(11, 0))
                .endTime(LocalTime.of(12, 0))
                .consultationFee(BigDecimal.valueOf(500.00))
                .status(AppointmentStatus.CANCELLED)
                .build());

        // Run reminder sweep
        int remindersSent = scheduledReminderService.sendUpcomingReminders();
        assertEquals(1, remindersSent, "Only the 1 confirmed appointment should generate a reminder");

        // Verify persisted reminder notification
        String expectedDedupeKey = String.format("REMINDER-APT-%d-%s", confirmedApt.getId(), tomorrow);
        Notification reminder = notificationRepository.findByDedupeKey(expectedDedupeKey).orElse(null);
        assertNotNull(reminder, "Reminder notification must be persisted");
        assertEquals(NotificationType.APPOINTMENT_REMINDER, reminder.getNotificationType());
        assertEquals(alice.getId(), reminder.getUser().getId());

        // Repeated run on the same day -> Must be idempotent, no duplicates
        scheduledReminderService.sendUpcomingReminders();
        // Since createNotification deduplicates on existing dedupeKey, second sweep should not add new records
        long reminderCount = notificationRepository.count();
        assertEquals(1, reminderCount, "Second sweep must not create duplicate reminder notifications");
    }

    // =========================================================================
    // PART G: RECONNECTION & REST FALLBACK TESTS
    // =========================================================================

    @Test
    void reconnectFallback_UnreadNotificationsRetrievableViaRest() throws Exception {
        // Create 2 notifications for Alice
        notificationService.createNotification(
                alice,
                NotificationType.ORDER_CREATED,
                "Order 1",
                "Order 1 Placed",
                "ORDER",
                301L,
                "NOTIF-RECONNECT-1"
        );
        notificationService.createNotification(
                alice,
                NotificationType.ORDER_DELIVERED,
                "Order 1 Delivered",
                "Order 1 has arrived",
                "ORDER",
                301L,
                "NOTIF-RECONNECT-2"
        );

        // Client reconnects and queries REST API
        mockMvc.perform(get("/api/me/notifications/unread-count")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unreadCount", is(2)));

        mockMvc.perform(get("/api/me/notifications")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements", is(2)))
                .andExpect(jsonPath("$.data.content[0].title").exists());
    }
}
