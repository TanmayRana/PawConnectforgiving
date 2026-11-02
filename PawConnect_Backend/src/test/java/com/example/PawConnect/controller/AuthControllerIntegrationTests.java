package com.example.PawConnect.controller;

import com.example.PawConnect.config.RequestIdFilter;
import com.example.PawConnect.dto.request.auth.*;
import com.example.PawConnect.model.Role;
import com.example.PawConnect.model.User;
import com.example.PawConnect.model.UserRole;
import com.example.PawConnect.model.UserStatus;
import com.example.PawConnect.repository.*;
import com.example.PawConnect.service.OtpService;
import com.example.PawConnect.service.impl.DevEmailServiceImpl;
import com.fasterxml.jackson.databind.JsonNode;
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
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
class AuthControllerIntegrationTests {

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
    private OtpService otpService;

    @Autowired
    private DevEmailServiceImpl devEmailService;

    private ResultActions registerWithVerifiedOtp(String jsonBody) throws Exception {
        mockMvc.perform(post("/api/auth/register/otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("Verification code")));

        String mail = devEmailService.getLastBody();
        assertNotNull(mail);
        String marker = "Code: ";
        int start = mail.indexOf(marker);
        assertTrue(start >= 0, "Registration email must contain the OTP");
        String otp = mail.substring(start + marker.length());
        int lineEnd = otp.indexOf('\n');
        if (lineEnd >= 0) {
            otp = otp.substring(0, lineEnd);
        }
        otp = otp.replace("\r", "").trim();

        String email = objectMapper.readTree(jsonBody).get("email").asText();
        assertTrue(userRepository.findByEmail(email.toLowerCase()).isEmpty(), "User must not exist before OTP verification");

        return mockMvc.perform(post("/api/auth/register/verify")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"otp\":\"" + otp + "\"}"));
    }

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .addFilters(requestIdFilter, springSecurityFilterChain)
                .build();

        notificationRepository.deleteAll();
        orderStatusHistoryRepository.deleteAll();
        orderItemRepository.deleteAll();
        orderRepository.deleteAll();
        cartItemRepository.deleteAll();
        cartRepository.deleteAll();
        userRoleRepository.deleteAll();
        userRepository.deleteAll();

        if (roleRepository.findByRoleCode("PET_OWNER").isEmpty()) {
            roleRepository.save(Role.builder()
                    .roleCode("PET_OWNER")
                    .roleName("Pet Owner")
                    .description("Default pet owner role")
                    .build());
        }
        if (roleRepository.findByRoleCode("ADMIN").isEmpty()) {
            roleRepository.save(Role.builder()
                    .roleCode("ADMIN")
                    .roleName("Admin")
                    .description("System administrator")
                    .build());
        }
    }

    @AfterEach
    void tearDown() {
        notificationRepository.deleteAll();
        orderStatusHistoryRepository.deleteAll();
        orderItemRepository.deleteAll();
        orderRepository.deleteAll();
        cartItemRepository.deleteAll();
        cartRepository.deleteAll();
        userRoleRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void testRegisterSuccessAndDefaultsToPetOwner() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .firstName("Alice")
                .lastName("Smith")
                .email("auth_alice@test.com")
                .phone("+12345678901")
                .password("SecurePass123!")
                .confirmPassword("SecurePass123!")
                .build();

        registerWithVerifiedOtp(objectMapper.writeValueAsString(request))
                .andExpect(status().isCreated())
                .andExpect(header().exists("X-Request-ID"))
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.code", is("SUCCESS")))
                .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                .andExpect(jsonPath("$.data.refreshToken", notNullValue()))
                .andExpect(jsonPath("$.data.tokenType", is("Bearer")))
                .andExpect(jsonPath("$.data.user.email", is("auth_alice@test.com")))
                .andExpect(jsonPath("$.data.user.roles[0]", is("PET_OWNER")))
                .andExpect(jsonPath("$.meta.requestId", notNullValue()))
                .andReturn();

        // Verify database persistence
        User saved = userRepository.findByEmail("auth_alice@test.com").orElse(null);
        assertNotNull(saved);
        assertEquals(UserStatus.ACTIVE, saved.getStatus());
        assertTrue(passwordEncoder.matches("SecurePass123!", saved.getPasswordHash()));
    }

