package com.example.PawConnect.controller;

import com.example.PawConnect.config.RequestIdFilter;
import com.example.PawConnect.model.Notification;
import com.example.PawConnect.model.NotificationType;
import com.example.PawConnect.model.Role;
import com.example.PawConnect.model.User;
import com.example.PawConnect.model.UserRole;
import com.example.PawConnect.model.UserStatus;
import com.example.PawConnect.repository.NotificationRepository;
import com.example.PawConnect.repository.RoleRepository;
import com.example.PawConnect.repository.UserRepository;
import com.example.PawConnect.repository.UserRoleRepository;
import com.example.PawConnect.security.JwtService;
import com.example.PawConnect.service.NotificationService;
import com.example.PawConnect.service.impl.DevEmailServiceImpl;
import com.example.PawConnect.service.impl.DevSmsServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.FilterChainProxy;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
class NotificationIntegrationTests {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private FilterChainProxy springSecurityFilterChain;

    @Autowired
    private RequestIdFilter requestIdFilter;

    private MockMvc mockMvc;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private NotificationService notificationService;

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

    @Autowired
    private DevEmailServiceImpl devEmailService;

    @Autowired
    private DevSmsServiceImpl devSmsService;

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

        devEmailService.reset();
        devSmsService.reset();

        Role petOwnerRole = roleRepository.findByRoleCode("PET_OWNER").orElseGet(() ->
                roleRepository.save(Role.builder().roleCode("PET_OWNER").roleName("Pet Owner").build()));

        alice = userRepository.save(User.builder()
                .firstName("Alice")
                .lastName("Smith")
                .email("alice_notif@test.com")
                .phone("+919876543210")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .status(UserStatus.ACTIVE)
                .tokenVersion(1)
                .build());
        userRoleRepository.save(UserRole.builder().user(alice).role(petOwnerRole).build());
        aliceToken = jwtService.generateAccessToken(alice, java.util.List.of("ROLE_PET_OWNER"));

        bob = userRepository.save(User.builder()
                .firstName("Bob")
                .lastName("Jones")
                .email("bob_notif@test.com")
                .phone("+919123456789")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .status(UserStatus.ACTIVE)
                .tokenVersion(1)
                .build());
        userRoleRepository.save(UserRole.builder().user(bob).role(petOwnerRole).build());
        bobToken = jwtService.generateAccessToken(bob, java.util.List.of("ROLE_PET_OWNER"));
    }

    @Test
    void testGetNotifications_ReturnsUserNotificationsAndCount() throws Exception {
        notificationService.createNotification(alice, NotificationType.ORDER_CREATED, "Order 1", "Message 1", "ORDER", 101L, "KEY-1");
        notificationService.createNotification(alice, NotificationType.PAYMENT_SUCCESS, "Payment 1", "Message 2", "ORDER", 101L, "KEY-2");
        notificationService.createNotification(bob, NotificationType.ORDER_CREATED, "Bob Order", "Bob Message", "ORDER", 202L, "KEY-BOB-1");

        // Alice retrieves her notifications
        mockMvc.perform(get("/api/me/notifications")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.totalElements", is(2)))
                .andExpect(jsonPath("$.data.content[*].title", containsInAnyOrder("Order 1", "Payment 1")))
                .andExpect(jsonPath("$.data.content[*].title", not(hasItem("Bob Order"))));

        // Alice retrieves unread count
        mockMvc.perform(get("/api/me/notifications/unread-count")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.unreadCount", is(2)));
    }

    @Test
    void testMarkAsRead_Success() throws Exception {
        notificationService.createNotification(alice, NotificationType.ORDER_CREATED, "Order 1", "Message 1", "ORDER", 101L, "KEY-READ-1");
        Notification notification = notificationRepository.findAll().get(0);
        assertFalse(notification.getIsRead());

        mockMvc.perform(patch("/api/me/notifications/" + notification.getId() + "/read")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.isRead", is(true)))
                .andExpect(jsonPath("$.data.readAt", notNullValue()));

        Notification updated = notificationRepository.findById(notification.getId()).orElseThrow();
        assertTrue(updated.getIsRead());
    }

    @Test
    void testMarkAllAsRead_Success() throws Exception {
        notificationService.createNotification(alice, NotificationType.ORDER_CREATED, "Order 1", "Message 1", "ORDER", 101L, "KEY-ALL-1");
        notificationService.createNotification(alice, NotificationType.PAYMENT_SUCCESS, "Payment 1", "Message 2", "ORDER", 101L, "KEY-ALL-2");

        mockMvc.perform(patch("/api/me/notifications/read-all")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        long unread = notificationRepository.countByUserIdAndIsReadFalse(alice.getId());
        assertEquals(0, unread);
    }

    @Test
    void testCrossCustomerNotificationAccess_Forbidden() throws Exception {
        notificationService.createNotification(alice, NotificationType.ORDER_CREATED, "Order 1", "Message 1", "ORDER", 101L, "KEY-CROSS-1");
        Notification notification = notificationRepository.findAll().get(0);

        // Bob tries to mark Alice's notification as read
        mockMvc.perform(patch("/api/me/notifications/" + notification.getId() + "/read")
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isForbidden());

        // Bob tries to delete Alice's notification
        mockMvc.perform(delete("/api/me/notifications/" + notification.getId())
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void testNotificationDeduplication_IgnoresDuplicateKeys() {
        notificationService.createNotification(alice, NotificationType.ORDER_CREATED, "Order Placed", "Msg", "ORDER", 1L, "DEDUPE-KEY-100");
        assertEquals(1, notificationRepository.count());

        // Attempt to create duplicate with identical dedupeKey
        notificationService.createNotification(alice, NotificationType.ORDER_CREATED, "Order Placed Duplicate", "Msg 2", "ORDER", 1L, "DEDUPE-KEY-100");
        assertEquals(1, notificationRepository.count(), "Duplicate notification with identical dedupeKey must be ignored");
    }

    @Test
    void testExternalChannelDeliveryFailure_DoesNotRollBack() {
        devEmailService.setEmailEnabled(true);
        devEmailService.setSimulateFailure(true); // Simulate SMTP network failure

        // Calling notification service with simulated failure must succeed in-app and not throw exception
        assertDoesNotThrow(() -> {
            notificationService.createNotification(
                    alice,
                    NotificationType.ORDER_CONFIRMED,
                    "Order Confirmed",
                    "Your order is confirmed",
                    "ORDER",
                    10L,
                    "KEY-RESILIENT-1"
            );
        });

        // In-app notification must still be safely persisted
        assertEquals(1, notificationRepository.count());
    }

    @AfterEach
    void tearDown() {
        cleanup();
    }

    private void cleanup() {
        notificationRepository.deleteAll();
        userRoleRepository.deleteAll();
        userRepository.deleteAll();
    }
}
