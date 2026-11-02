package com.example.PawConnect.repository;

import com.example.PawConnect.model.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class RepositoryHardeningTests {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductCategoryRepository productCategoryRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private VeterinarianRepository veterinarianRepository;

    @Autowired
    private PetRepository petRepository;

    @Test
    void testUserRoleLookupLoadsOnlyTargetUserRoles() {
        User user1 = userRepository.save(User.builder()
                .firstName("Alice").lastName("Smith").email("alice@test.com")
                .passwordHash("hash").status(UserStatus.ACTIVE).build());

        User user2 = userRepository.save(User.builder()
                .firstName("Bob").lastName("Jones").email("bob@test.com")
                .passwordHash("hash").status(UserStatus.ACTIVE).build());

        Role roleOwner = roleRepository.findByRoleCode("PET_OWNER")
                .orElseGet(() -> roleRepository.save(Role.builder().roleCode("PET_OWNER").roleName("Pet Owner").build()));
        Role roleAdmin = roleRepository.findByRoleCode("ADMIN")
                .orElseGet(() -> roleRepository.save(Role.builder().roleCode("ADMIN").roleName("Admin").build()));

        userRoleRepository.save(UserRole.builder().user(user1).role(roleOwner).build());
        userRoleRepository.save(UserRole.builder().user(user2).role(roleAdmin).build());

        List<UserRole> aliceRoles = userRoleRepository.findByUserIdWithRole(user1.getId());
        assertEquals(1, aliceRoles.size());
        assertEquals("PET_OWNER", aliceRoles.get(0).getRole().getRoleCode());

        List<UserRole> bobRoles = userRoleRepository.findByUserIdWithRole(user2.getId());
        assertEquals(1, bobRoles.size());
        assertEquals("ADMIN", bobRoles.get(0).getRole().getRoleCode());
    }

    @Test
    void testAtomicStockDecrement() {
        ProductCategory category = productCategoryRepository.save(ProductCategory.builder()
                .name("Accessories").isActive(true).build());

        Product product = productRepository.save(Product.builder()
                .category(category)
                .name("Pet Leash")
                .sku("SKU-LEASH-01")
                .price(new BigDecimal("19.99"))
                .stockQuantity(10)
                .status(ProductStatus.ACTIVE)
                .isActive(true)
                .build());

        // Decrement 3 units when stock is 10 (must succeed with 1 row updated)
        int updated = productRepository.decrementStock(product.getId(), 3);
        assertEquals(1, updated);

        Product refreshed = productRepository.findById(product.getId()).orElseThrow();
        assertEquals(7, refreshed.getStockQuantity());

        // Try to decrement 10 units when stock is only 7 (must fail with 0 rows updated)
        int failedUpdate = productRepository.decrementStock(product.getId(), 10);
        assertEquals(0, failedUpdate);

        refreshed = productRepository.findById(product.getId()).orElseThrow();
        assertEquals(7, refreshed.getStockQuantity(), "Stock must remain unchanged when insufficient");
    }

    @Test
    void testAppointmentOverlapDetection() {
        User user = userRepository.save(User.builder()
                .firstName("Doc").lastName("Brown").email("vet@test.com")
                .passwordHash("hash").status(UserStatus.ACTIVE).build());

        Veterinarian vet = veterinarianRepository.save(Veterinarian.builder()
                .user(user)
                .licenseNumber("VET-LIC-12345")
                .consultationFee(new BigDecimal("50.00"))
                .verificationStatus(VeterinarianVerificationStatus.APPROVED)
                .isActive(true)
                .build());

        Pet pet = petRepository.save(Pet.builder()
                .owner(user)
                .name("Max")
                .species("Dog")
                .gender(PetGender.MALE)
                .status(PetStatus.ACTIVE)
                .build());

        LocalDate appointmentDate = LocalDate.now().plusDays(2);
        LocalTime existingStart = LocalTime.of(10, 0);
        LocalTime existingEnd = LocalTime.of(10, 30);

        appointmentRepository.save(Appointment.builder()
                .appointmentNo("APT-001")
                .veterinarian(vet)
                .pet(pet)
                .appointmentDate(appointmentDate)
                .startTime(existingStart)
                .endTime(existingEnd)
                .consultationFee(new BigDecimal("50.00"))
                .status(AppointmentStatus.CONFIRMED)
                .build());

        // Test Overlap 1: Exact same slot (10:00 - 10:30)
        List<Appointment> overlaps1 = appointmentRepository.findOverlappingAppointments(
                vet.getId(), appointmentDate, LocalTime.of(10, 0), LocalTime.of(10, 30));
        assertFalse(overlaps1.isEmpty(), "Identical time slot must overlap");

        // Test Overlap 2: Intersecting slot (10:15 - 10:45)
        List<Appointment> overlaps2 = appointmentRepository.findOverlappingAppointments(
                vet.getId(), appointmentDate, LocalTime.of(10, 15), LocalTime.of(10, 45));
        assertFalse(overlaps2.isEmpty(), "Overlapping start must be detected");

        // Test Non-Overlap: Adjacent subsequent slot (10:30 - 11:00)
        List<Appointment> nonOverlaps = appointmentRepository.findOverlappingAppointments(
                vet.getId(), appointmentDate, LocalTime.of(10, 30), LocalTime.of(11, 0));
        assertTrue(nonOverlaps.isEmpty(), "Adjacent slot starting at end time must NOT overlap");
    }
}