    @Test
    void testRegisterRoleEscalationIsPrevented() throws Exception {
        // Malicious client payload trying to inject ADMIN role
        String payload = """
                {
                    "firstName": "Hacker",
                    "lastName": "User",
                    "email": "auth_hacker@test.com",
                    "password": "SecurePass123!",
                    "confirmPassword": "SecurePass123!",
                    "role": "ADMIN",
                    "roles": ["ADMIN"]
                }
                """;

        registerWithVerifiedOtp(payload)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.user.roles[0]", is("PET_OWNER")))
                .andExpect(jsonPath("$.data.user.roles", hasSize(1)));

        User saved = userRepository.findByEmail("auth_hacker@test.com").orElseThrow();
        var userRoles = userRoleRepository.findByUserIdWithRole(saved.getId());
        assertEquals(1, userRoles.size());
        assertEquals("PET_OWNER", userRoles.get(0).getRole().getRoleCode());
    }

    @Test
    void testRegisterDuplicateEmailReturnsConflict() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .firstName("Bob")
                .lastName("Jones")
                .email("auth_bob@test.com")
                .password("SecurePass123!")
                .confirmPassword("SecurePass123!")
                .build();

        registerWithVerifiedOtp(objectMapper.writeValueAsString(request))
                .andExpect(status().isCreated());

