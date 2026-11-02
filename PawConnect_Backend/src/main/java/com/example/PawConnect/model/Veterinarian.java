package com.example.PawConnect.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "veterinarians", indexes = {
    @Index(name = "idx_vets_user_id", columnList = "user_id"),
    @Index(name = "idx_vets_verification", columnList = "verification_status"),
    @Index(name = "idx_vets_active", columnList = "is_active"),
    @Index(name = "idx_vets_license", columnList = "license_number", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
@ToString(exclude = {"user", "availabilities", "appointments"})
@EntityListeners(AuditingEntityListener.class)
public class Veterinarian {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "specialization", length = 150)
    private String specialization;

    @Column(name = "qualification", length = 255)
    private String qualification;

    @Column(name = "license_number", length = 100, unique = true, nullable = false)
    private String licenseNumber;

    @Column(name = "experience_years")
    private Integer experienceYears;

    @Column(name = "clinic_name", length = 200)
    private String clinicName;

    @Column(name = "clinic_address", columnDefinition = "TEXT")
    private String clinicAddress;

    @Column(name = "clinic_latitude", precision = 10, scale = 7)
    private BigDecimal clinicLatitude;

    @Column(name = "clinic_longitude", precision = 10, scale = 7)
    private BigDecimal clinicLongitude;

    @Column(name = "consultation_fee", precision = 10, scale = 2, nullable = false)
    private BigDecimal consultationFee;

    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", nullable = false)
    private VeterinarianVerificationStatus verificationStatus;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "veterinarian", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<VeterinarianAvailability> availabilities;

    // Do NOT cascade delete appointments when a veterinarian is deactivated or removed
    @OneToMany(mappedBy = "veterinarian", fetch = FetchType.LAZY)
    private List<Appointment> appointments;
}
