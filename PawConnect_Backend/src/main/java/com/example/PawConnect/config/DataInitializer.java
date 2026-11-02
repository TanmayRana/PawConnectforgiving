package com.example.PawConnect.config;

import com.example.PawConnect.model.Role;
import com.example.PawConnect.model.User;
import com.example.PawConnect.model.UserRole;
import com.example.PawConnect.model.UserStatus;
import com.example.PawConnect.repository.RoleRepository;
import com.example.PawConnect.repository.UserRepository;
import com.example.PawConnect.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import com.example.PawConnect.model.ProductCategory;
import com.example.PawConnect.repository.ProductCategoryRepository;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "application.init.default-admin.enabled", havingValue = "true", matchIfMissing = true)
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final ProductCategoryRepository productCategoryRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${application.init.default-admin.email:admin@gmail.com}")
    private String adminEmail;

    @Value("${application.init.default-admin.password:admin1234}")
    private String adminPassword;

    @Value("${application.init.default-admin.first-name:Super}")
    private String adminFirstName;

    @Value("${application.init.default-admin.last-name:Admin}")
    private String adminLastName;

    @Override
    @Transactional
    public void run(String... args) {
        initRoles();
        initDefaultAdmin();
        initProductCategories();
    }

    private void initRoles() {
        Map<String, String[]> standardRoles = Map.of(
                "ADMIN", new String[]{"Admin", "Platform Administrator with full management privileges"},
                "PET_OWNER", new String[]{"Pet Owner", "Default customer and pet owner role"},
                "VETERINARIAN", new String[]{"Veterinarian", "Licensed veterinary care professional"},
                "SERVICE_PROVIDER", new String[]{"Service Provider", "Verified pet care service provider"}
        );

        for (Map.Entry<String, String[]> entry : standardRoles.entrySet()) {
            String roleCode = entry.getKey();
            String roleName = entry.getValue()[0];
            String description = entry.getValue()[1];

            roleRepository.findByRoleCode(roleCode).orElseGet(() -> {
                log.info("Initializing system role: {}", roleCode);
                return roleRepository.save(Role.builder()
                        .roleCode(roleCode)
                        .roleName(roleName)
                        .description(description)
                        .build());
            });
        }
    }

    private void initDefaultAdmin() {
        String normalizedEmail = adminEmail.toLowerCase().trim();
        Role adminRole = roleRepository.findByRoleCode("ADMIN")
                .orElseThrow(() -> new IllegalStateException("ADMIN role not initialized"));

        userRepository.findByEmail(normalizedEmail).ifPresentOrElse(
                user -> {
                    List<UserRole> roles = userRoleRepository.findByUserIdWithRole(user.getId());
                    boolean hasAdminRole = roles.stream()
                            .anyMatch(ur -> ur.getRole() != null && "ADMIN".equalsIgnoreCase(ur.getRole().getRoleCode()));
                    if (!hasAdminRole) {
                        userRoleRepository.save(UserRole.builder()
                                .user(user)
                                .role(adminRole)
                                .build());
                        log.info("Granted ADMIN role to existing user: {}", normalizedEmail);
                    }
                },
                () -> {
                    User superAdmin = User.builder()
                            .firstName(adminFirstName.trim())
                            .lastName(adminLastName.trim())
                            .email(normalizedEmail)
                            .passwordHash(passwordEncoder.encode(adminPassword))
                            .status(UserStatus.ACTIVE)
                            .emailVerified(true)
                            .phoneVerified(true)
                            .tokenVersion(1)
                            .build();

                    User savedUser = userRepository.save(superAdmin);
                    userRoleRepository.save(UserRole.builder()
                            .user(savedUser)
                            .role(adminRole)
                            .build());

                    log.info("Successfully initialized super admin user: {}", normalizedEmail);
                }
        );
    }

    private void initProductCategories() {
        if (productCategoryRepository.count() == 0) {
            log.info("Initializing standard product categories...");
            List<ProductCategory> defaultCategories = List.of(
                    ProductCategory.builder()
                            .name("Food & Nutrition")
                            .description("Premium nutrition, balanced raw recipes, and kibble")
                            .isActive(true)
                            .build(),
                    ProductCategory.builder()
                            .name("Treats & Chews")
                            .description("Healthy snacks, dental chews, and training rewards")
                            .isActive(true)
                            .build(),
                    ProductCategory.builder()
                            .name("Toys & Enrichment")
                            .description("Interactive toys, puzzle games, and durable play items")
                            .isActive(true)
                            .build(),
                    ProductCategory.builder()
                            .name("Grooming & Coat Care")
                            .description("Botanical shampoos, grooming brushes, and gentle coat care")
                            .isActive(true)
                            .build(),
                    ProductCategory.builder()
                            .name("Beds & Furniture")
                            .description("Cozy orthopedic beds, cushions, and scratch posts")
                            .isActive(true)
                            .build(),
                    ProductCategory.builder()
                            .name("Health & Wellness")
                            .description("Supplements, vitamins, and healthcare essentials")
                            .isActive(true)
                            .build()
            );
            productCategoryRepository.saveAll(defaultCategories);
            log.info("Successfully initialized {} standard product categories.", defaultCategories.size());
        }
    }
}