        // Second registration with duplicate email
        mockMvc.perform(post("/api/auth/register/otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.code", is("DUPLICATE_RESOURCE")));
    }

    @Test
    void testRegisterPasswordMismatchReturnsValidationError() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .firstName("Carol")
                .lastName("Taylor")
                .email("auth_carol@test.com")
                .password("SecurePass123!")
                .confirmPassword("DifferentPass123!")
                .build();

        mockMvc.perform(post("/api/auth/register/otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("Passwords do not match")));

        assertTrue(userRepository.findByEmail("auth_carol@test.com").isEmpty());
    }

    @Test
    void testLoginSuccess() throws Exception {
        // Seed user
        User user = userRepository.save(User.builder()
                .firstName("David")
                .lastName("Miller")
                .email("auth_david@test.com")
                .passwordHash(passwordEncoder.encode("SecurePass123!"))
                .status(UserStatus.ACTIVE)
                .tokenVersion(1)
                .build());

        Role role = roleRepository.findByRoleCode("PET_OWNER").orElseThrow();
        userRoleRepository.save(UserRole.builder().user(user).role(role).build());

        LoginRequest loginRequest = LoginRequest.builder()
                .email("auth_david@test.com")
                .password("SecurePass123!")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                .andExpect(jsonPath("$.data.refreshToken", notNullValue()))
                .andExpect(jsonPath("$.data.user.email", is("auth_david@test.com")));
    }

    @Test
    void testLoginWithInvalidPasswordReturns401SafeError() throws Exception {
        userRepository.save(User.builder()
                .firstName("David")
                .lastName("Miller")
                .email("auth_david2@test.com")
                .passwordHash(passwordEncoder.encode("SecurePass123!"))
                .status(UserStatus.ACTIVE)
                .tokenVersion(1)
                .build());

        LoginRequest loginRequest = LoginRequest.builder()
                .email("auth_david2@test.com")
                .password("WrongPassword999!")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.code", is("INVALID_CREDENTIALS")))
                .andExpect(jsonPath("$.message", is("Invalid email or password")));
    }

    @Test
    void testLoginWithUnknownEmailReturnsSameGenericError() throws Exception {
        LoginRequest loginRequest = LoginRequest.builder()
                .email("auth_nonexistent@test.com")
                .password("SomePassword123!")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.code", is("INVALID_CREDENTIALS")))
                .andExpect(jsonPath("$.message", is("Invalid email or password")));
    }

    @Test
    void testBlockedUserCannotLogin() throws Exception {
        userRepository.save(User.builder()
                .firstName("Blocked")
                .lastName("User")
                .email("auth_blocked@test.com")
                .passwordHash(passwordEncoder.encode("SecurePass123!"))
                .status(UserStatus.BLOCKED)
                .tokenVersion(1)
                .build());

        LoginRequest loginRequest = LoginRequest.builder()
                .email("auth_blocked@test.com")
                .password("SecurePass123!")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message", containsString("Account is blocked")));
    }

    @Test
    void testGetMeWithValidTokenReturnsUserResponse() throws Exception {
        // Register user
        RegisterRequest registerRequest = RegisterRequest.builder()
                .firstName("Emma")
                .lastName("Watson")
                .email("auth_emma@test.com")
                .password("SecurePass123!")
                .confirmPassword("SecurePass123!")
                .build();

        MvcResult regResult = registerWithVerifiedOtp(objectMapper.writeValueAsString(registerRequest))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode json = objectMapper.readTree(regResult.getResponse().getContentAsString());
        String accessToken = json.get("data").get("accessToken").asText();

        // Call /api/me with Bearer token
        mockMvc.perform(get("/api/me")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.email", is("auth_emma@test.com")))
                .andExpect(jsonPath("$.data.firstName", is("Emma")))
                .andExpect(jsonPath("$.data.lastName", is("Watson")))
                .andExpect(jsonPath("$.data.roles[0]", is("PET_OWNER")));
    }

    @Test
    void testGetMeWithoutTokenReturns401() throws Exception {
        mockMvc.perform(get("/api/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.code", is("UNAUTHORIZED")));
    }

    @Test
    void testRefreshTokenFlowAndRevocation() throws Exception {
        RegisterRequest registerRequest = RegisterRequest.builder()
                .firstName("Frank")
                .lastName("Sinatra")
                .email("auth_frank@test.com")
                .password("SecurePass123!")
                .confirmPassword("SecurePass123!")
                .build();

        MvcResult regResult = registerWithVerifiedOtp(objectMapper.writeValueAsString(registerRequest))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode json = objectMapper.readTree(regResult.getResponse().getContentAsString());
        String refreshToken = json.get("data").get("refreshToken").asText();

        // 1. Valid Refresh Token Request
        RefreshTokenRequest refreshReq = RefreshTokenRequest.builder().refreshToken(refreshToken).build();
        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refreshReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                .andExpect(jsonPath("$.data.refreshToken", notNullValue()));

        // 2. Perform Logout
        mockMvc.perform(post("/api/auth/logout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refreshReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("Logged out successfully")));

        // 3. Old refresh token should now be rejected as revoked (token version mismatch)
        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refreshReq)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code", is("UNAUTHORIZED")));
    }

    @Test
    void testForgotPasswordVerifyOtpAndResetPasswordFlow() throws Exception {
        // Create user
        RegisterRequest registerRequest = RegisterRequest.builder()
                .firstName("Grace")
                .lastName("Hopper")
                .email("auth_grace@test.com")
                .password("OldSecurePass123!")
                .confirmPassword("OldSecurePass123!")
                .build();

        registerWithVerifiedOtp(objectMapper.writeValueAsString(registerRequest))
                .andExpect(status().isCreated());

        // 1. Forgot password request
        ForgotPasswordRequest forgotReq = ForgotPasswordRequest.builder().email("auth_grace@test.com").build();
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(forgotReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("password reset OTP has been sent")));

        // 2. Fetch the generated OTP via OtpService testing helper
        String otp = otpService.getActiveOtpForTesting("auth_grace@test.com");
        assertNotNull(otp);

        // 3. Verify OTP
        VerifyOtpRequest verifyReq = VerifyOtpRequest.builder().email("auth_grace@test.com").otp(otp).build();
        MvcResult verifyResult = mockMvc.perform(post("/api/auth/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.resetToken", notNullValue()))
                .andReturn();

        String resetToken = objectMapper.readTree(verifyResult.getResponse().getContentAsString())
                .get("data").get("resetToken").asText();

        // 4. Reset Password
        ResetPasswordRequest resetReq = ResetPasswordRequest.builder()
                .email("auth_grace@test.com")
                .resetToken(resetToken)
                .newPassword("NewSecurePass456@")
                .confirmPassword("NewSecurePass456@")
                .build();

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resetReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("Password reset successfully")));

        // 5. Old password fails
        LoginRequest oldLogin = LoginRequest.builder().email("auth_grace@test.com").password("OldSecurePass123!").build();
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(oldLogin)))
                .andExpect(status().isUnauthorized());

        // 6. New password succeeds
        LoginRequest newLogin = LoginRequest.builder().email("auth_grace@test.com").password("NewSecurePass456@").build();
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newLogin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken", notNullValue()));
    }
}
