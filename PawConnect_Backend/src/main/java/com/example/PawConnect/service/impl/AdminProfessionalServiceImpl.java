package com.example.PawConnect.service.impl;

import com.example.PawConnect.dto.request.admin.UpdateEntityStatusRequest;
import com.example.PawConnect.dto.request.admin.VerificationRequest;
import com.example.PawConnect.dto.response.admin.AdminServiceProviderResponse;
import com.example.PawConnect.dto.response.admin.AdminVeterinarianResponse;
import com.example.PawConnect.exception.ResourceNotFoundException;
import com.example.PawConnect.model.*;
import com.example.PawConnect.repository.ServiceProviderRepository;
import com.example.PawConnect.repository.VeterinarianRepository;
import com.example.PawConnect.response.PageResponse;
import com.example.PawConnect.service.AdminProfessionalService;
import com.example.PawConnect.service.AuditLogService;
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
import org.springframework.stereotype.Service;
import com.example.PawConnect.dto.request.admin.AdminCreateServiceProviderRequest;
import com.example.PawConnect.dto.request.admin.AdminCreateVeterinarianRequest;
import com.example.PawConnect.dto.request.admin.IssueUserPasswordRequest;
import com.example.PawConnect.dto.request.auth.VerifyOtpRequest;
import com.example.PawConnect.exception.BusinessRuleException;
import com.example.PawConnect.exception.DuplicateResourceException;
import com.example.PawConnect.service.EmailService;
import com.example.PawConnect.service.EmailTemplateService;
import com.example.PawConnect.repository.RoleRepository;
import com.example.PawConnect.repository.UserRepository;
import com.example.PawConnect.repository.UserRoleRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminProfessionalServiceImpl implements AdminProfessionalService {

    private final VeterinarianRepository veterinarianRepository;
    private final ServiceProviderRepository serviceProviderRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;
    private final EmailService emailService;
    private final EmailTemplateService emailTemplateService;
    private final SecureRandom secureRandom = new SecureRandom();
    private final ConcurrentHashMap<String, VetEmailOtp> veterinarianEmailOtps = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, VetEmailOtp> providerEmailOtps = new ConcurrentHashMap<>();

    private static final Duration VET_OTP_TTL = Duration.ofMinutes(5);
    private static final Duration VET_OTP_COOLDOWN = Duration.ofSeconds(60);
    private static final int VET_OTP_MAX_ATTEMPTS = 3;

    private static final class VetEmailOtp {
        private String otp;
        private Instant expiresAt;
        private Instant sentAt;
        private int attempts;
        private boolean verified;

        private VetEmailOtp(String otp, Instant expiresAt, Instant sentAt) {
            this.otp = otp;
            this.expiresAt = expiresAt;
            this.sentAt = sentAt;
        }
    }

    private static final Set<String> ALLOWED_VET_SORT_FIELDS = Set.of(
            "id", "createdAt", "experienceYears", "consultationFee", "verificationStatus", "isActive",
            "specialization", "qualification", "licenseNumber", "clinicName", "clinicAddress", "updatedAt"
    );

    private static final Set<String> ALLOWED_PROVIDER_SORT_FIELDS = Set.of(
            "id", "createdAt", "businessName", "experienceYears", "verificationStatus", "isActive",
            "providerType", "phone", "address", "updatedAt"
    );

    private static final int MAX_PAGE_SIZE = 100;

    @Override
    public void requestVeterinarianEmailOtp(IssueUserPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("User already exists with email: " + email);
        }

        Instant now = Instant.now();
        VetEmailOtp existing = veterinarianEmailOtps.get(email);
        if (existing != null && now.isBefore(existing.sentAt.plus(VET_OTP_COOLDOWN))) {
            long remaining = Duration.between(now, existing.sentAt.plus(VET_OTP_COOLDOWN)).toSeconds();
            throw new BusinessRuleException("Please wait " + Math.max(1, remaining) + " seconds before requesting a new code.");
        }

        String otp = String.valueOf(100000 + secureRandom.nextInt(900000));
        veterinarianEmailOtps.put(email, new VetEmailOtp(otp, now.plus(VET_OTP_TTL), now));

        String body = emailTemplateService.buildOtpEmail(
                null,
                otp,
                "Veterinarian Verification",
                "Use this code to verify the veterinarian email. The veterinarian account is created only after this code is entered.",
                5
        );
        if (!emailService.sendEmail(email, "Verify veterinarian email", body)) {
            veterinarianEmailOtps.remove(email);
            throw new BusinessRuleException("The verification code could not be emailed to " + email + ". Check the address and try again.");
        }
        log.info("Emailed veterinarian verification code to {}", email);
    }

    @Override
    public void verifyVeterinarianEmailOtp(VerifyOtpRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        VetEmailOtp pending = veterinarianEmailOtps.get(email);
        if (pending == null) {
            throw new BusinessRuleException("Send a verification code to this email before continuing.");
        }
        if (Instant.now().isAfter(pending.expiresAt)) {
            veterinarianEmailOtps.remove(email);
            throw new BusinessRuleException("The verification code expired. Send a new code.");
        }

        pending.attempts++;
        if (pending.attempts > VET_OTP_MAX_ATTEMPTS) {
            veterinarianEmailOtps.remove(email);
            throw new BusinessRuleException("Too many incorrect codes. Send a new code.");
        }
        if (!pending.otp.equals(request.getOtp().trim())) {
            throw new BusinessRuleException("That code does not match the one emailed to this address.");
        }

        pending.verified = true;
        pending.expiresAt = Instant.now().plus(Duration.ofMinutes(15));
        log.info("Verified veterinarian email {}", email);
    }

    @Override
    @Transactional
    public AdminVeterinarianResponse createVeterinarian(AdminCreateVeterinarianRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("User already exists with email: " + request.getEmail());
        }

        if (request.getPhone() != null && !request.getPhone().isBlank() && userRepository.existsByPhone(request.getPhone().trim())) {
            throw new DuplicateResourceException("User already exists with phone: " + request.getPhone());
        }

        if (veterinarianRepository.existsByLicenseNumber(request.getLicenseNumber().trim())) {
            throw new DuplicateResourceException("Veterinarian already exists with license number: " + request.getLicenseNumber());
        }

        // OTP verification is optional and no longer mandatory for admin registration
        veterinarianEmailOtps.remove(email);

        String rawPassword = (request.getPassword() != null && !request.getPassword().isBlank())
                ? request.getPassword()
                : UUID.randomUUID().toString().substring(0, 10) + "Aa1!";

        User user = User.builder()
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .email(email)
                .phone(request.getPhone() != null && !request.getPhone().isBlank() ? request.getPhone().trim() : null)
                .profileImage(request.getProfileImage() != null && !request.getProfileImage().isBlank() ? request.getProfileImage().trim() : null)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .phoneVerified(false)
                .build();

        User savedUser = userRepository.save(user);

        Role vetRole = roleRepository.findByRoleCode("VETERINARIAN")
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with code: VETERINARIAN"));

        UserRole userRole = UserRole.builder()
                .user(savedUser)
                .role(vetRole)
                .build();
        userRoleRepository.save(userRole);
        savedUser.setUserRoles(List.of(userRole));

        Veterinarian vet = Veterinarian.builder()
                .user(savedUser)
                .specialization(request.getSpecialization().trim())
                .qualification(request.getQualification().trim())
                .licenseNumber(request.getLicenseNumber().trim())
                .experienceYears(request.getExperienceYears() != null ? request.getExperienceYears() : 0)
                .clinicName(request.getClinicName() != null ? request.getClinicName().trim() : null)
                .clinicAddress(request.getClinicAddress() != null ? request.getClinicAddress().trim() : null)
                .clinicLatitude(request.getClinicLatitude())
                .clinicLongitude(request.getClinicLongitude())
                .consultationFee(request.getConsultationFee())
                .bio(request.getBio() != null ? request.getBio().trim() : null)
                .verificationStatus(VeterinarianVerificationStatus.APPROVED)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        Veterinarian savedVet = veterinarianRepository.save(vet);
        veterinarianEmailOtps.remove(email);

        String newSnapshot = "{\"vetId\":" + savedVet.getId() + ",\"email\":\"" + savedUser.getEmail() + "\",\"licenseNumber\":\"" + savedVet.getLicenseNumber() + "\"}";
        auditLogService.logAction(
                "VETERINARIAN_CREATED",
                "PROFESSIONALS",
                "VETERINARIAN",
                savedVet.getId(),
                null,
                newSnapshot
        );

        try {
            String subject = "Your PawConnect account password";
            String body = emailTemplateService.buildTemporaryPasswordEmail(
                    email,
                    rawPassword,
                    60
            );
            emailService.sendEmail(email, subject, body);
            log.info("Automatically dispatched credentials email to newly registered veterinarian {}", email);
        } catch (Exception ex) {
            log.warn("Failed to dispatch credentials email to {}: {}", email, ex.getMessage());
        }

        log.info("Admin registered new veterinarian {} with license {}", savedUser.getEmail(), savedVet.getLicenseNumber());
        return mapVetResponse(savedVet);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminVeterinarianResponse> getVeterinarians(
            VeterinarianVerificationStatus verificationStatus,
            Boolean isActive,
            String search,
            Pageable pageable
    ) {
        Pageable sanitized = sanitizePageable(pageable, ALLOWED_VET_SORT_FIELDS);

        Specification<Veterinarian> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (verificationStatus != null) {
                predicates.add(cb.equal(root.get("verificationStatus"), verificationStatus));
            }
            if (isActive != null) {
                predicates.add(cb.equal(root.get("isActive"), isActive));
            }
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Join<Veterinarian, User> userJoin = root.join("user", JoinType.LEFT);
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("licenseNumber")), pattern),
                        cb.like(cb.lower(root.get("clinicName")), pattern),
                        cb.like(cb.lower(root.get("specialization")), pattern),
                        cb.like(cb.lower(userJoin.get("firstName")), pattern),
                        cb.like(cb.lower(userJoin.get("lastName")), pattern),
                        cb.like(cb.lower(userJoin.get("email")), pattern)
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Veterinarian> page = veterinarianRepository.findAll(spec, sanitized);
        return PageResponse.from(page.map(this::mapVetResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public AdminVeterinarianResponse getVeterinarianById(Long veterinarianId) {
        Veterinarian vet = veterinarianRepository.findById(veterinarianId)
                .orElseThrow(() -> new ResourceNotFoundException("Veterinarian not found with id: " + veterinarianId));
        return mapVetResponse(vet);
    }

    @Override
    @Transactional
    public AdminVeterinarianResponse updateVeterinarianVerification(Long veterinarianId, VerificationRequest request) {
        Veterinarian vet = veterinarianRepository.findByIdForUpdate(veterinarianId)
                .orElseThrow(() -> new ResourceNotFoundException("Veterinarian not found with id: " + veterinarianId));

        VeterinarianVerificationStatus oldStatus = vet.getVerificationStatus();
        VeterinarianVerificationStatus newStatus = Boolean.TRUE.equals(request.getApproved())
                ? VeterinarianVerificationStatus.APPROVED
                : VeterinarianVerificationStatus.REJECTED;

        vet.setVerificationStatus(newStatus);
        Veterinarian saved = veterinarianRepository.save(vet);

        // Audit log
        String oldSnapshot = "{\"verificationStatus\":\"" + oldStatus + "\"}";
        String newSnapshot = "{\"verificationStatus\":\"" + newStatus + "\",\"rejectionReason\":\"" + (request.getRejectionReason() != null ? request.getRejectionReason() : "") + "\"}";
        auditLogService.logAction(
                "PROFESSIONAL_VERIFICATION_UPDATED",
                "PROFESSIONALS",
                "VETERINARIAN",
                veterinarianId,
                oldSnapshot,
                newSnapshot
        );

        log.info("Admin updated veterinarian {} verification to {}", veterinarianId, newStatus);
        return mapVetResponse(saved);
    }

    @Override
    @Transactional
    public AdminVeterinarianResponse updateVeterinarianStatus(Long veterinarianId, UpdateEntityStatusRequest request) {
        Veterinarian vet = veterinarianRepository.findByIdForUpdate(veterinarianId)
                .orElseThrow(() -> new ResourceNotFoundException("Veterinarian not found with id: " + veterinarianId));

        Boolean oldActive = vet.getIsActive();
        vet.setIsActive(request.getIsActive());
        Veterinarian saved = veterinarianRepository.save(vet);

        String oldSnapshot = "{\"isActive\":" + oldActive + "}";
        String newSnapshot = "{\"isActive\":" + request.getIsActive() + ",\"reason\":\"" + (request.getReason() != null ? request.getReason() : "") + "\"}";
        auditLogService.logAction(
                "PROFESSIONAL_STATUS_UPDATED",
                "PROFESSIONALS",
                "VETERINARIAN",
                veterinarianId,
                oldSnapshot,
                newSnapshot
        );

        log.info("Admin updated veterinarian {} active status to {}", veterinarianId, request.getIsActive());
        return mapVetResponse(saved);
    }

    @Override
    public void requestServiceProviderEmailOtp(IssueUserPasswordRequest request) {
        sendProfessionalEmailOtp(
                providerEmailOtps,
                request.getEmail(),
                "Verify service provider email",
                "Use this code to verify the service provider email:"
        );
    }

    @Override
    public void verifyServiceProviderEmailOtp(VerifyOtpRequest request) {
        verifyProfessionalEmailOtp(providerEmailOtps, request.getEmail(), request.getOtp(), "service provider");
    }

    private void sendProfessionalEmailOtp(
            ConcurrentHashMap<String, VetEmailOtp> store,
            String rawEmail,
            String subject,
            String intro
    ) {
        String email = rawEmail.trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("User already exists with email: " + email);
        }

        Instant now = Instant.now();
        VetEmailOtp existing = store.get(email);
        if (existing != null && now.isBefore(existing.sentAt.plus(VET_OTP_COOLDOWN))) {
            long remaining = Duration.between(now, existing.sentAt.plus(VET_OTP_COOLDOWN)).toSeconds();
            throw new BusinessRuleException("Please wait " + Math.max(1, remaining) + " seconds before requesting a new code.");
        }

        String otp = String.valueOf(100000 + secureRandom.nextInt(900000));
        store.put(email, new VetEmailOtp(otp, now.plus(VET_OTP_TTL), now));

        String message = (intro != null && !intro.isBlank()) ? intro : "Use this code to verify the account.";
        String body = emailTemplateService.buildOtpEmail(
                null,
                otp,
                "Account Verification",
                message + " The account is created only after this code is entered.",
                5
        );
        if (!emailService.sendEmail(email, subject, body)) {
            store.remove(email);
            throw new BusinessRuleException("The verification code could not be emailed to " + email + ". Check the address and try again.");
        }
        log.info("Emailed verification code to {}", email);
    }

    private void verifyProfessionalEmailOtp(
            ConcurrentHashMap<String, VetEmailOtp> store,
            String rawEmail,
            String otp,
            String label
    ) {
        String email = rawEmail.trim().toLowerCase();
        VetEmailOtp pending = store.get(email);
        if (pending == null) {
            throw new BusinessRuleException("Send a verification code to this email before continuing.");
        }
        if (Instant.now().isAfter(pending.expiresAt)) {
            store.remove(email);
            throw new BusinessRuleException("The verification code expired. Send a new code.");
        }

        pending.attempts++;
        if (pending.attempts > VET_OTP_MAX_ATTEMPTS) {
            store.remove(email);
            throw new BusinessRuleException("Too many incorrect codes. Send a new code.");
        }
        if (!pending.otp.equals(otp.trim())) {
            throw new BusinessRuleException("That code does not match the one emailed to this address.");
        }

        pending.verified = true;
        pending.expiresAt = Instant.now().plus(Duration.ofMinutes(15));
        log.info("Verified {} email {}", label, email);
    }

    @Override
    @Transactional
    public AdminServiceProviderResponse createServiceProvider(AdminCreateServiceProviderRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("User already exists with email: " + request.getEmail());
        }

        if (request.getPhone() != null && !request.getPhone().isBlank() && userRepository.existsByPhone(request.getPhone().trim())) {
            throw new DuplicateResourceException("User already exists with phone: " + request.getPhone());
        }

        // OTP verification is optional and no longer mandatory for admin registration
        providerEmailOtps.remove(email);

        String rawPassword = (request.getPassword() != null && !request.getPassword().isBlank())
                ? request.getPassword()
                : UUID.randomUUID().toString().substring(0, 10) + "Aa1!";

        User user = User.builder()
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .email(email)
                .phone(request.getPhone() != null && !request.getPhone().isBlank() ? request.getPhone().trim() : null)
                .profileImage(request.getProfileImage() != null && !request.getProfileImage().isBlank() ? request.getProfileImage().trim() : null)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .status(UserStatus.ACTIVE)
                .emailVerified(true)
                .phoneVerified(false)
                .build();

        User savedUser = userRepository.save(user);

        Role providerRole = roleRepository.findByRoleCode("SERVICE_PROVIDER")
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with code: SERVICE_PROVIDER"));

        UserRole userRole = UserRole.builder()
                .user(savedUser)
                .role(providerRole)
                .build();
        userRoleRepository.save(userRole);
        savedUser.setUserRoles(List.of(userRole));

        ServiceProvider provider = ServiceProvider.builder()
                .user(savedUser)
                .providerType(request.getProviderType())
                .businessName(request.getBusinessName().trim())
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .phone(request.getBusinessPhone() != null ? request.getBusinessPhone().trim() : savedUser.getPhone())
                .address(request.getAddress() != null ? request.getAddress().trim() : null)
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .experienceYears(request.getExperienceYears() != null ? request.getExperienceYears() : 0)
                .verificationStatus(ServiceProviderVerificationStatus.APPROVED)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        ServiceProvider savedProvider = serviceProviderRepository.save(provider);
        providerEmailOtps.remove(email);

        String newSnapshot = "{\"providerId\":" + savedProvider.getId() + ",\"email\":\"" + savedUser.getEmail() + "\",\"businessName\":\"" + savedProvider.getBusinessName() + "\"}";
        auditLogService.logAction(
                "SERVICE_PROVIDER_CREATED",
                "PROFESSIONALS",
                "SERVICE_PROVIDER",
                savedProvider.getId(),
                null,
                newSnapshot
        );

        try {
            String subject = "Your PawConnect account password";
            String body = emailTemplateService.buildTemporaryPasswordEmail(
                    email,
                    rawPassword,
                    60
            );
            emailService.sendEmail(email, subject, body);
            log.info("Automatically dispatched credentials email to newly registered service provider {}", email);
        } catch (Exception ex) {
            log.warn("Failed to dispatch credentials email to {}: {}", email, ex.getMessage());
        }

        log.info("Admin registered new service provider {} ({})", savedUser.getEmail(), savedProvider.getBusinessName());
        return mapProviderResponse(savedProvider);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminServiceProviderResponse> getServiceProviders(
            ServiceProviderVerificationStatus verificationStatus,
            Boolean isActive,
            ProviderType providerType,
            String search,
            Pageable pageable
    ) {
        Pageable sanitized = sanitizePageable(pageable, ALLOWED_PROVIDER_SORT_FIELDS);

        Specification<ServiceProvider> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (verificationStatus != null) {
                predicates.add(cb.equal(root.get("verificationStatus"), verificationStatus));
            }
            if (isActive != null) {
                predicates.add(cb.equal(root.get("isActive"), isActive));
            }
            if (providerType != null) {
                predicates.add(cb.equal(root.get("providerType"), providerType));
            }
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Join<ServiceProvider, User> userJoin = root.join("user", JoinType.LEFT);
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("businessName")), pattern),
                        cb.like(cb.lower(root.get("phone")), pattern),
                        cb.like(cb.lower(root.get("address")), pattern),
                        cb.like(cb.lower(userJoin.get("firstName")), pattern),
                        cb.like(cb.lower(userJoin.get("lastName")), pattern),
                        cb.like(cb.lower(userJoin.get("email")), pattern)
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<ServiceProvider> page = serviceProviderRepository.findAll(spec, sanitized);
        return PageResponse.from(page.map(this::mapProviderResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public AdminServiceProviderResponse getServiceProviderById(Long providerId) {
        ServiceProvider provider = serviceProviderRepository.findById(providerId)
                .orElseThrow(() -> new ResourceNotFoundException("ServiceProvider not found with id: " + providerId));
        return mapProviderResponse(provider);
    }

    @Override
    @Transactional
    public AdminServiceProviderResponse updateServiceProviderVerification(Long providerId, VerificationRequest request) {
        ServiceProvider provider = serviceProviderRepository.findByIdForUpdate(providerId)
                .orElseThrow(() -> new ResourceNotFoundException("ServiceProvider not found with id: " + providerId));

        ServiceProviderVerificationStatus oldStatus = provider.getVerificationStatus();
        ServiceProviderVerificationStatus newStatus = Boolean.TRUE.equals(request.getApproved())
                ? ServiceProviderVerificationStatus.APPROVED
                : ServiceProviderVerificationStatus.REJECTED;

        provider.setVerificationStatus(newStatus);
        ServiceProvider saved = serviceProviderRepository.save(provider);

        // Audit log
        String oldSnapshot = "{\"verificationStatus\":\"" + oldStatus + "\"}";
        String newSnapshot = "{\"verificationStatus\":\"" + newStatus + "\",\"rejectionReason\":\"" + (request.getRejectionReason() != null ? request.getRejectionReason() : "") + "\"}";
        auditLogService.logAction(
                "PROFESSIONAL_VERIFICATION_UPDATED",
                "PROFESSIONALS",
                "SERVICE_PROVIDER",
                providerId,
                oldSnapshot,
                newSnapshot
        );

        log.info("Admin updated service provider {} verification to {}", providerId, newStatus);
        return mapProviderResponse(saved);
    }

    @Override
    @Transactional
    public AdminServiceProviderResponse updateServiceProviderStatus(Long providerId, UpdateEntityStatusRequest request) {
        ServiceProvider provider = serviceProviderRepository.findByIdForUpdate(providerId)
                .orElseThrow(() -> new ResourceNotFoundException("ServiceProvider not found with id: " + providerId));

        Boolean oldActive = provider.getIsActive();
        provider.setIsActive(request.getIsActive());
        ServiceProvider saved = serviceProviderRepository.save(provider);

        String oldSnapshot = "{\"isActive\":" + oldActive + "}";
        String newSnapshot = "{\"isActive\":" + request.getIsActive() + ",\"reason\":\"" + (request.getReason() != null ? request.getReason() : "") + "\"}";
        auditLogService.logAction(
                "PROFESSIONAL_STATUS_UPDATED",
                "PROFESSIONALS",
                "SERVICE_PROVIDER",
                providerId,
                oldSnapshot,
                newSnapshot
        );

        log.info("Admin updated service provider {} active status to {}", providerId, request.getIsActive());
        return mapProviderResponse(saved);
    }

    private AdminVeterinarianResponse mapVetResponse(Veterinarian vet) {
        String fullName = null;
        String email = null;
        String phone = null;
        Long userId = null;

        if (vet.getUser() != null) {
            userId = vet.getUser().getId();
            email = vet.getUser().getEmail();
            phone = vet.getUser().getPhone();
            fullName = (vet.getUser().getFirstName() != null ? vet.getUser().getFirstName() : "")
                    + (vet.getUser().getLastName() != null ? " " + vet.getUser().getLastName() : "");
            fullName = fullName.trim();
        }

        return AdminVeterinarianResponse.builder()
                .id(vet.getId())
                .userId(userId)
                .userFullName(fullName)
                .userEmail(email)
                .userPhone(phone)
                .specialization(vet.getSpecialization())
                .qualification(vet.getQualification())
                .licenseNumber(vet.getLicenseNumber())
                .experienceYears(vet.getExperienceYears())
                .clinicName(vet.getClinicName())
                .clinicAddress(vet.getClinicAddress())
                .clinicLatitude(vet.getClinicLatitude())
                .clinicLongitude(vet.getClinicLongitude())
                .consultationFee(vet.getConsultationFee())
                .bio(vet.getBio())
                .verificationStatus(vet.getVerificationStatus())
                .isActive(vet.getIsActive())
                .profileImage(vet.getUser() != null ? vet.getUser().getProfileImage() : null)
                .createdAt(vet.getCreatedAt())
                .updatedAt(vet.getUpdatedAt())
                .build();
    }

    private AdminServiceProviderResponse mapProviderResponse(ServiceProvider provider) {
        String fullName = null;
        String email = null;
        String userPhone = null;
        Long userId = null;

        if (provider.getUser() != null) {
            userId = provider.getUser().getId();
            email = provider.getUser().getEmail();
            userPhone = provider.getUser().getPhone();
            fullName = (provider.getUser().getFirstName() != null ? provider.getUser().getFirstName() : "")
                    + (provider.getUser().getLastName() != null ? " " + provider.getUser().getLastName() : "");
            fullName = fullName.trim();
        }

        return AdminServiceProviderResponse.builder()
                .id(provider.getId())
                .userId(userId)
                .userFullName(fullName)
                .userEmail(email)
                .userPhone(userPhone)
                .providerType(provider.getProviderType())
                .businessName(provider.getBusinessName())
                .description(provider.getDescription())
                .phone(provider.getPhone())
                .address(provider.getAddress())
                .latitude(provider.getLatitude())
                .longitude(provider.getLongitude())
                .experienceYears(provider.getExperienceYears())
                .verificationStatus(provider.getVerificationStatus())
                .isActive(provider.getIsActive())
                .profileImage(provider.getUser() != null ? provider.getUser().getProfileImage() : null)
                .createdAt(provider.getCreatedAt())
                .updatedAt(provider.getUpdatedAt())
                .build();
    }

    private Pageable sanitizePageable(Pageable pageable, Set<String> allowedSorts) {
        int page = Math.max(0, pageable.getPageNumber());
        int size = Math.min(MAX_PAGE_SIZE, Math.max(1, pageable.getPageSize()));

        List<Sort.Order> validOrders = new ArrayList<>();
        for (Sort.Order order : pageable.getSort()) {
            String prop = order.getProperty();
            // Map frontend table column keys to entity properties
            if ("provider".equalsIgnoreCase(prop) || "name".equalsIgnoreCase(prop)) {
                prop = "businessName";
            } else if ("status".equalsIgnoreCase(prop)) {
                prop = "verificationStatus";
            } else if ("discipline".equalsIgnoreCase(prop) || "type".equalsIgnoreCase(prop)) {
                prop = "providerType";
            } else if ("experience".equalsIgnoreCase(prop)) {
                prop = "experienceYears";
            } else if ("clinic".equalsIgnoreCase(prop)) {
                prop = "clinicName";
            } else if ("fee".equalsIgnoreCase(prop)) {
                prop = "consultationFee";
            }

            if (allowedSorts.contains(prop)) {
                validOrders.add(new Sort.Order(order.getDirection(), prop));
            } else {
                log.debug("Skipping unrecognized sort field '{}'", prop);
            }
        }

        Sort sort = validOrders.isEmpty()
                ? Sort.by(Sort.Direction.DESC, "createdAt")
                : Sort.by(validOrders);

        return PageRequest.of(page, size, sort);
    }
}
