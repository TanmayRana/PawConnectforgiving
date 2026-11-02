package com.example.PawConnect.service.impl;

import com.example.PawConnect.dto.request.auth.*;
import com.example.PawConnect.dto.response.AuthResponse;
import com.example.PawConnect.dto.response.UserResponse;
import com.example.PawConnect.exception.*;
import com.example.PawConnect.mapper.UserMapper;
import com.example.PawConnect.model.Role;
import com.example.PawConnect.model.User;
import com.example.PawConnect.model.UserRole;
import com.example.PawConnect.model.UserStatus;
import com.example.PawConnect.repository.RoleRepository;
import com.example.PawConnect.repository.UserRepository;
import com.example.PawConnect.repository.UserRoleRepository;
import com.example.PawConnect.security.JwtService;
import com.example.PawConnect.service.AuthService;
import com.example.PawConnect.service.EmailService;
import com.example.PawConnect.service.EmailTemplateService;
import com.example.PawConnect.service.OtpService;
import com.example.PawConnect.service.RateLimiterService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserMapper userMapper;
    private final OtpService otpService;
    private final RateLimiterService rateLimiterService;
    private final EmailService emailService;
    private final EmailTemplateService emailTemplateService;
    private final SecureRandom secureRandom = new SecureRandom();
    private final ConcurrentHashMap<String, PendingRegistration> pendingRegistrations = new ConcurrentHashMap<>();

    private static final Duration REGISTER_OTP_TTL = Duration.ofMinutes(5);
    private static final Duration REGISTER_OTP_COOLDOWN = Duration.ofSeconds(60);
    private static final int REGISTER_OTP_MAX_ATTEMPTS = 3;

    private static final class PendingRegistration {
        private final String firstName;
        private final String lastName;
        private final String email;
        private final String phone;
        private final String passwordHash;
        private String otp;
        private Instant expiresAt;
        private Instant sentAt;
        private int attempts;

        private PendingRegistration(
                String firstName,
                String lastName,
                String email,
                String phone,
                String passwordHash,
                String otp,
                Instant expiresAt,
                Instant sentAt
        ) {
            this.firstName = firstName;
            this.lastName = lastName;
            this.email = email;
            this.phone = phone;
            this.passwordHash = passwordHash;
            this.otp = otp;
            this.expiresAt = expiresAt;
            this.sentAt = sentAt;
        }
    }

    @Override
    public void requestRegisterOtp(RegisterRequest request) {
        String normalizedEmail = request.getEmail().toLowerCase().trim();

        if (!rateLimiterService.tryAcquire("register-otp:" + normalizedEmail, 5, Duration.ofMinutes(1))) {
            throw new RateLimitExceededException("Too many verification codes were requested. Please try again later.");
        }

        if (request.getConfirmPassword() != null && !request.getPassword().equals(request.getConfirmPassword())) {
            throw new BusinessRuleException("Passwords do not match");
        }

        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            throw new DuplicateResourceException("An account with this email address already exists.");
        }

        String phone = request.getPhone() != null && !request.getPhone().isBlank() ? request.getPhone().trim() : null;
        if (phone != null && userRepository.findByPhone(phone).isPresent()) {
            throw new DuplicateResourceException("An account with this phone number already exists.");
        }

        PendingRegistration existing = pendingRegistrations.get(normalizedEmail);
        Instant now = Instant.now();
        if (existing != null && now.isBefore(existing.sentAt.plus(REGISTER_OTP_COOLDOWN))) {
            long remaining = Duration.between(now, existing.sentAt.plus(REGISTER_OTP_COOLDOWN)).toSeconds();
            throw new BusinessRuleException("Please wait " + Math.max(1, remaining) + " seconds before requesting a new code.");
        }

        String otp = String.valueOf(100000 + secureRandom.nextInt(900000));
        PendingRegistration pending = new PendingRegistration(
                request.getFirstName().trim(),
                request.getLastName().trim(),
                normalizedEmail,
                phone,
                passwordEncoder.encode(request.getPassword()),
                otp,
                now.plus(REGISTER_OTP_TTL),
                now
        );
        pendingRegistrations.put(normalizedEmail, pending);

        if (!sendRegisterOtpEmail(normalizedEmail, otp)) {
            pendingRegistrations.remove(normalizedEmail);
            throw new BusinessRuleException("The verification code could not be emailed to " + normalizedEmail + ". Check the address and try again.");
        }

        log.info("Emailed registration verification code to {}", maskEmail(normalizedEmail));
    }

    @Override
    public void resendRegisterOtp(ForgotPasswordRequest request) {
        String normalizedEmail = request.getEmail().toLowerCase().trim();
        PendingRegistration pending = pendingRegistrations.get(normalizedEmail);
        if (pending == null || Instant.now().isAfter(pending.expiresAt)) {
            pendingRegistrations.remove(normalizedEmail);
            throw new BusinessRuleException("Start account creation again before requesting a new code.");
        }

        Instant now = Instant.now();
        if (now.isBefore(pending.sentAt.plus(REGISTER_OTP_COOLDOWN))) {
            long remaining = Duration.between(now, pending.sentAt.plus(REGISTER_OTP_COOLDOWN)).toSeconds();
            throw new BusinessRuleException("Please wait " + Math.max(1, remaining) + " seconds before requesting a new code.");
        }

        String otp = String.valueOf(100000 + secureRandom.nextInt(900000));
        pending.otp = otp;
        pending.sentAt = now;
        pending.expiresAt = now.plus(REGISTER_OTP_TTL);
        pending.attempts = 0;

        if (!sendRegisterOtpEmail(normalizedEmail, otp)) {
            throw new BusinessRuleException("The verification code could not be emailed to " + normalizedEmail + ". Try again.");
        }
    }

    @Override
    @Transactional
    public AuthResponse verifyRegisterOtp(VerifyOtpRequest request) {
        String normalizedEmail = request.getEmail().toLowerCase().trim();

        if (!rateLimiterService.tryAcquire("register-verify:" + normalizedEmail, 10, Duration.ofMinutes(1))) {
            throw new RateLimitExceededException("Too many verification attempts. Please try again later.");
        }

        PendingRegistration pending = pendingRegistrations.get(normalizedEmail);
        if (pending == null) {
            throw new BusinessRuleException("Request a verification code before creating this account.");
        }
        if (Instant.now().isAfter(pending.expiresAt)) {
            pendingRegistrations.remove(normalizedEmail);
            throw new BusinessRuleException("The verification code expired. Go back and request a new code.");
        }

        pending.attempts++;
        if (pending.attempts > REGISTER_OTP_MAX_ATTEMPTS) {
            pendingRegistrations.remove(normalizedEmail);
            throw new BusinessRuleException("Too many incorrect codes. Go back and request a new code.");
        }
        if (!pending.otp.equals(request.getOtp().trim())) {
            throw new BusinessRuleException("That code does not match the one emailed to you. The account was not created.");
        }

        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            pendingRegistrations.remove(normalizedEmail);
            throw new DuplicateResourceException("An account with this email address already exists.");
        }

        RegisterRequest completed = RegisterRequest.builder()
                .firstName(pending.firstName)
                .lastName(pending.lastName)
                .email(pending.email)
                .phone(pending.phone)
                .password(pending.passwordHash)
                .confirmPassword(pending.passwordHash)
                .build();

        AuthResponse response = createVerifiedUser(completed, pending.passwordHash);
        pendingRegistrations.remove(normalizedEmail);
        return response;
    }

    private boolean sendRegisterOtpEmail(String email, String otp) {
        String subject = "Your PawConnect verification code";
        String body = emailTemplateService.buildOtpEmail(
                null,
                otp,
                "Email Verification",
                "Thank you for joining PawConnect! Use this verification code to finish creating your account. The account is created only after you enter this code.",
                5
        );
        return emailService.sendEmail(email, subject, body);
    }

    @Transactional
    protected AuthResponse createVerifiedUser(RegisterRequest request, String passwordHash) {
        String normalizedEmail = request.getEmail().toLowerCase().trim();

        // Public registration strictly defaults to PET_OWNER role only. Arbitrary client roles are prohibited.
        Role petOwnerRole = roleRepository.findByRoleCode("PET_OWNER")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .roleCode("PET_OWNER")
                        .roleName("Pet Owner")
                        .description("Default customer and pet owner role")
                        .build()));

        User user = User.builder()
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .email(normalizedEmail)
                .phone(request.getPhone() != null && !request.getPhone().isBlank() ? request.getPhone().trim() : null)
                .passwordHash(passwordHash)
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .phoneVerified(false)
                .tokenVersion(1)
                .build();

        User savedUser = userRepository.save(user);

        UserRole userRole = UserRole.builder()
                .user(savedUser)
                .role(petOwnerRole)
                .build();

        userRoleRepository.save(userRole);

        List<String> roles = List.of("PET_OWNER");
        String accessToken = jwtService.generateAccessToken(savedUser, roles);
        String refreshToken = jwtService.generateRefreshToken(savedUser);

        UserResponse userResponse = userMapper.toUserResponse(savedUser, roles);

        log.info("Successfully registered new user: {}", maskEmail(normalizedEmail));

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtService.getJwtExpiration())
                .user(userResponse)
                .build();
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.getEmail().toLowerCase().trim();

        if (!rateLimiterService.tryAcquire("login:" + normalizedEmail, 10, Duration.ofMinutes(1))) {
            throw new RateLimitExceededException("Too many login attempts. Please try again later.");
        }

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (user.getStatus() == UserStatus.BLOCKED) {
            throw new UnauthorizedException("Account is blocked. Please contact support.");
        }

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new UnauthorizedException("Account is inactive.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        List<UserRole> userRoles = userRoleRepository.findByUserIdWithRole(user.getId());
        List<String> roles = userRoles.stream()
                .filter(ur -> ur.getRole() != null)
                .map(ur -> ur.getRole().getRoleCode())
                .collect(Collectors.toList());

        String accessToken = jwtService.generateAccessToken(user, roles);
        String refreshToken = jwtService.generateRefreshToken(user);

        UserResponse userResponse = userMapper.toUserResponse(user, roles);

        log.info("User logged in successfully: {}", maskEmail(normalizedEmail));

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtService.getJwtExpiration())
                .user(userResponse)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse refresh(RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();

        if (!rateLimiterService.tryAcquire("refresh:" + (refreshToken.length() > 10 ? refreshToken.substring(0, 10) : "unknown"), 20, Duration.ofMinutes(1))) {
            throw new RateLimitExceededException("Too many refresh requests. Please try again later.");
        }

        String username;
        try {
            username = jwtService.extractUsername(refreshToken);
        } catch (Exception e) {
            throw new UnauthorizedException("Invalid refresh token");
        }

        if (username == null) {
            throw new UnauthorizedException("Invalid refresh token claims");
        }

        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new UnauthorizedException("Account is not active");
        }

        if (!jwtService.isRefreshTokenValid(refreshToken, user.getEmail(), user.getTokenVersion())) {
            throw new UnauthorizedException("Refresh token is expired or has been revoked");
        }

        List<UserRole> userRoles = userRoleRepository.findByUserIdWithRole(user.getId());
        List<String> roles = userRoles.stream()
                .filter(ur -> ur.getRole() != null)
                .map(ur -> ur.getRole().getRoleCode())
                .collect(Collectors.toList());

        String newAccessToken = jwtService.generateAccessToken(user, roles);
        String newRefreshToken = jwtService.generateRefreshToken(user);

        UserResponse userResponse = userMapper.toUserResponse(user, roles);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtService.getJwtExpiration())
                .user(userResponse)
                .build();
    }

    @Override
    @Transactional
    public void logout(RefreshTokenRequest request) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !(auth instanceof org.springframework.security.authentication.AnonymousAuthenticationToken)) {
            String email = auth.getName();
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isPresent()) {
                User currentUser = userOpt.get();
                currentUser.setTokenVersion(currentUser.getTokenVersion() + 1);
                userRepository.save(currentUser);
                log.info("Logged out authenticated user: {}", maskEmail(currentUser.getEmail()));
                return;
            }
        }

        if (request != null && request.getRefreshToken() != null && !request.getRefreshToken().isBlank()) {
            try {
                String username = jwtService.extractUsername(request.getRefreshToken());
                if (username != null) {
                    Optional<User> userOpt = userRepository.findByEmail(username);
                    if (userOpt.isPresent()) {
                        User user = userOpt.get();
                        user.setTokenVersion(user.getTokenVersion() + 1);
                        userRepository.save(user);
                        log.info("Logged out user via refresh token: {}", maskEmail(user.getEmail()));
                    }
                }
            } catch (Exception ignored) {
                // Ignore parsing errors on logout to remain idempotent
            }
        }
    }

    @Override
    public void forgotPassword(ForgotPasswordRequest request) {
        String normalizedEmail = request.getEmail().toLowerCase().trim();

        if (!rateLimiterService.tryAcquire("forgot-password:" + normalizedEmail, 5, Duration.ofMinutes(1))) {
            throw new RateLimitExceededException("Too many password reset requests. Please try again later.");
        }

        // Generic response to avoid revealing user existence
        Optional<User> userOpt = userRepository.findByEmail(normalizedEmail);
        if (userOpt.isEmpty() || userOpt.get().getStatus() != UserStatus.ACTIVE) {
            log.info("Forgot password requested for non-existent or inactive email: {}", maskEmail(normalizedEmail));
            return;
        }

        String otp = otpService.generateOtp(normalizedEmail);
        String subject = "Your PawConnect password reset code";
        String body = emailTemplateService.buildOtpEmail(
                null,
                otp,
                "Password Reset",
                "Use this verification code to reset your PawConnect password. The new password is saved only after this code is verified.",
                5
        );
        if (!emailService.sendEmail(normalizedEmail, subject, body)) {
            otpService.clearOtp(normalizedEmail);
            throw new BusinessRuleException(
                    "The verification code could not be emailed to " + normalizedEmail + ". Check the address and try again."
            );
        }
        log.info("Emailed password reset code to {}", maskEmail(normalizedEmail));
    }

    @Override
    public String verifyOtp(VerifyOtpRequest request) {
        String normalizedEmail = request.getEmail().toLowerCase().trim();

        if (!rateLimiterService.tryAcquire("verify-otp:" + normalizedEmail, 10, Duration.ofMinutes(1))) {
            throw new RateLimitExceededException("Too many OTP verification attempts. Please try again later.");
        }

        boolean isValid = otpService.verifyOtp(normalizedEmail, request.getOtp());
        if (!isValid) {
            throw new BusinessRuleException("Invalid or expired OTP code.");
        }

        return otpService.createResetToken(normalizedEmail);
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String normalizedEmail = request.getEmail().toLowerCase().trim();

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BusinessRuleException("Passwords do not match");
        }

        boolean authorized = false;
        if (request.getResetToken() != null && !request.getResetToken().isBlank()) {
            authorized = otpService.validateResetToken(normalizedEmail, request.getResetToken());
        } else if (request.getOtp() != null && !request.getOtp().isBlank()) {
            authorized = otpService.verifyOtp(normalizedEmail, request.getOtp());
        }

        if (!authorized) {
            throw new BusinessRuleException("Password reset authorization failed. Please verify your OTP again.");
        }

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User account not found"));

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        // Invalidate all previously issued access tokens and refresh tokens
        user.setTokenVersion(user.getTokenVersion() + 1);
        userRepository.save(user);

        otpService.clearOtp(normalizedEmail);
        log.info("Password successfully reset for account: {}", maskEmail(normalizedEmail));
    }

    private String maskEmail(String email) {
        int atIndex = email.indexOf('@');
        if (atIndex <= 2) {
            return "***" + email.substring(atIndex);
        }
        return email.substring(0, 2) + "***" + email.substring(atIndex);
    }
}
