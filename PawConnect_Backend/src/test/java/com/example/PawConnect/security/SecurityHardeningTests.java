package com.example.PawConnect.security;

import com.example.PawConnect.model.Role;
import com.example.PawConnect.model.User;
import com.example.PawConnect.model.UserRole;
import com.example.PawConnect.model.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class SecurityHardeningTests {

    private JwtService jwtService;
    private final String testSecret = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey", testSecret);
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 900000L); // 15 minutes
    }

    @Test
    void testBlockedUserCannotAuthenticate() {
        User inactiveUser = User.builder()
                .id(1L)
                .email("blocked@pawconnect.com")
                .passwordHash("hashed")
                .status(UserStatus.INACTIVE)
                .build();

        UserDetailsImpl userDetails = new UserDetailsImpl(inactiveUser, List.of());

        assertFalse(userDetails.isEnabled(), "Inactive user must not be enabled");
        assertFalse(userDetails.isAccountNonLocked(), "Inactive user must be marked locked");
    }

    @Test
    void testActiveUserCanAuthenticate() {
        User activeUser = User.builder()
                .id(2L)
                .email("active@pawconnect.com")
                .passwordHash("hashed")
                .status(UserStatus.ACTIVE)
                .build();

        Role petOwnerRole = Role.builder().id(1L).roleCode("PET_OWNER").roleName("Pet Owner").build();
        UserRole userRole = UserRole.builder().id(1L).user(activeUser).role(petOwnerRole).build();

        UserDetailsImpl userDetails = new UserDetailsImpl(activeUser, List.of(userRole));

        assertTrue(userDetails.isEnabled(), "Active user must be enabled");
        assertTrue(userDetails.isAccountNonLocked(), "Active user must be non-locked");
        assertEquals(1, userDetails.getAuthorities().size());
        assertEquals("ROLE_PET_OWNER", userDetails.getAuthorities().iterator().next().getAuthority());
    }

    @Test
    void testInvalidJwtReturnsFalseWithoutThrowing500() {
        User user = User.builder().id(3L).email("user@pawconnect.com").status(UserStatus.ACTIVE).build();
        UserDetailsImpl userDetails = new UserDetailsImpl(user, List.of());

        // Corrupted JWT token string
        String malformedToken = "invalid.token.payload";
        assertFalse(jwtService.isTokenValid(malformedToken, userDetails), "Malformed JWT must return false gracefully");
    }

    @Test
    void testExpiredJwtReturnsFalse() {
        // Set an expired JWT service with negative expiration
        JwtService expiredJwtService = new JwtService();
        ReflectionTestUtils.setField(expiredJwtService, "secretKey", testSecret);
        ReflectionTestUtils.setField(expiredJwtService, "jwtExpiration", -5000L); // expired 5 seconds ago

        User user = User.builder().id(4L).email("expired@pawconnect.com").status(UserStatus.ACTIVE).build();
        UserDetailsImpl userDetails = new UserDetailsImpl(user, List.of());

        String expiredToken = expiredJwtService.generateToken(userDetails);
        assertFalse(jwtService.isTokenValid(expiredToken, userDetails), "Expired JWT must return false");
    }

    @Test
    void testRoleLookupOnlyContainsCurrentUsersRoles() {
        User userA = User.builder().id(10L).email("a@pawconnect.com").status(UserStatus.ACTIVE).build();
        Role adminRole = Role.builder().id(1L).roleCode("ADMIN").roleName("Admin").build();
        UserRole roleA = UserRole.builder().id(1L).user(userA).role(adminRole).build();

        UserDetailsImpl detailsA = new UserDetailsImpl(userA, List.of(roleA));
        assertEquals(1, detailsA.getAuthorities().size());
        assertEquals("ROLE_ADMIN", detailsA.getAuthorities().iterator().next().getAuthority());
    }
}
