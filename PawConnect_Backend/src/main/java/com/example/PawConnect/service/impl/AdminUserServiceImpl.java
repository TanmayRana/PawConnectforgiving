package com.example.PawConnect.service.impl;

import com.example.PawConnect.dto.request.admin.CreateUserRequest;
import com.example.PawConnect.dto.request.admin.IssueUserPasswordRequest;
import com.example.PawConnect.dto.request.admin.UpdateUserRequest;
import com.example.PawConnect.dto.request.admin.UpdateUserStatusRequest;
import com.example.PawConnect.dto.request.admin.VerifyUserPasswordRequest;
import com.example.PawConnect.dto.response.IssuedUserPasswordResponse;
import com.example.PawConnect.dto.response.UserResponse;
import com.example.PawConnect.exception.BusinessRuleException;
import com.example.PawConnect.exception.DuplicateResourceException;
import com.example.PawConnect.exception.ResourceNotFoundException;
import com.example.PawConnect.mapper.UserMapper;
import com.example.PawConnect.model.PendingUserPassword;
import com.example.PawConnect.model.Role;
import com.example.PawConnect.model.User;
import com.example.PawConnect.model.UserRole;
import com.example.PawConnect.model.UserStatus;
import com.example.PawConnect.repository.PendingUserPasswordRepository;
import com.example.PawConnect.repository.RoleRepository;
import com.example.PawConnect.repository.UserRepository;
import com.example.PawConnect.repository.UserRoleRepository;
import com.example.PawConnect.response.PageResponse;
import com.example.PawConnect.service.AdminUserService;
import com.example.PawConnect.service.AuditLogService;
import com.example.PawConnect.service.EmailService;
import com.example.PawConnect.service.EmailTemplateService;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminUserServiceImpl implements AdminUserService {

    private final UserRepository userRepository;
    private final PendingUserPasswordRepository pendingUserPasswordRepository;
    private final UserRoleRepository userRoleRepository;
    private final RoleRepository roleRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;
    private final EmailService emailService;
    private final EmailTemplateService emailTemplateService;

    private static final Set<String> ALLOWED_ROLES = Set.of(
            "PET_OWNER", "VETERINARIAN", "SERVICE_PROVIDER", "ADMIN"
    );

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "id", "firstName", "lastName", "email", "createdAt", "status"
    );
    private static final int MAX_PAGE_SIZE = 100;
    private static final int PASSWORD_TTL_MINUTES = 15;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<UserResponse> getUsers(
            String search,
            String role,
            UserStatus status,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable
    ) {
        Pageable sanitized = sanitizePageable(pageable);

        Specification<User> spec = (root, query, cb) -> {
            query.distinct(true);
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("firstName")), pattern),
                        cb.like(cb.lower(root.get("lastName")), pattern),
                        cb.like(cb.lower(root.get("email")), pattern),
                        cb.like(cb.lower(root.get("phone")), pattern)
                ));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (role != null && !role.isBlank()) {
                Join<User, UserRole> userRoleJoin = root.join("userRoles", JoinType.INNER);
                Join<UserRole, Role> roleJoin = userRoleJoin.join("role", JoinType.INNER);
                predicates.add(cb.equal(cb.upper(roleJoin.get("roleCode")), role.trim().toUpperCase()));
            }

            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate.atStartOfDay()));
            }

            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate.atTime(LocalTime.MAX)));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<User> users = userRepository.findAll(spec, sanitized);
        return PageResponse.from(users.map(this::mapUserWithRoles));
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        return mapUserWithRoles(user);
    }

    @Override
    @Transactional
    public UserResponse updateUserStatus(Long userId, UpdateUserStatusRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        UserStatus oldStatus = user.getStatus();
        UserStatus newStatus = request.getStatus();

        if (oldStatus == newStatus) {
            return mapUserWithRoles(user);
        }

        // Last Active Admin Protection
        if (newStatus != UserStatus.ACTIVE && hasAdminRole(userId)) {
            long activeAdminCount = userRoleRepository.countActiveByRoleCode("ADMIN", UserStatus.ACTIVE);
            if (activeAdminCount <= 1) {
                throw new BusinessRuleException("Cannot deactivate or block the last active administrator.");
            }
        }

        user.setStatus(newStatus);
        User savedUser = userRepository.save(user);

        // Audit log
        String oldSnapshot = "{\"userId\":" + userId + ",\"status\":\"" + oldStatus + "\"}";
        String newSnapshot = "{\"userId\":" + userId + ",\"status\":\"" + newStatus + "\",\"reason\":\"" + (request.getReason() != null ? request.getReason() : "") + "\"}";
        auditLogService.logAction(
                "USER_STATUS_UPDATED",
                "USER_MANAGEMENT",
                "USER",
                userId,
                oldSnapshot,
                newSnapshot
        );

        log.info("Admin updated user {} status from {} to {}", userId, oldStatus, newStatus);
        return mapUserWithRoles(savedUser);
    }

    @Override
    @Transactional
    public IssuedUserPasswordResponse issueUserPassword(IssueUserPasswordRequest request) {
        String email = normalizeEmail(request.getEmail());
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("User already exists with email: " + email);
        }

        String rawPassword = generateSecurePassword();
        PendingUserPassword pending = pendingUserPasswordRepository.findByEmail(email)
                .orElseGet(() -> PendingUserPassword.builder().email(email).build());
        pending.setPasswordHash(passwordEncoder.encode(rawPassword));
        pending.setCreatedAt(LocalDateTime.now());
        pending.setExpiresAt(LocalDateTime.now().plusMinutes(PASSWORD_TTL_MINUTES));
        pendingUserPasswordRepository.save(pending);

        String subject = "Your PawConnect account password";
        String body = emailTemplateService.buildTemporaryPasswordEmail(
                email,
                rawPassword,
                PASSWORD_TTL_MINUTES
        );

        boolean sent = emailService.sendEmail(email, subject, body);
        if (!sent) {
            throw new BusinessRuleException(
                    "The password email could not be sent to " + email + ". Check the address and try again."
            );
        }

        log.info("Emailed a generated account password to {}", email);
        return IssuedUserPasswordResponse.builder()
                .email(email)
                .expiresInMinutes(PASSWORD_TTL_MINUTES)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public void verifyIssuedPassword(VerifyUserPasswordRequest request) {
        matchIssuedPassword(normalizeEmail(request.getEmail()), request.getPassword());
    }

    @Override
    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        String email = normalizeEmail(request.getEmail());
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("User already exists with email: " + email);
        }

        if (request.getPhone() != null && !request.getPhone().isBlank() && userRepository.existsByPhone(request.getPhone().trim())) {
            throw new DuplicateResourceException("User already exists with phone: " + request.getPhone());
        }

        List<String> roleCodes = request.getRoleCodes() != null && !request.getRoleCodes().isEmpty()
                ? request.getRoleCodes()
                : List.of("PET_OWNER");

        validateRoles(roleCodes);

        String rawPassword;
        java.util.Optional<PendingUserPassword> pendingOpt = pendingUserPasswordRepository.findByEmail(email);

        if (request.getPassword() != null && !request.getPassword().trim().isBlank()) {
            if (pendingOpt.isPresent()) {
                rawPassword = matchIssuedPassword(email, request.getPassword());
            } else {
                rawPassword = request.getPassword().trim();
            }
        } else {
            rawPassword = generateSecurePassword();
        }

        User user = User.builder()
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .email(email)
                .phone(request.getPhone() != null ? request.getPhone().trim() : null)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .status(request.getStatus() != null ? request.getStatus() : UserStatus.ACTIVE)
                .profileImage(request.getProfileImage() != null && !request.getProfileImage().isBlank() ? request.getProfileImage().trim() : null)
                .emailVerified(true)
                .phoneVerified(false)
                .build();

        User savedUser = userRepository.save(user);

        // Assign roles
        List<UserRole> userRoles = new ArrayList<>();
        for (String rc : roleCodes) {
            Role role = roleRepository.findByRoleCode(rc.toUpperCase())
                    .orElseThrow(() -> new ResourceNotFoundException("Role not found with code: " + rc));
            UserRole userRole = UserRole.builder()
                    .user(savedUser)
                    .role(role)
                    .build();
            userRoles.add(userRoleRepository.save(userRole));
        }
        savedUser.setUserRoles(userRoles);
        pendingUserPasswordRepository.findByEmail(email).ifPresent(pendingUserPasswordRepository::delete);

        // Audit log
        String newSnapshot = "{\"userId\":" + savedUser.getId() + ",\"email\":\"" + savedUser.getEmail() + "\",\"roles\":" + roleCodes + "}";
        auditLogService.logAction(
                "USER_CREATED",
                "USER_MANAGEMENT",
                "USER",
                savedUser.getId(),
                null,
                newSnapshot
        );

        // Automatically dispatch credentials email with the generated/set password
        try {
            String subject = "Your PawConnect account password";
            String body = emailTemplateService.buildTemporaryPasswordEmail(
                    email,
                    rawPassword,
                    PASSWORD_TTL_MINUTES
            );
            emailService.sendEmail(email, subject, body);
            log.info("Automatically dispatched credentials email to newly created user {}", email);
        } catch (Exception ex) {
            log.warn("Failed to dispatch credentials email to {}: {}", email, ex.getMessage());
        }

        log.info("Admin created new user {} with roles {}", savedUser.getEmail(), roleCodes);
        return mapUserWithRoles(savedUser);
    }

    private String matchIssuedPassword(String email, String password) {
        PendingUserPassword pending = pendingUserPasswordRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessRuleException(
                        "Generate a password for this email, then paste the password from the inbox."
                ));

        if (pending.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessRuleException("The emailed password expired. Generate a new password and try again.");
        }

        String rawPassword = password == null ? "" : password.trim();
        if (!passwordEncoder.matches(rawPassword, pending.getPasswordHash())) {
            throw new BusinessRuleException("That password does not match the one emailed to this address.");
        }
        return rawPassword;
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    private String generateSecurePassword() {
        String upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        String lower = "abcdefghijkmnopqrstuvwxyz";
        String digits = "23456789";
        String symbols = "@$!%*?&";
        String allChars = upper + lower + digits + symbols;
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder();
        sb.append(upper.charAt(random.nextInt(upper.length())));
        sb.append(lower.charAt(random.nextInt(lower.length())));
        sb.append(digits.charAt(random.nextInt(digits.length())));
        sb.append(symbols.charAt(random.nextInt(symbols.length())));
        for (int i = 4; i < 12; i++) {
            sb.append(allChars.charAt(random.nextInt(allChars.length())));
        }
        return sb.toString();
    }

    @Override
    @Transactional
    public UserResponse updateUser(Long userId, UpdateUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmailAndIdNot(email, userId)) {
            throw new DuplicateResourceException("Email already in use by another user: " + email);
        }

        if (request.getPhone() != null && !request.getPhone().isBlank()
                && userRepository.existsByPhoneAndIdNot(request.getPhone().trim(), userId)) {
            throw new DuplicateResourceException("Phone number already in use by another user: " + request.getPhone());
        }

        // Roles update validation & last admin protection
        if (request.getRoleCodes() != null) {
            validateRoles(request.getRoleCodes());
            boolean currentIsAdmin = hasAdminRole(userId);
            boolean willBeAdmin = request.getRoleCodes().stream().anyMatch(r -> r.equalsIgnoreCase("ADMIN"));

            if (currentIsAdmin && !willBeAdmin) {
                long activeAdminCount = userRoleRepository.countActiveByRoleCode("ADMIN", UserStatus.ACTIVE);
                if (activeAdminCount <= 1) {
                    throw new BusinessRuleException("Cannot remove ADMIN role from the last active administrator.");
                }
            }

            // Update user roles
            Set<String> targetRoleCodes = request.getRoleCodes().stream()
                    .filter(rc -> rc != null && !rc.isBlank())
                    .map(String::trim)
                    .map(String::toUpperCase)
                    .collect(Collectors.toSet());

            List<UserRole> currentRoles = user.getUserRoles();
            if (currentRoles == null) {
                currentRoles = new ArrayList<>();
                user.setUserRoles(currentRoles);
            }

            // Remove roles no longer assigned (orphanRemoval=true automatically removes them)
            currentRoles.removeIf(ur -> ur.getRole() == null || !targetRoleCodes.contains(ur.getRole().getRoleCode().toUpperCase()));

            // Find role codes already assigned and kept
            Set<String> existingRoleCodes = currentRoles.stream()
                    .filter(ur -> ur.getRole() != null)
                    .map(ur -> ur.getRole().getRoleCode().toUpperCase())
                    .collect(Collectors.toSet());

            // Add only new roles
            for (String rc : targetRoleCodes) {
                if (!existingRoleCodes.contains(rc)) {
                    Role role = roleRepository.findByRoleCode(rc)
                            .orElseThrow(() -> new ResourceNotFoundException("Role not found with code: " + rc));
                    currentRoles.add(UserRole.builder()
                            .user(user)
                            .role(role)
                            .build());
                }
            }
        }

        if (request.getStatus() != null && request.getStatus() != user.getStatus()) {
            if (request.getStatus() != UserStatus.ACTIVE && hasAdminRole(userId)) {
                long activeAdminCount = userRoleRepository.countActiveByRoleCode("ADMIN", UserStatus.ACTIVE);
                if (activeAdminCount <= 1) {
                    throw new BusinessRuleException("Cannot deactivate or block the last active administrator.");
                }
            }
            user.setStatus(request.getStatus());
        }

        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());
        user.setEmail(email);
        user.setPhone(request.getPhone() != null ? request.getPhone().trim() : null);
        if (request.getProfileImage() != null) {
            user.setProfileImage(request.getProfileImage().trim().isEmpty() ? null : request.getProfileImage().trim());
        }

        User savedUser = userRepository.saveAndFlush(user);

        // Audit log
        String newSnapshot = "{\"userId\":" + userId + ",\"email\":\"" + savedUser.getEmail() + "\"}";
        auditLogService.logAction(
                "USER_UPDATED",
                "USER_MANAGEMENT",
                "USER",
                userId,
                null,
                newSnapshot
        );

        return mapUserWithRoles(savedUser);
    }

    private boolean hasAdminRole(Long userId) {
        List<UserRole> roles = userRoleRepository.findByUserIdWithRole(userId);
        return roles.stream().anyMatch(ur -> ur.getRole() != null && "ADMIN".equalsIgnoreCase(ur.getRole().getRoleCode()));
    }

    private void validateRoles(List<String> roleCodes) {
        for (String rc : roleCodes) {
            if (!ALLOWED_ROLES.contains(rc.toUpperCase())) {
                throw new BusinessRuleException("Unsupported role: " + rc + ". Allowed roles: " + ALLOWED_ROLES);
            }
        }
    }

    private UserResponse mapUserWithRoles(User user) {
        List<UserRole> userRoles = userRoleRepository.findByUserIdWithRole(user.getId());
        List<String> roleCodes = userRoles.stream()
                .filter(ur -> ur.getRole() != null)
                .map(ur -> ur.getRole().getRoleCode())
                .collect(Collectors.toList());
        return userMapper.toUserResponse(user, roleCodes);
    }

    private Pageable sanitizePageable(Pageable pageable) {
        int page = Math.max(0, pageable.getPageNumber());
        int size = Math.min(MAX_PAGE_SIZE, Math.max(1, pageable.getPageSize()));

        List<Sort.Order> validOrders = new ArrayList<>();
        for (Sort.Order order : pageable.getSort()) {
            if (!ALLOWED_SORT_FIELDS.contains(order.getProperty())) {
                throw new IllegalArgumentException(String.format(
                        "Invalid sort field '%s'. Allowed sort fields are: %s",
                        order.getProperty(), ALLOWED_SORT_FIELDS
                ));
            }
            validOrders.add(order);
        }

        Sort sort = validOrders.isEmpty()
                ? Sort.by(Sort.Direction.DESC, "createdAt")
                : Sort.by(validOrders);

        return PageRequest.of(page, size, sort);
    }
}
